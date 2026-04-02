import { useMemo } from "react";
import { Link } from "react-router";
import { Wallet } from "lucide-react";
import { useBudgets } from "../../hooks/useBudgets";
import { useTransactions } from "../../hooks/useTransactions";
import CategoryIcon from "../../components/CategoryIcon";

const now = new Date();
const YEAR = now.getFullYear();
const MONTH = now.getMonth() + 1;

const BudgetOverview = ({ fmt }) => {
  const { data: budgets = [] } = useBudgets(YEAR, MONTH);
  const { data: transactions = [] } = useTransactions({
    year: YEAR,
    month: MONTH,
  });

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

  const { totalBudget, totalSpent, pct, topItems } = useMemo(() => {
    const tb = budgets.reduce((s, b) => s + b.amount, 0);
    const ts = budgets.reduce(
      (s, b) => s + (spentByCategory[b.category_id] || 0),
      0,
    );
    const p = tb > 0 ? Math.round((ts / tb) * 100) : 0;

    const items = budgets
      .map((b) => {
        const spent = spentByCategory[b.category_id] || 0;
        return {
          ...b,
          spent,
          pct: b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0,
        };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);

    return { totalBudget: tb, totalSpent: ts, pct: p, topItems: items };
  }, [budgets, spentByCategory]);

  const statusColor =
    pct >= 100 ? "bg-coral" : pct >= 80 ? "bg-amber" : "bg-mint";

  if (budgets.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet size={14} className="text-sub" />
            <h3 className="text-[13px] text-sub font-medium">
              {MONTH}월 예산 현황
            </h3>
          </div>
          <Link
            to="/budget"
            className="text-mint text-[12px] font-medium no-underline"
          >
            설정 →
          </Link>
        </div>
        <p className="text-[13px] text-sub">설정된 예산이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet size={14} className="text-sub" />
          <h3 className="text-[13px] text-sub font-medium">
            {MONTH}월 예산 현황
          </h3>
        </div>
        <Link
          to="/budget"
          className="text-mint text-[12px] font-medium no-underline"
        >
          관리 →
        </Link>
      </div>

      {/* Summary */}
      <div className="flex items-end gap-2 mb-2">
        <span className="text-[18px] font-bold text-text">
          {fmt(totalSpent)}
        </span>
        <span className="text-[13px] text-sub mb-0.5">
          / {fmt(totalBudget)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2.5 bg-light rounded-full overflow-hidden mb-1">
        <div
          className={`h-full rounded-full transition-all duration-300 ${statusColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-sub mb-4">
        <span>소진율 {pct}%</span>
        <span>
          잔여{" "}
          {totalBudget - totalSpent < 0
            ? `-${fmt(Math.abs(totalBudget - totalSpent))}`
            : fmt(totalBudget - totalSpent)}
        </span>
      </div>

      {/* Top Categories */}
      <div className="flex flex-col gap-2">
        {topItems.map((b) => {
          const cat = b.category;
          const barColor =
            b.pct >= 100
              ? "bg-coral"
              : b.pct >= 80
                ? "bg-amber"
                : "bg-mint";
          return (
            <div key={b.id} className="flex items-center gap-2.5">
              <CategoryIcon
                name={cat?.icon}
                size={13}
                style={{ color: cat?.color || "#94a3b8" }}
              />
              <span className="text-[12px] text-text truncate w-16 shrink-0">
                {cat?.name || "미분류"}
              </span>
              <div className="flex-1 h-1.5 bg-light rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${Math.min(b.pct, 100)}%` }}
                />
              </div>
              <span
                className={`text-[11px] font-medium w-9 text-right shrink-0 ${
                  b.pct >= 100
                    ? "text-coral"
                    : b.pct >= 80
                      ? "text-amber"
                      : "text-sub"
                }`}
              >
                {b.pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetOverview;
