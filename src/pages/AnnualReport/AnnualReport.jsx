import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useAccounts } from "../../hooks/useAccounts";
import { useCurrencies } from "../../hooks/useCurrencies";
import { useCategories } from "../../hooks/useCategories";
import useAnnualSummary from "../../hooks/useAnnualSummary";
import useAnnualCategoryData from "../../hooks/useAnnualCategoryData";
import YearSelector from "./YearSelector";
import AnnualSummaryCards from "./AnnualSummaryCards";
import AnnualReportSkeleton from "./AnnualReportSkeleton";
import { formatMoney } from "../../utils/format";

const MonthlyBarChart = lazy(() => import("./MonthlyBarChart"));
const CategoryRanking = lazy(() => import("./CategoryRanking"));
const MonthlyTable = lazy(() => import("./MonthlyTable"));
const YearOverYearComparison = lazy(() => import("./YearOverYearComparison"));

const ChartFallback = () => (
  <div className="bg-surface border border-border rounded-xl p-5">
    <div className="skeleton" style={{ width: "100%", height: 200 }} />
  </div>
);

const now = new Date();

const AnnualReport = () => {
  const [year, setYear] = useState(now.getFullYear());

  const { data: accounts = [], isLoading: accLoading } = useAccounts();
  const { data: currencies = [] } = useCurrencies();
  const { data: categories = [] } = useCategories();

  // 현재 연도 데이터
  const { summary, isLoading: summaryLoading } = useAnnualSummary(year);
  const { transactions: catTxs, isLoading: catLoading } =
    useAnnualCategoryData(year);

  // 전년도 데이터
  const { summary: prevSummary, isLoading: prevLoading } = useAnnualSummary(
    year - 1,
  );

  const getCurrencyByCode = useCallback(
    (code) => currencies.find((c) => c.code === code) ?? null,
    [currencies],
  );

  const primaryCurrency = useMemo(() => {
    if (accounts.length === 0) return null;
    const freq = {};
    accounts.forEach((a) => {
      freq[a.currency] = (freq[a.currency] || 0) + 1;
    });
    const code = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    return getCurrencyByCode(code);
  }, [accounts, getCurrencyByCode]);

  const dp = primaryCurrency?.decimal_places ?? 2;
  const divisor = 10 ** dp;

  const fmt = useCallback(
    (amount) => formatMoney(amount, primaryCurrency),
    [primaryCurrency],
  );

  // 현재 연도 합계
  const currentTotals = useMemo(() => {
    let income = 0,
      expense = 0;
    summary.forEach((s) => {
      income += s.income;
      expense += s.expense;
    });
    return { income, expense };
  }, [summary]);

  // 전년 합계
  const prevTotals = useMemo(() => {
    let income = 0,
      expense = 0;
    prevSummary.forEach((s) => {
      income += s.income;
      expense += s.expense;
    });
    return { income, expense };
  }, [prevSummary]);

  // 차트용 데이터 (display 단위 변환)
  const chartData = useMemo(() => {
    if (summaryLoading) return [];
    return summary.map((s) => ({
      ...s,
      income: s.income / divisor,
      expense: s.expense / divisor,
    }));
  }, [summary, divisor, summaryLoading]);

  const isLoading = accLoading || summaryLoading;

  if (isLoading && summary.every((s) => s.income === 0 && s.expense === 0)) {
    return <AnnualReportSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-text">연간 리포트</h2>

      <YearSelector year={year} onChange={setYear} />

      <AnnualSummaryCards
        income={currentTotals.income}
        expense={currentTotals.expense}
        prevIncome={prevTotals.income}
        prevExpense={prevTotals.expense}
        fmt={fmt}
      />

      <Suspense fallback={<ChartFallback />}>
        <MonthlyBarChart data={chartData} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Suspense fallback={<ChartFallback />}>
          <CategoryRanking
            transactions={catTxs}
            categories={categories}
            fmt={fmt}
          />
        </Suspense>
        <Suspense fallback={<ChartFallback />}>
          <YearOverYearComparison
            year={year}
            current={currentTotals}
            previous={prevTotals}
            fmt={fmt}
          />
        </Suspense>
      </div>

      <Suspense fallback={<ChartFallback />}>
        <MonthlyTable summary={summary} fmt={fmt} />
      </Suspense>
    </div>
  );
};

export default AnnualReport;
