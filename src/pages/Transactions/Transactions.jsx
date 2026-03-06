import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import {
  useTransactions,
  useDeleteTransaction,
} from "../../hooks/useTransactions";
import { useCategories } from "../../hooks/useCategories";
import { useCurrencies } from "../../hooks/useCurrencies";
import { formatMoney } from "../../utils/format";
import CategoryIcon from "../../components/CategoryIcon";
import useUIStore from "../../store/useUIStore";
import useConfirm from "../../hooks/useConfirm";
import TransactionList from "./TransactionList";
import TransactionForm from "./TransactionForm";
import TransactionFilter from "./TransactionFilter";
import TransactionSkeleton from "./TransactionSkeleton";

const now = new Date();

const Transactions = () => {
  const [filters, setFilters] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    type: "all",
    search: "",
    categoryIds: [],
  });
  const confirm = useConfirm();

  const handleFilterChange = useCallback((next) => {
    setFilters((prev) => {
      if (next.type !== prev.type) {
        return { ...next, categoryIds: [] };
      }
      return next;
    });
  }, []);

  const handleCategoryToggle = useCallback((id) => {
    if (id === null) {
      setFilters((prev) => ({ ...prev, categoryIds: [] }));
      return;
    }
    setFilters((prev) => {
      const ids = prev.categoryIds;
      const next = ids.includes(id)
        ? ids.filter((v) => v !== id)
        : [...ids, id];
      return { ...prev, categoryIds: next };
    });
  }, []);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [filters.search]);

  const queryFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  const {
    data: transactions = [],
    rawData = [],
    isLoading,
  } = useTransactions(queryFilters);
  const showSkeleton = isLoading && transactions.length === 0;
  const { data: currencies = [] } = useCurrencies();
  const { data: categories = [] } = useCategories();
  const deleteTx = useDeleteTransaction();

  const { txFormOpen, txEditTarget, openTxForm, closeTxForm } = useUIStore();

  const filteredCategories = useMemo(() => {
    if (filters.type === "transfer") return [];

    const usedIds = new Set();
    rawData.forEach((tx) => {
      if (
        tx.category_id &&
        (filters.type === "all" || tx.type === filters.type)
      ) {
        usedIds.add(tx.category_id);
      }
    });

    return categories.filter((c) => usedIds.has(c.id));
  }, [categories, rawData, filters.type]);

  const getCurrencyByCode = useCallback(
    (code) => currencies.find((c) => c.code === code) ?? null,
    [currencies],
  );

  const handleEdit = useCallback((tx) => openTxForm(tx), [openTxForm]);

  const handleDuplicate = useCallback(
    (tx) => {
      openTxForm({
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency,
        account_id: tx.account_id,
        to_account_id: tx.to_account_id,
        category_id: tx.category_id,
        description: tx.description,
        memo: tx.memo,
        date: new Date().toISOString().split("T")[0],
        duplicateKey: Date.now(),
      });
    },
    [openTxForm],
  );

  const handleDelete = useCallback(
    async (tx) => {
      const ok = await confirm({
        title: "거래 삭제",
        message: "이 거래를 삭제하시겠습니까?",
        confirmText: "삭제",
        variant: "danger",
      });
      if (ok) deleteTx.mutate(tx);
    },
    [deleteTx, confirm],
  );

  const summary = useMemo(() => {
    const byCurrency = {};
    transactions.forEach((tx) => {
      if (!byCurrency[tx.currency]) {
        byCurrency[tx.currency] = { income: 0, expense: 0 };
      }
      if (tx.type === "income") byCurrency[tx.currency].income += tx.amount;
      if (tx.type === "expense") byCurrency[tx.currency].expense += tx.amount;
    });
    return byCurrency;
  }, [transactions]);

  const topExpenseCategories = useMemo(() => {
    const map = {};
    transactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const key = tx.category_id || "uncategorized";
        const name = tx.category?.name || "미분류";
        const icon = tx.category?.icon || "📦";
        const color = tx.category?.color || "#94a3b8";
        if (!map[key]) map[key] = { name, icon, color, total: 0 };
        map[key].total += tx.amount;
      });

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [transactions]);

  const totalExpense = topExpenseCategories.reduce((s, c) => s + c.total, 0);

  if (showSkeleton) return <TransactionSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text">거래내역</h2>
        <button
          onClick={() => openTxForm()}
          className="flex items-center gap-1.5 px-4 py-2 bg-mint text-white rounded-lg text-sm font-medium cursor-pointer border-none hover:bg-mint-hover transition-colors"
        >
          <Plus size={16} />
          거래 추가
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-[340px] shrink-0">
          <div className="lg:sticky lg:top-6 flex flex-col gap-4">
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-[13px] text-sub font-medium mb-4">
                {filters.month}월 요약
              </h3>
              {Object.keys(summary).length === 0 ? (
                <p className="text-[13px] text-sub">거래가 없습니다</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(summary).map(([code, s]) => {
                    const cur = getCurrencyByCode(code);
                    const net = s.income - s.expense;
                    return (
                      <div key={code} className="flex flex-col gap-2">
                        {Object.keys(summary).length > 1 && (
                          <div className="text-[11px] text-sub font-medium">
                            {code}
                          </div>
                        )}
                        <div className="flex justify-between text-[13px]">
                          <span className="text-sub">수입</span>
                          <span className="text-mint font-medium">
                            +{formatMoney(s.income, cur)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[13px]">
                          <span className="text-sub">지출</span>
                          <span className="text-coral font-medium">
                            -{formatMoney(s.expense, cur)}
                          </span>
                        </div>
                        <div className="h-px bg-border" />
                        <div className="flex justify-between text-[13px]">
                          <span className="text-sub">순수지</span>
                          <span
                            className={`font-semibold ${net >= 0 ? "text-mint" : "text-coral"}`}
                          >
                            {net >= 0 ? "+" : "-"}
                            {formatMoney(Math.abs(net), cur)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {topExpenseCategories.length > 0 && (
              <div className="bg-surface border border-border rounded-xl p-5">
                <h3 className="text-[13px] text-sub font-medium mb-3">
                  카테고리별 지출
                </h3>
                <div className="flex flex-col gap-2.5">
                  {topExpenseCategories.map((cat) => {
                    const pct =
                      totalExpense > 0
                        ? Math.round((cat.total / totalExpense) * 100)
                        : 0;
                    return (
                      <div key={cat.name} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="flex items-center gap-1.5 text-text">
                            <CategoryIcon
                              name={cat.icon}
                              size={14}
                              style={{ color: cat.color }}
                            />
                            {cat.name}
                          </span>
                          <span className="text-sub font-medium">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-light rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {filters.type !== "transfer" && filteredCategories.length > 0 && (
              <div className="hidden lg:block bg-surface border border-border rounded-xl p-5">
                <h3 className="text-[13px] text-sub font-medium mb-3">
                  카테고리 필터
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleCategoryToggle(null)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer border-none transition-colors ${
                      filters.categoryIds.length === 0
                        ? "bg-text text-surface"
                        : "bg-light text-sub"
                    }`}
                  >
                    전체
                  </button>
                  {filteredCategories.map((cat) => {
                    const selected = filters.categoryIds.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryToggle(cat.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer border-none transition-colors ${
                          selected ? "text-white" : "bg-light text-sub"
                        }`}
                        style={
                          selected
                            ? { backgroundColor: cat.color || "#94a3b8" }
                            : undefined
                        }
                      >
                        <CategoryIcon
                          name={cat.icon}
                          size={12}
                          style={{
                            color: selected ? "#fff" : cat.color || "#94a3b8",
                          }}
                        />
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <TransactionFilter
            filters={filters}
            onChange={handleFilterChange}
            categories={filteredCategories}
            categoryIds={filters.categoryIds}
            onCategoryToggle={handleCategoryToggle}
          />
          <TransactionList
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        </div>
      </div>

      <TransactionForm
        open={txFormOpen}
        onClose={closeTxForm}
        editTx={txEditTarget}
      />
    </div>
  );
};

export default Transactions;
