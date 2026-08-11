import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search as SearchIcon,
  ArrowLeft,
  X,
  ArrowRightLeft,
  ChevronDown,
} from "lucide-react";
import useGlobalSearch from "../../hooks/useGlobalSearch";
import { useCurrencies } from "../../hooks/useCurrencies";
import { useAccounts } from "../../hooks/useAccounts";
import { formatMoney } from "../../utils/format";
import { ACCOUNT_TYPE_LABELS } from "../../utils/constants";
import CategoryIcon from "../../components/CategoryIcon";

const TABS = [
  { id: "all", label: "전체" },
  { id: "transactions", label: "거래" },
  { id: "accounts", label: "계좌" },
  { id: "categories", label: "카테고리" },
];

const TYPE_STYLES = {
  income: { sign: "+", color: "text-mint" },
  expense: { sign: "-", color: "text-coral" },
  transfer: { sign: "", color: "text-sub" },
};

const Search = () => {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { data: currencies = [] } = useCurrencies();
  const { data: accounts = [] } = useAccounts();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useGlobalSearch(query);

  const primaryCurrency = useMemo(() => {
    if (accounts.length === 0) return currencies.find((c) => c.code === "USD");
    const freq = {};
    accounts.forEach((a) => {
      freq[a.currency] = (freq[a.currency] || 0) + 1;
    });
    const code = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    return currencies.find((c) => c.code === code);
  }, [accounts, currencies]);

  const fmt = useCallback(
    (amount, currency) => formatMoney(amount, currency || primaryCurrency),
    [primaryCurrency],
  );

  const getCurrency = useCallback(
    (code) => currencies.find((c) => c.code === code) || primaryCurrency,
    [currencies, primaryCurrency],
  );

  const handleTxClick = (tx) => {
    const parts = tx.date.split("-");
    navigate(`/transactions?year=${parts[0]}&month=${Number(parts[1])}&highlight=${tx.id}`);
  };

  const handleAccountClick = (account) => {
    navigate(`/accounts?highlight=${account.id}`);
  };

  const showTx = tab === "all" || tab === "transactions";
  const showAccounts = tab === "all" || tab === "accounts";
  const showCat = tab === "all" || tab === "categories";

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold text-text">검색</h2>
      </div>

      {/* Search Input */}
      <div className="relative">
        <SearchIcon
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-sub"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="거래, 계좌, 카테고리 검색..."
          className="w-full pl-11 pr-10 py-3 dash-card bg-surface shadow-sm rounded-2xl text-[14px] text-text outline-none border-none focus:ring-2 focus:ring-mint/30"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sub p-0.5 rounded bg-transparent border-none cursor-pointer hover:text-text"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Type Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border-none cursor-pointer transition-colors ${
              tab === t.id
                ? "bg-text text-surface"
                : "bg-light text-sub hover:bg-border"
            }`}
          >
            {t.label}
            {results.isValid && t.id === "all" && results.totalCount > 0 && (
              <span className="ml-1 text-[10px] opacity-70">
                {results.totalCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results */}
      {!results.isValid ? (
        <div className="text-center py-16 text-[13px] text-sub">
          2글자 이상 입력하면 검색이 시작됩니다
        </div>
      ) : results.totalCount === 0 && !results.transactions.loading ? (
        <div className="text-center py-16 text-[13px] text-sub">
          검색 결과가 없습니다
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* 거래 결과 */}
          {showTx && results.transactions.total > 0 && (
            <div className="dash-card bg-surface shadow-sm rounded-2xl p-5">
              <h3 className="text-[13px] text-sub font-medium tracking-wide mb-3">
                거래 ({results.transactions.total}건)
              </h3>
              {results.transactions.data.map((tx, i) => {
                const style = TYPE_STYLES[tx.type];
                const cur = getCurrency(tx.currency);
                return (
                  <button
                    key={tx.id}
                    onClick={() => handleTxClick(tx)}
                    className={`flex items-center gap-3 py-2.5 w-full text-left bg-transparent border-none cursor-pointer hover:bg-light transition-colors rounded-lg px-1 -mx-1 ${
                      i < results.transactions.data.length - 1
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: tx.category?.color
                          ? tx.category.color + "18"
                          : "var(--color-light)",
                      }}
                    >
                      {tx.type === "transfer" ? (
                        <ArrowRightLeft size={14} className="text-sub" />
                      ) : (
                        <CategoryIcon
                          name={tx.category?.icon}
                          size={14}
                          style={{
                            color: tx.category?.color || "#94a3b8",
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-text truncate">
                        {tx.description ||
                          tx.category?.name ||
                          (tx.type === "transfer" ? "이체" : "거래")}
                      </div>
                      <div className="text-[11px] text-sub truncate">
                        {tx.account?.name}
                        {tx.category &&
                          tx.type !== "transfer" &&
                          ` · ${tx.category.name}`}
                        {" · "}
                        {tx.date}
                      </div>
                    </div>
                    <span
                      className={`text-[13px] font-semibold shrink-0 ${style.color}`}
                    >
                      {style.sign}
                      {formatMoney(tx.amount, cur)}
                    </span>
                  </button>
                );
              })}
              {results.transactions.hasMore && (
                <button
                  onClick={results.transactions.loadMore}
                  disabled={results.transactions.loading}
                  className="w-full mt-3 py-2.5 rounded-lg text-[13px] font-medium text-mint bg-light border-none cursor-pointer hover:bg-border transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <ChevronDown size={14} />
                  {results.transactions.loading
                    ? "불러오는 중..."
                    : `${results.transactions.total - results.transactions.data.length}건 더 보기`}
                </button>
              )}
            </div>
          )}

          {/* 계좌 결과 */}
          {showAccounts && results.accounts.total > 0 && (
            <div className="dash-card bg-surface shadow-sm rounded-2xl p-5">
              <h3 className="text-[13px] text-sub font-medium tracking-wide mb-3">
                계좌 ({results.accounts.total}건)
              </h3>
              {results.accounts.data.map((a, i) => {
                const cur = getCurrency(a.currency);
                const neg = a.balance < 0;
                return (
                  <button
                    key={a.id}
                    onClick={() => handleAccountClick(a)}
                    className={`flex items-center gap-3 py-2.5 w-full text-left bg-transparent border-none cursor-pointer hover:bg-light transition-colors rounded-lg px-1 -mx-1 ${
                      i < results.accounts.data.length - 1
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: a.color + "18" }}
                    >
                      <CategoryIcon
                        name={a.icon}
                        size={14}
                        style={{ color: a.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-text truncate">
                        {a.name}
                      </div>
                      <div className="text-[11px] text-sub">
                        {ACCOUNT_TYPE_LABELS[a.account_type] || a.account_type}
                        {" · "}
                        {a.currency}
                      </div>
                    </div>
                    <span
                      className={`text-[13px] font-semibold shrink-0 ${neg ? "text-coral" : "text-text"}`}
                    >
                      {formatMoney(a.balance, cur)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 카테고리 결과 */}
          {showCat && results.categories.total > 0 && (
            <div className="dash-card bg-surface shadow-sm rounded-2xl p-5">
              <h3 className="text-[13px] text-sub font-medium tracking-wide mb-3">
                카테고리 ({results.categories.total}건)
              </h3>
              {results.categories.data.map((cat, i) => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/categories?highlight=${cat.id}`)}
                  className={`flex items-center gap-3 py-2.5 w-full text-left bg-transparent border-none cursor-pointer hover:bg-light transition-colors rounded-lg px-1 -mx-1 ${
                    i < results.categories.data.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: cat.color + "18" }}
                  >
                    <CategoryIcon
                      name={cat.icon}
                      size={14}
                      style={{ color: cat.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-text truncate">
                      {cat.name}
                    </div>
                    <div className="text-[11px] text-sub">
                      {cat.type === "income" ? "수입" : "지출"} 카테고리
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 로딩 */}
          {results.transactions.loading &&
            results.transactions.data.length === 0 && (
              <div className="text-center py-10 text-[13px] text-sub">
                검색 중...
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Search;
