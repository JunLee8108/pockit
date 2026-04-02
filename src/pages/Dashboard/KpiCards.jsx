import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const pctChange = (cur, prev) => {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return ((cur - prev) / prev) * 100;
};

const Change = ({ current, previous }) => {
  const pct = pctChange(current, previous);
  if (pct === 0)
    return <span className="text-[11px] text-sub">변동 없음</span>;
  const up = pct > 0;
  return (
    <span
      className={`text-[11px] flex items-center gap-0.5 ${up ? "text-mint" : "text-coral"}`}
    >
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
};

const SubCard = ({ icon: Icon, label, value, color, iconBg, current, previous }) => (
  <div className="dash-card bg-surface rounded-xl p-4 shadow-sm flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <span
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={14} className="text-white" />
      </span>
      <span className="text-[12px] text-sub font-medium tracking-wide">
        {label}
      </span>
    </div>
    <div className={`text-[20px] font-bold truncate ${color}`}>{value}</div>
    {previous !== undefined && (
      <Change current={current} previous={previous} />
    )}
  </div>
);

const KpiCards = ({
  netWorth,
  income,
  expense,
  prevIncome,
  prevExpense,
  fmt,
}) => {
  const net = income - expense;

  return (
    <div className="dash-card bg-surface rounded-2xl p-6 shadow-sm">
      {/* Hero: Net Worth */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-8 h-8 rounded-lg bg-text flex items-center justify-center">
            <Wallet size={16} className="text-surface" />
          </span>
          <span className="text-[13px] text-sub font-medium tracking-wide">
            총 순자산
          </span>
        </div>
        <div
          className={`text-[32px] font-extrabold tracking-tight ${
            netWorth < 0 ? "text-coral" : "text-text"
          }`}
        >
          {fmt(netWorth)}
        </div>
      </div>

      {/* Sub Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <SubCard
          icon={ArrowUpRight}
          label="수입"
          value={`+${fmt(income)}`}
          color="text-mint"
          iconBg="var(--color-mint)"
          current={income}
          previous={prevIncome}
        />
        <SubCard
          icon={ArrowDownRight}
          label="지출"
          value={fmt(expense)}
          color="text-coral"
          iconBg="var(--color-coral)"
          current={expense}
          previous={prevExpense}
        />
        <SubCard
          icon={Scale}
          label="순수지"
          value={`${net >= 0 ? "+" : "-"}${fmt(Math.abs(net))}`}
          color={net >= 0 ? "text-mint" : "text-coral"}
          iconBg="var(--color-sub)"
          current={net}
          previous={prevIncome - prevExpense}
        />
      </div>
    </div>
  );
};

export default KpiCards;
