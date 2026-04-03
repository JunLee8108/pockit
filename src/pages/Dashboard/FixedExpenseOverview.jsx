import { useMemo } from "react";
import { Link } from "react-router";
import { Check, Clock, Bell } from "lucide-react";
import { useFixedExpenses } from "../../hooks/useFixedExpenses";
import { useTransactions } from "../../hooks/useTransactions";
import CategoryIcon from "../../components/CategoryIcon";

const now = new Date();
const YEAR = now.getFullYear();
const MONTH = now.getMonth() + 1;

const RING_SIZE = 80;
const RING_STROKE = 7;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const ProgressRing = ({ current, total, color }) => {
  const pct = total > 0 ? (current / total) * 100 : 0;
  const offset = RING_CIRCUMFERENCE - (Math.min(pct, 100) / 100) * RING_CIRCUMFERENCE;
  return (
    <svg width={RING_SIZE} height={RING_SIZE} className="shrink-0">
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        stroke="var(--color-light)"
        strokeWidth={RING_STROKE}
      />
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        className="transition-all duration-500"
      />
      <text
        x={RING_SIZE / 2}
        y={RING_SIZE / 2 - 6}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-text text-[16px] font-bold"
      >
        {current}/{total}
      </text>
      <text
        x={RING_SIZE / 2}
        y={RING_SIZE / 2 + 10}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-sub text-[10px]"
      >
        등록
      </text>
    </svg>
  );
};

const FixedExpenseOverview = ({ fmt }) => {
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

  const activeExpenses = useMemo(
    () => fixedExpenses.filter((fe) => fe.is_active),
    [fixedExpenses],
  );

  const { total, registeredCount, variableNeedAction } = useMemo(() => {
    const tot = activeExpenses.reduce((s, fe) => s + fe.amount, 0);
    const reg = activeExpenses.filter((fe) => registeredIds.has(fe.id)).length;
    const varNeed = activeExpenses.filter(
      (fe) => fe.is_variable && !registeredIds.has(fe.id),
    ).length;
    return { total: tot, registeredCount: reg, variableNeedAction: varNeed };
  }, [activeExpenses, registeredIds]);

  if (activeExpenses.length === 0) {
    return (
      <div className="dash-card bg-surface rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] text-sub font-medium tracking-wide">
            {MONTH}월 고정지출
          </h3>
          <Link
            to="/fixed-expenses"
            className="text-mint text-[12px] font-medium no-underline"
          >
            설정 →
          </Link>
        </div>
        <p className="text-[13px] text-sub">등록된 고정지출이 없습니다</p>
      </div>
    );
  }

  const allRegistered = registeredCount === activeExpenses.length;
  const ringColor = allRegistered
    ? "var(--color-mint)"
    : variableNeedAction > 0
      ? "var(--color-amber)"
      : "var(--color-sub)";

  return (
    <div className="dash-card bg-surface rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[13px] text-sub font-medium tracking-wide">
          {MONTH}월 고정지출
        </h3>
        <Link
          to="/fixed-expenses"
          className="text-mint text-[12px] font-medium no-underline"
        >
          관리 →
        </Link>
      </div>

      {/* Ring + Summary */}
      <div className="flex items-center gap-5 mb-5">
        <ProgressRing
          current={registeredCount}
          total={activeExpenses.length}
          color={ringColor}
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-end gap-1.5">
            <span className="text-[17px] font-bold text-text">
              {fmt(total)}
            </span>
            <span className="text-[12px] text-sub mb-0.5">/ 월</span>
          </div>
          {variableNeedAction > 0 && (
            <div className="text-[12px] text-amber font-medium">
              확인필요 {variableNeedAction}건
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col">
        {activeExpenses.map((fe) => {
          const cat = fe.category;
          const isRegistered = registeredIds.has(fe.id);
          return (
            <div
              key={fe.id}
              className="flex items-center gap-2.5 py-2 border-b border-border last:border-b-0"
            >
              <CategoryIcon
                name={cat?.icon}
                size={13}
                style={{ color: cat?.color || "#94a3b8" }}
              />
              <span className="text-[12px] text-text truncate flex-1">
                {fe.name}
              </span>
              <span className="text-[12px] text-sub shrink-0">
                {fe.billing_day}일
              </span>
              <span className="text-[12px] font-medium text-text shrink-0">
                {fmt(fe.amount)}
              </span>
              <span className="shrink-0">
                {isRegistered ? (
                  <Check size={12} className="text-mint" />
                ) : fe.is_variable ? (
                  <Bell size={12} className="text-amber" />
                ) : (
                  <Clock size={12} className="text-sub" />
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FixedExpenseOverview;
