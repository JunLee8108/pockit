import { TrendingUp, TrendingDown } from "lucide-react";

const pctChange = (cur, prev) => {
  if (prev === 0) return cur > 0 ? 100 : cur < 0 ? -100 : 0;
  return ((cur - prev) / Math.abs(prev)) * 100;
};

const GRID = "grid grid-cols-[1fr_6rem_6rem_5rem] items-center";

const Row = ({ label, current, previous, fmt, invert = false }) => {
  const pct = pctChange(current, previous);
  const isPositive = invert ? pct < 0 : pct > 0;
  const color =
    pct === 0 ? "text-sub" : isPositive ? "text-mint" : "text-coral";

  return (
    <div className={`${GRID} py-2.5 border-b border-border last:border-b-0`}>
      <span className="text-[13px] text-sub">{label}</span>
      <span className="text-[13px] text-sub text-right">{fmt(previous)}</span>
      <span className="text-[14px] font-semibold text-text text-right">
        {fmt(current)}
      </span>
      <span
        className={`text-[12px] text-right flex items-center justify-end gap-0.5 ${color}`}
      >
        {pct !== 0 &&
          (pct > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />)}
        {pct === 0 ? "-" : `${Math.abs(pct).toFixed(1)}%`}
      </span>
    </div>
  );
};

const PeriodComparison = ({ current, previous, month, prevMonth, fmt }) => (
  <div className="bg-surface border border-border rounded-xl p-5">
    <div className={`${GRID} mb-2`}>
      <h3 className="text-[13px] text-sub font-medium">월간 비교</h3>
      <span className="text-[12px] text-sub text-right">{prevMonth}월</span>
      <span className="text-[12px] font-semibold text-text text-right">
        {month}월
      </span>
      <span className="text-[12px] text-sub text-right">증감</span>
    </div>
    <Row
      label="수입"
      current={current.income}
      previous={previous.income}
      fmt={fmt}
    />
    <Row
      label="지출"
      current={current.expense}
      previous={previous.expense}
      fmt={fmt}
      invert
    />
    <Row
      label="순수지"
      current={current.income - current.expense}
      previous={previous.income - previous.expense}
      fmt={fmt}
    />
  </div>
);

export default PeriodComparison;
