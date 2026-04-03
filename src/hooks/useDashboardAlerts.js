import { useMemo } from "react";
import { useFixedExpenses } from "./useFixedExpenses";
import { useTransactions } from "./useTransactions";
import { useBudgets } from "./useBudgets";

const now = new Date();
const YEAR = now.getFullYear();
const MONTH = now.getMonth() + 1;
const TODAY = now.getDate();

const getFixedExpenseAlerts = (fixedExpenses, registeredIds) => {
  return fixedExpenses
    .filter((fe) => {
      if (!fe.is_active) return false;
      if (registeredIds.has(fe.id)) return false;
      const diff = fe.billing_day - TODAY;
      return diff <= 3;
    })
    .map((fe) => {
      const diff = fe.billing_day - TODAY;
      let badge, badgeColor;
      if (diff < 0) {
        badge = "미등록";
        badgeColor = "text-coral";
      } else if (diff === 0) {
        badge = "오늘";
        badgeColor = "text-coral";
      } else if (diff === 1) {
        badge = "내일";
        badgeColor = "text-amber";
      } else {
        badge = `${diff}일 후`;
        badgeColor = "text-amber";
      }
      return {
        id: `fe-${fe.id}`,
        type: "고정지출",
        typeBg: "bg-amber/15",
        typeColor: "text-amber",
        icon: fe.category?.icon,
        iconColor: fe.category?.color || "#94a3b8",
        label: fe.name,
        detail: fe.amount,
        badge,
        badgeColor,
        link: "/fixed-expenses",
        sortKey: diff,
      };
    })
    .sort((a, b) => a.sortKey - b.sortKey);
};

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
  const { data: fixedExpenses = [] } = useFixedExpenses();
  const { data: budgets = [] } = useBudgets(YEAR, MONTH);
  const { data: monthTxs = [] } = useTransactions({
    year: YEAR,
    month: MONTH,
  });

  const registeredIds = useMemo(() => {
    const set = new Set();
    monthTxs.forEach((tx) => {
      if (tx.fixed_expense_id) set.add(tx.fixed_expense_id);
    });
    return set;
  }, [monthTxs]);

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
    const feAlerts = getFixedExpenseAlerts(fixedExpenses, registeredIds);
    const bgAlerts = getBudgetAlerts(budgets, spentByCategory);
    return [...feAlerts, ...bgAlerts].map((a) => ({
      ...a,
      detailFormatted: fmt(a.detail),
    }));
  }, [fixedExpenses, registeredIds, budgets, spentByCategory, fmt]);

  return alerts;
};

export default useDashboardAlerts;
