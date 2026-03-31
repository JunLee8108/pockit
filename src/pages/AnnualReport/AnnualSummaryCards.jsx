import {
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  CalendarDays,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const pctChange = (cur, prev) => {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return ((cur - prev) / prev) * 100;
};

const Change = ({ current, previous }) => {
  const pct = pctChange(current, previous);
  if (pct === 0) return <span className="text-[12px] text-sub">변동 없음</span>;
  const up = pct > 0;
  return (
    <span
      className={`text-[12px] flex items-center gap-0.5 ${up ? "text-mint" : "text-coral"}`}
    >
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
};

const Card = ({ icon, label, value, color, current, previous, showChange }) => {
  const IconComp = icon;
  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <IconComp size={14} className="text-sub" />
        <span className="text-[13px] text-sub font-medium">{label}</span>
      </div>
      <div className={`text-[22px] font-bold truncate ${color}`}>{value}</div>
      {showChange && previous !== undefined && (
        <Change current={current} previous={previous} />
      )}
    </div>
  );
};

const AnnualSummaryCards = ({
  income,
  expense,
  prevIncome,
  prevExpense,
  fmt,
  mode = "annual",
}) => {
  const isMonthly = mode === "monthly";
  const prefix = isMonthly ? "월간" : "연간";
  const net = income - expense;
  const prevNet = prevIncome - prevExpense;

  return (
    <div className={`grid grid-cols-2 ${isMonthly ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4`}>
      <Card
        icon={ArrowUpRight}
        label={`${prefix} 총 수입`}
        value={`+${fmt(income)}`}
        color="text-mint"
        current={income}
        previous={prevIncome}
        showChange
      />
      <Card
        icon={ArrowDownRight}
        label={`${prefix} 총 지출`}
        value={fmt(expense)}
        color="text-coral"
        current={expense}
        previous={prevExpense}
        showChange
      />
      <Card
        icon={Scale}
        label={`${prefix} 순수지`}
        value={`${net >= 0 ? "+" : "-"}${fmt(Math.abs(net))}`}
        color={net >= 0 ? "text-mint" : "text-coral"}
        current={net}
        previous={prevNet}
        showChange
      />
      {!isMonthly && (
        <Card
          icon={CalendarDays}
          label="월평균 지출"
          value={fmt(Math.round(expense / 12))}
          color="text-text"
          showChange={false}
        />
      )}
    </div>
  );
};

export default AnnualSummaryCards;
