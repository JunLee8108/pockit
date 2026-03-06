import { useState, useMemo, useCallback } from "react";
import { Plus, Copy, Pencil, Trash2 } from "lucide-react";
import {
  useBudgets,
  useDeleteBudget,
  useCopyBudgets,
} from "../../hooks/useBudgets";
import { useTransactions } from "../../hooks/useTransactions";
import { useCurrencies } from "../../hooks/useCurrencies";
import { formatMoney } from "../../utils/format";
import CategoryIcon from "../../components/CategoryIcon";
import PeriodSelector from "../Statistics/PeriodSelector";
import BudgetCard from "./BudgetCard";
import BudgetForm from "./BudgetForm";
import BudgetSkeleton from "./BudgetSkeleton";
import SwipeableCard from "../Accounts/SwipeableCard";
import useConfirm from "../../hooks/useConfirm";

const now = new Date();

const Budget = () => {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [openCardId, setOpenCardId] = useState(null);
  const confirm = useConfirm();

  const { data: budgets = [], isLoading: budgetLoading } = useBudgets(
    year,
    month,
  );
  const { data: transactions = [] } = useTransactions({ year, month });
  const { data: currencies = [] } = useCurrencies();
  const deleteBudget = useDeleteBudget();
  const copyBudgets = useCopyBudgets();

  const getCurrencyByCode = useCallback(
    (code) => currencies.find((c) => c.code === code) ?? null,
    [currencies],
  );

  const primaryCurrency = useMemo(() => {
    if (budgets.length > 0) {
      const freq = {};
      budgets.forEach((b) => {
        freq[b.currency] = (freq[b.currency] || 0) + 1;
      });
      const code = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
      return getCurrencyByCode(code);
    }
    return getCurrencyByCode("USD");
  }, [budgets, getCurrencyByCode]);

  const fmt = useCallback(
    (amount) => formatMoney(amount, primaryCurrency),
    [primaryCurrency],
  );

  const spentByCategory = useMemo(() => {
    const map = {};
    transactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const key = tx.category_id || "uncategorized";
        map[key] = (map[key] || 0) + tx.amount;
      });
    return map;
  }, [transactions]);

  const budgetData = useMemo(() => {
    return budgets.map((b) => ({
      ...b,
      spent: spentByCategory[b.category_id] || 0,
      pct:
        b.amount > 0
          ? Math.round(((spentByCategory[b.category_id] || 0) / b.amount) * 100)
          : 0,
    }));
  }, [budgets, spentByCategory]);

  const sortedBudgetData = useMemo(() => {
    return [...budgetData].sort((a, b) => b.pct - a.pct);
  }, [budgetData]);

  const summary = useMemo(() => {
    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
    const totalSpent = budgets.reduce(
      (s, b) => s + (spentByCategory[b.category_id] || 0),
      0,
    );
    const remaining = totalBudget - totalSpent;
    const pct =
      totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    return { totalBudget, totalSpent, remaining, pct };
  }, [budgets, spentByCategory]);

  const existingCategoryIds = useMemo(
    () => new Set(budgets.map((b) => b.category_id)),
    [budgets],
  );

  const handlePeriod = useCallback((y, m) => {
    setYear(y);
    setMonth(m);
  }, []);

  const handleAdd = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleEdit = useCallback((budget) => {
    setEditTarget(budget);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (budget) => {
      const ok = await confirm({
        title: "예산 삭제",
        message: `"${budget.category?.name}" 예산을 삭제하시겠습니까?`,
        confirmText: "삭제",
        variant: "danger",
      });
      if (ok) deleteBudget.mutate(budget.id);
    },
    [deleteBudget, confirm],
  );

  const handleCopy = useCallback(async () => {
    const prevDate = new Date(year, month - 2, 1);
    const fromYear = prevDate.getFullYear();
    const fromMonth = prevDate.getMonth() + 1;

    const ok = await confirm({
      title: "전월 예산 복사",
      message: `${fromMonth}월 예산을 ${month}월로 복사하시겠습니까?\n이미 설정된 카테고리는 건너뜁니다.`,
      confirmText: "복사",
      variant: "info",
    });
    if (!ok) return;

    try {
      await copyBudgets.mutateAsync({
        fromYear,
        fromMonth,
        toYear: year,
        toMonth: month,
      });
    } catch (err) {
      await confirm({
        title: "오류",
        message: err.message || "복사 중 오류가 발생했습니다",
        confirmText: "확인",
        cancelText: "",
        variant: "danger",
      });
    }
  }, [year, month, copyBudgets, confirm]);

  if (budgetLoading && budgets.length === 0) return <BudgetSkeleton />;

  const statusColor =
    summary.pct >= 100
      ? "bg-coral"
      : summary.pct >= 80
        ? "bg-amber"
        : "bg-mint";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text">예산</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={copyBudgets.isPending}
            className="flex items-center gap-1.5 px-3 py-2 bg-light text-sub rounded-lg text-sm font-medium cursor-pointer border-none hover:bg-border transition-colors disabled:opacity-50"
          >
            <Copy size={14} />
            전월 복사
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-mint text-white rounded-lg text-sm font-medium cursor-pointer border-none hover:bg-mint-hover transition-colors"
          >
            <Plus size={16} />
            예산 추가
          </button>
        </div>
      </div>

      <PeriodSelector year={year} month={month} onChange={handlePeriod} />

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-[340px] shrink-0">
          <div className="lg:sticky lg:top-6 flex flex-col gap-4">
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-[13px] text-sub font-medium mb-4">
                {month}월 예산 요약
              </h3>

              {budgets.length === 0 ? (
                <p className="text-[13px] text-sub">설정된 예산이 없습니다</p>
              ) : (
                <>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-[22px] font-bold text-text">
                      {fmt(summary.totalSpent)}
                    </span>
                    <span className="text-[13px] text-sub mb-0.5">
                      / {fmt(summary.totalBudget)}
                    </span>
                  </div>

                  <div className="h-2.5 bg-light rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${statusColor}`}
                      style={{ width: `${Math.min(summary.pct, 100)}%` }}
                    />
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-sub">총 예산</span>
                      <span className="text-text font-medium">
                        {fmt(summary.totalBudget)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-sub">총 지출</span>
                      <span className="text-coral font-medium">
                        {fmt(summary.totalSpent)}
                      </span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between text-[13px]">
                      <span className="text-sub">잔여</span>
                      <span
                        className={`font-semibold ${summary.remaining < 0 ? "text-coral" : "text-mint"}`}
                      >
                        {summary.remaining < 0
                          ? `-${fmt(Math.abs(summary.remaining))}`
                          : fmt(summary.remaining)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-sub">소진율</span>
                      <span
                        className={`font-semibold ${
                          summary.pct >= 100
                            ? "text-coral"
                            : summary.pct >= 80
                              ? "text-amber"
                              : "text-text"
                        }`}
                      >
                        {summary.pct}%
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {sortedBudgetData.length > 0 && (
              <div className="bg-surface border border-border rounded-xl p-5">
                <h3 className="text-[13px] text-sub font-medium mb-3">
                  소진율 순위
                </h3>
                <div className="flex flex-col">
                  {sortedBudgetData.map((b) => {
                    const pctColor =
                      b.pct >= 100
                        ? "text-coral"
                        : b.pct >= 80
                          ? "text-amber"
                          : "text-sub";
                    return (
                      <div
                        key={b.id}
                        className="flex items-center gap-2.5 py-2 border-b border-border last:border-b-0"
                      >
                        <CategoryIcon
                          name={b.category?.icon}
                          size={14}
                          style={{ color: b.category?.color || "#94a3b8" }}
                        />
                        <span className="text-[13px] text-text truncate flex-1">
                          {b.category?.name}
                        </span>
                        <span
                          className={`text-[13px] font-semibold shrink-0 ${pctColor}`}
                        >
                          {b.pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {budgets.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-10 text-center">
              <p className="text-sub text-sm mb-3">
                이번 달 예산이 설정되지 않았습니다
              </p>
              <button
                onClick={handleAdd}
                className="text-mint text-sm font-medium cursor-pointer bg-transparent border-none"
              >
                첫 예산을 추가해보세요 →
              </button>
            </div>
          ) : (
            <div
              className="flex flex-col gap-3"
              onClick={() => setOpenCardId(null)}
            >
              {budgetData.map((b) => (
                <SwipeableCard
                  key={b.id}
                  cardId={b.id}
                  openCardId={openCardId}
                  onOpenChange={setOpenCardId}
                  actions={[
                    {
                      key: "edit",
                      label: "수정",
                      icon: <Pencil size={18} />,
                      className: "bg-mint",
                      onClick: () => handleEdit(b),
                    },
                    {
                      key: "delete",
                      label: "삭제",
                      icon: <Trash2 size={18} />,
                      className: "bg-coral",
                      onClick: () => handleDelete(b),
                    },
                  ]}
                >
                  <BudgetCard
                    budget={b}
                    spent={b.spent}
                    fmt={fmt}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </SwipeableCard>
              ))}
            </div>
          )}
        </div>
      </div>

      <BudgetForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        editBudget={editTarget}
        year={year}
        month={month}
        existingCategoryIds={existingCategoryIds}
      />
    </div>
  );
};

export default Budget;
