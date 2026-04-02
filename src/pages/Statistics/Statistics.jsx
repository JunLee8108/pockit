import { useState, useMemo, useCallback } from "react";
import { useTransactions } from "../../hooks/useTransactions";
import { useCurrencies } from "../../hooks/useCurrencies";
import PeriodSelector from "./PeriodSelector";
import TopTransactions from "./TopTransactions";
import PeriodComparison from "./PeriodComparison";
import CategoryBreakdown from "./CategoryBreakdown";
import SpendingPattern from "./SpendingPattern";
import DailyFlowChart from "./DailyFlowChart";
import StatisticsSkeleton from "./StatisticsSkeleton";
import { formatMoney } from "../../utils/format";

const now = new Date();

const Statistics = () => {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const prevDate = new Date(year, month - 2, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;

  const { data: currentTxs = [], isLoading: txLoading } = useTransactions({
    year,
    month,
  });
  const { data: prevTxs = [] } = useTransactions({
    year: prevYear,
    month: prevMonth,
  });
  const { data: currencies = [] } = useCurrencies();

  const getCurrencyByCode = useCallback(
    (code) => currencies.find((c) => c.code === code) ?? null,
    [currencies],
  );

  const primaryCurrency = useMemo(() => {
    const codeSet = new Set(currentTxs.map((tx) => tx.currency));
    if (codeSet.size === 0) return getCurrencyByCode("USD");
    const code = [...codeSet][0];
    return getCurrencyByCode(code);
  }, [currentTxs, getCurrencyByCode]);

  const dp = primaryCurrency?.decimal_places ?? 2;
  const divisor = 10 ** dp;

  const fmt = useCallback(
    (amount) => formatMoney(amount, primaryCurrency),
    [primaryCurrency],
  );

  const currentSummary = useMemo(() => {
    let income = 0,
      expense = 0;
    currentTxs.forEach((tx) => {
      if (tx.type === "income") income += tx.amount;
      else if (tx.type === "expense") expense += tx.amount;
    });
    return { income, expense };
  }, [currentTxs]);

  const prevSummary = useMemo(() => {
    let income = 0,
      expense = 0;
    prevTxs.forEach((tx) => {
      if (tx.type === "income") income += tx.amount;
      else if (tx.type === "expense") expense += tx.amount;
    });
    return { income, expense };
  }, [prevTxs]);

  const handlePeriod = useCallback((y, m) => {
    setYear(y);
    setMonth(m);
  }, []);

  if (txLoading && currentTxs.length === 0) return <StatisticsSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-text">통계</h2>

      <PeriodSelector year={year} month={month} onChange={handlePeriod} />

      {/* 상위 지출 Top 5 — 최상단 */}
      <TopTransactions transactions={currentTxs} currency={primaryCurrency} />

      {/* 월간 비교 + 카테고리별 지출 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PeriodComparison
          current={currentSummary}
          previous={prevSummary}
          month={month}
          prevMonth={prevMonth}
          fmt={fmt}
        />
        <CategoryBreakdown
          transactions={currentTxs}
          fmt={fmt}
          year={year}
          month={month}
        />
      </div>

      {/* 지출 패턴 + 일별 흐름 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SpendingPattern
          transactions={currentTxs}
          year={year}
          month={month}
          divisor={divisor}
          fmt={fmt}
        />
        <DailyFlowChart
          transactions={currentTxs}
          year={year}
          month={month}
          divisor={divisor}
        />
      </div>
    </div>
  );
};

export default Statistics;
