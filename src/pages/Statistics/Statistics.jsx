import { useState, useMemo, useCallback } from "react";
import { useTransactions } from "../../hooks/useTransactions";
import { useCategories } from "../../hooks/useCategories";
import { useCurrencies } from "../../hooks/useCurrencies";
import useCategoryTrendData from "../../hooks/useCategoryTrendData";
import PeriodSelector from "./PeriodSelector";
import PeriodComparison from "./PeriodComparison";
import CategoryTrend from "./CategoryTrend";
import SpendingPattern from "./SpendingPattern";
import DailyFlowChart from "./DailyFlowChart";
import TopTransactions from "./TopTransactions";
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
  const { data: categories = [] } = useCategories();
  const { data: currencies = [] } = useCurrencies();
  const { data: trendData } = useCategoryTrendData(6);

  const getCurrencyByCode = useCallback(
    (code) => currencies.find((c) => c.code === code) ?? null,
    [currencies],
  );

  // 주요 통화
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

  // 이번달 / 전월 요약
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
      {/* Header */}
      <h2 className="text-xl font-semibold text-text">통계</h2>

      {/* 기간 선택 */}
      <PeriodSelector year={year} month={month} onChange={handlePeriod} />

      {/* 월간 비교 + 카테고리 트렌드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PeriodComparison
          current={currentSummary}
          previous={prevSummary}
          month={month}
          prevMonth={prevMonth}
          fmt={fmt}
        />
        <CategoryTrend
          trendData={trendData}
          categories={categories}
          divisor={divisor}
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

      {/* 상위 지출 */}
      <TopTransactions transactions={currentTxs} currency={primaryCurrency} />
    </div>
  );
};

export default Statistics;
