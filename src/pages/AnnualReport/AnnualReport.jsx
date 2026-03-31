import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useAccounts } from "../../hooks/useAccounts";
import { useCurrencies } from "../../hooks/useCurrencies";
import { useCategories } from "../../hooks/useCategories";
import { useTransactions } from "../../hooks/useTransactions";
import useAnnualSummary from "../../hooks/useAnnualSummary";
import useAnnualCategoryData from "../../hooks/useAnnualCategoryData";
import YearSelector from "./YearSelector";
import PeriodSelector from "../Statistics/PeriodSelector";
import AnnualSummaryCards from "./AnnualSummaryCards";
import AnnualReportSkeleton from "./AnnualReportSkeleton";
import { formatMoney } from "../../utils/format";

const MonthlyBarChart = lazy(() => import("./MonthlyBarChart"));
const CategoryRanking = lazy(() => import("./CategoryRanking"));
const MonthlyTable = lazy(() => import("./MonthlyTable"));
const YearOverYearComparison = lazy(() => import("./YearOverYearComparison"));
const DailyFlowChart = lazy(() =>
  import("../Statistics/DailyFlowChart"),
);
const PeriodComparison = lazy(() =>
  import("../Statistics/PeriodComparison"),
);

const ChartFallback = () => (
  <div className="bg-surface border border-border rounded-xl p-5">
    <div className="skeleton" style={{ width: "100%", height: 200 }} />
  </div>
);

const MODES = [
  { key: "monthly", label: "월간" },
  { key: "annual", label: "연간" },
];

const now = new Date();

const AnnualReport = () => {
  const [mode, setMode] = useState("annual");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // --- 공통 데이터 ---
  const { data: accounts = [], isLoading: accLoading } = useAccounts();
  const { data: currencies = [] } = useCurrencies();
  const { data: categories = [] } = useCategories();

  // --- 연간 데이터 ---
  const { summary, isLoading: summaryLoading } = useAnnualSummary(year);
  const { transactions: catTxs, isLoading: catLoading } =
    useAnnualCategoryData(year);
  const { summary: prevSummary, isLoading: prevLoading } = useAnnualSummary(
    year - 1,
  );

  // --- 월간 데이터 ---
  const prevDate = new Date(year, month - 2, 1);
  const prevMonthYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;

  const { data: monthTxs = [], isLoading: monthTxLoading } = useTransactions(
    mode === "monthly" ? { year, month } : { year: 0, month: 0 },
  );
  const { data: prevMonthTxs = [] } = useTransactions(
    mode === "monthly"
      ? { year: prevMonthYear, month: prevMonth }
      : { year: 0, month: 0 },
  );

  // --- 통화 ---
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

  // --- 연간 계산 ---
  const currentTotals = useMemo(() => {
    let income = 0,
      expense = 0;
    summary.forEach((s) => {
      income += s.income;
      expense += s.expense;
    });
    return { income, expense };
  }, [summary]);

  const prevTotals = useMemo(() => {
    let income = 0,
      expense = 0;
    prevSummary.forEach((s) => {
      income += s.income;
      expense += s.expense;
    });
    return { income, expense };
  }, [prevSummary]);

  const chartData = useMemo(() => {
    if (summaryLoading) return [];
    return summary.map((s) => ({
      ...s,
      income: s.income / divisor,
      expense: s.expense / divisor,
    }));
  }, [summary, divisor, summaryLoading]);

  // --- 월간 계산 ---
  const monthSummary = useMemo(() => {
    let income = 0,
      expense = 0;
    monthTxs.forEach((tx) => {
      if (tx.type === "income") income += tx.amount;
      else if (tx.type === "expense") expense += tx.amount;
    });
    return { income, expense };
  }, [monthTxs]);

  const prevMonthSummary = useMemo(() => {
    let income = 0,
      expense = 0;
    prevMonthTxs.forEach((tx) => {
      if (tx.type === "income") income += tx.amount;
      else if (tx.type === "expense") expense += tx.amount;
    });
    return { income, expense };
  }, [prevMonthTxs]);

  // --- 핸들러 ---
  const handlePeriod = useCallback((y, m) => {
    setYear(y);
    setMonth(m);
  }, []);

  // --- 로딩 ---
  const isLoading =
    mode === "annual"
      ? accLoading || summaryLoading
      : accLoading || monthTxLoading;

  if (
    isLoading &&
    (mode === "annual"
      ? summary.every((s) => s.income === 0 && s.expense === 0)
      : monthTxs.length === 0)
  ) {
    return <AnnualReportSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 + 탭 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text">리포트</h2>
        <div className="flex gap-1 bg-light rounded-lg p-1">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`px-3 py-1.5 text-[13px] rounded-md border-none cursor-pointer transition-colors ${
                mode === m.key
                  ? "bg-mint text-white font-semibold"
                  : "bg-transparent text-sub"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* 기간 선택 */}
      {mode === "annual" ? (
        <YearSelector year={year} onChange={setYear} />
      ) : (
        <PeriodSelector year={year} month={month} onChange={handlePeriod} />
      )}

      {/* 연간 뷰 */}
      {mode === "annual" && (
        <>
          <AnnualSummaryCards
            income={currentTotals.income}
            expense={currentTotals.expense}
            prevIncome={prevTotals.income}
            prevExpense={prevTotals.expense}
            fmt={fmt}
            mode="annual"
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
        </>
      )}

      {/* 월간 뷰 */}
      {mode === "monthly" && (
        <>
          <AnnualSummaryCards
            income={monthSummary.income}
            expense={monthSummary.expense}
            prevIncome={prevMonthSummary.income}
            prevExpense={prevMonthSummary.expense}
            fmt={fmt}
            mode="monthly"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Suspense fallback={<ChartFallback />}>
              <PeriodComparison
                current={monthSummary}
                previous={prevMonthSummary}
                month={month}
                prevMonth={prevMonth}
                fmt={fmt}
              />
            </Suspense>
            <Suspense fallback={<ChartFallback />}>
              <CategoryRanking
                transactions={monthTxs}
                categories={categories}
                fmt={fmt}
              />
            </Suspense>
          </div>

          <Suspense fallback={<ChartFallback />}>
            <DailyFlowChart
              transactions={monthTxs}
              year={year}
              month={month}
              divisor={divisor}
            />
          </Suspense>
        </>
      )}
    </div>
  );
};

export default AnnualReport;
