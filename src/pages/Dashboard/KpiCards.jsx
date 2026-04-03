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

const Card = ({
  icon: Icon,
  label,
  value,
  color,
  iconClass,
  current,
  previous,
  showChange = true,
  children,
}) => (
  <div className="dash-card bg-surface rounded-2xl p-5 shadow-sm flex flex-col gap-2.5">
    <div className="flex items-center gap-2">
      <span
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}
      >
        <Icon size={14} />
      </span>
      <span className="text-[12px] text-sub font-medium tracking-wide">
        {label}
      </span>
    </div>
    <div className={`text-[20px] font-semibold truncate ${color}`}>{value}</div>
    {showChange && previous !== undefined && (
      <Change current={current} previous={previous} />
    )}
    {children}
  </div>
);

const KpiCards = ({
  totalAssets,
  totalDebt,
  netWorth,
  income,
  expense,
  prevIncome,
  prevExpense,
  fmt,
}) => {
  const net = income - expense;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        icon={Wallet}
        label="총 자산"
        value={fmt(totalAssets)}
        color="text-text"
        iconClass="kpi-icon-primary"
        showChange={false}
      >
        {totalDebt > 0 && (
          <div className="text-[11px] flex items-center gap-1">
            <span className="text-coral">부채 -{fmt(totalDebt)}</span>
            <span className="text-sub">=</span>
            <span className={netWorth >= 0 ? "text-mint" : "text-coral"}>
              {netWorth < 0 && "-"}{fmt(Math.abs(netWorth))}
            </span>
          </div>
        )}
      </Card>
      <Card
        icon={ArrowUpRight}
        label="이번달 수입"
        value={`+${fmt(income)}`}
        color="text-mint"
        iconClass="bg-mint text-white"
        current={income}
        previous={prevIncome}
      />
      <Card
        icon={ArrowDownRight}
        label="이번달 지출"
        value={fmt(expense)}
        color="text-coral"
        iconClass="bg-coral text-white"
        current={expense}
        previous={prevExpense}
      />
      <Card
        icon={Scale}
        label="순수지"
        value={`${net >= 0 ? "+" : "-"}${fmt(Math.abs(net))}`}
        color={net >= 0 ? "text-mint" : "text-coral"}
        iconClass="bg-sub text-white"
        current={net}
        previous={prevIncome - prevExpense}
      />
    </div>
  );
};

export default KpiCards;
