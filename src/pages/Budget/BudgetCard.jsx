import { useState } from "react";
import { Pencil, Trash2, ChevronDown } from "lucide-react";
import CategoryIcon from "../../components/CategoryIcon";
import { formatMoney } from "../../utils/format";
import { useCurrencyByCode } from "../../hooks/useCurrencies";

const getStatus = (pct) => {
  if (pct >= 100)
    return { color: "bg-coral", text: "text-coral", label: "초과" };
  if (pct >= 80)
    return { color: "bg-amber", text: "text-amber", label: "주의" };
  return { color: "bg-mint", text: "text-mint", label: "" };
};

const INITIAL_SHOW = 5;

const TxRow = ({ tx }) => {
  const currency = useCurrencyByCode(tx.currency);
  return (
    <div className="flex items-center gap-2 py-2 border-b border-border last:border-b-0">
      <span className="text-[11px] text-sub shrink-0 w-12">
        {tx.date.slice(5).replace("-", "/")}
      </span>
      <span className="text-[12px] text-text truncate flex-1">
        {tx.description || "거래"}
      </span>
      <span className="text-[11px] text-sub truncate max-w-[80px] shrink-0">
        {tx.account?.name}
      </span>
      <span className="text-[12px] font-medium text-coral shrink-0">
        -{formatMoney(tx.amount, currency)}
      </span>
    </div>
  );
};

const BudgetCard = ({ budget, spent, fmt, onEdit, onDelete, transactions = [], subCategories = [] }) => {
  const [expanded, setExpanded] = useState(false);
  const cat = budget.category;
  const remaining = budget.amount - spent;
  const pct = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
  const status = getStatus(pct);

  const sortedTxs = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const visibleTxs = expanded ? sortedTxs : sortedTxs.slice(0, INITIAL_SHOW);
  const hasMore = sortedTxs.length > INITIAL_SHOW;

  // 서브 카테고리별 지출 집계
  const subSpending = subCategories.length > 0
    ? subCategories
        .map((sub) => {
          const subSpent = transactions
            .filter((tx) => tx.category_id === sub.id)
            .reduce((s, tx) => s + tx.amount, 0);
          return { ...sub, spent: subSpent };
        })
        .filter((s) => s.spent > 0)
        .sort((a, b) => b.spent - a.spent)
    : [];

  return (
    <div className="dash-card bg-surface shadow-sm rounded-xl p-4 group">
      <div className="flex items-center gap-3 mb-3">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: (cat?.color || "#94a3b8") + "18" }}
        >
          <CategoryIcon
            name={cat?.icon}
            size={18}
            style={{ color: cat?.color || "#94a3b8" }}
          />
        </div>

        {/* Name + Status */}
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium text-text truncate">
            {cat?.name || "미분류"}
          </div>
          {status.label && (
            <span className={`text-[11px] font-medium ${status.text}`}>
              {status.label}
            </span>
          )}
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <div className="text-[14px] font-semibold text-text">
            {fmt(budget.amount)}
          </div>
          <div
            className={`text-[12px] font-medium ${remaining < 0 ? "text-coral" : "text-sub"}`}
          >
            {remaining < 0 ? `-${fmt(Math.abs(remaining))}` : fmt(remaining)}{" "}
            남음
          </div>
        </div>

        {/* Hover Actions */}
        <div className="hover-actions flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(budget);
            }}
            className="p-1.5 rounded-md text-sub hover:bg-light cursor-pointer bg-transparent border-none"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(budget);
            }}
            className="p-1.5 rounded-md text-error hover:bg-error-bg cursor-pointer bg-transparent border-none"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-light rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${status.color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Bottom Info */}
      <div className="flex justify-between mt-2 text-[12px] text-sub">
        <span>지출 {fmt(spent)}</span>
        <span>{pct}%</span>
      </div>

      {/* Sub-category Spending Bars */}
      {subSpending.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          {subSpending.map((sub) => {
            const subPct = spent > 0 ? Math.round((sub.spent / spent) * 100) : 0;
            return (
              <div key={sub.id} className="flex items-center gap-2">
                <CategoryIcon
                  name={sub.icon}
                  size={11}
                  style={{ color: sub.color || cat?.color || "#94a3b8" }}
                />
                <span className="text-[11px] text-sub truncate w-14 shrink-0">
                  {sub.name}
                </span>
                <div className="flex-1 h-1.5 bg-light rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${subPct}%`,
                      backgroundColor: sub.color || cat?.color || "#94a3b8",
                    }}
                  />
                </div>
                <span className="text-[10px] text-sub w-16 text-right shrink-0">
                  {fmt(sub.spent)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction List */}
      {sortedTxs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          {visibleTxs.map((tx) => (
            <TxRow key={tx.id} tx={tx} />
          ))}

          {hasMore && !expanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
              }}
              className="flex items-center justify-center gap-1 w-full mt-2 py-1.5 text-[11px] text-mint font-medium bg-transparent border-none cursor-pointer hover:bg-light rounded-lg transition-colors"
            >
              <ChevronDown size={12} />
              {sortedTxs.length - INITIAL_SHOW}건 더 보기
            </button>
          )}

          <div className="mt-2 text-[11px] text-sub text-right">
            {sortedTxs.length}건 · {fmt(spent)}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetCard;
