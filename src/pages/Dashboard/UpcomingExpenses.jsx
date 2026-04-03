import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Bell, X } from "lucide-react";
import { useFixedExpenses } from "../../hooks/useFixedExpenses";
import { useTransactions } from "../../hooks/useTransactions";
import CategoryIcon from "../../components/CategoryIcon";

const now = new Date();
const YEAR = now.getFullYear();
const MONTH = now.getMonth() + 1;
const TODAY = now.getDate();
const TODAY_STR = now.toISOString().split("T")[0];

const DISMISS_KEY = "pockit_upcoming_dismissed";

const getLabel = (diff) => {
  if (diff < 0) return { text: "미등록", color: "text-coral" };
  if (diff === 0) return { text: "오늘", color: "text-coral" };
  if (diff === 1) return { text: "내일", color: "text-amber" };
  return { text: `${diff}일 후`, color: "text-amber" };
};

const UpcomingExpenses = ({ fmt }) => {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === TODAY_STR,
  );

  const { data: fixedExpenses = [] } = useFixedExpenses();
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

  const alerts = useMemo(() => {
    return fixedExpenses
      .filter((fe) => {
        if (!fe.is_active) return false;
        if (registeredIds.has(fe.id)) return false;
        const diff = fe.billing_day - TODAY;
        return diff <= 3;
      })
      .map((fe) => ({
        ...fe,
        diff: fe.billing_day - TODAY,
      }))
      .sort((a, b) => a.diff - b.diff);
  }, [fixedExpenses, registeredIds]);

  if (dismissed || alerts.length === 0) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, TODAY_STR);
    setDismissed(true);
  };

  return (
    <div className="dash-card bg-surface shadow-sm rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-amber/15 flex items-center justify-center">
            <Bell size={13} className="text-amber" />
          </span>
          <h3 className="text-[13px] text-sub font-medium tracking-wide">
            다가오는 고정지출
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/fixed-expenses"
            className="text-mint text-[12px] font-medium no-underline"
          >
            관리 →
          </Link>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md text-sub hover:bg-light cursor-pointer bg-transparent border-none"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {alerts.map((fe) => {
          const cat = fe.category;
          const label = getLabel(fe.diff);
          return (
            <div
              key={fe.id}
              className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-b-0"
            >
              <CategoryIcon
                name={cat?.icon}
                size={14}
                style={{ color: cat?.color || "#94a3b8" }}
              />
              <span className="text-[13px] text-text truncate flex-1">
                {fe.name}
              </span>
              <span className="text-[13px] font-medium text-text shrink-0">
                {fmt(fe.amount)}
              </span>
              <span
                className={`text-[11px] font-medium shrink-0 ${label.color}`}
              >
                {label.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingExpenses;
