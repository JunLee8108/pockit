import { useMemo } from "react";
import { useTransactions } from "./useTransactions";
import { useBudgets } from "./useBudgets";

const now = new Date();
const YEAR = now.getFullYear();
const MONTH = now.getMonth() + 1;

const getBudgetAlerts = (budgets, spentByCategory) => {
  return budgets
    .map((b) => {
      const spent = spentByCategory[b.category_id] || 0;
      const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      if (pct < 80) return null;
      const isOver = pct >= 100;
      return {
        id: `bg-${b.id}`,
        type: "예산초과",
        typeBg: "bg-coral/15",
        typeColor: "text-coral",
        icon: b.category?.icon,
        iconColor: b.category?.color || "#94a3b8",
        label: `${b.category?.name || "미분류"} ${pct}%`,
        detail: spent,
        badge: isOver ? "초과" : "주의",
        badgeColor: isOver ? "text-coral" : "text-amber",
        link: "/budget",
        sortKey: -pct,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortKey - b.sortKey);
};

const useDashboardAlerts = (fmt) => {
  const { data: budgets = [] } = useBudgets(YEAR, MONTH);
  const { data: monthTxs = [] } = useTransactions({
    year: YEAR,
    month: MONTH,
  });

  const spentByCategory = useMemo(() => {
    const map = {};
    monthTxs
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const key = tx.category_id || "uncategorized";
        map[key] = (map[key] || 0) + tx.amount;
      });
    return map;
  }, [monthTxs]);

  const alerts = useMemo(() => {
    return getBudgetAlerts(budgets, spentByCategory).map((a) => ({
      ...a,
      detailFormatted: fmt(a.detail),
    }));
  }, [budgets, spentByCategory, fmt]);

  return alerts;
};

export default useDashboardAlerts;
