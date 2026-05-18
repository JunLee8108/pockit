import { lazy, Suspense, useMemo, useCallback } from "react";
import { useAccounts } from "../../hooks/useAccounts";
import { useTransactions } from "../../hooks/useTransactions";
import { useCurrencies } from "../../hooks/useCurrencies";
import { formatMoney } from "../../utils/format";
import KpiCards from "./KpiCards";
import DashboardSkeleton from "./DashboardSkeleton";
import LiveClock from "./LiveClock";

const AccountBalanceList = lazy(() => import("./AccountBalanceList"));
const RecentTransactions = lazy(() => import("./RecentTransactions"));
const BudgetOverview = lazy(() => import("./BudgetOverview"));
const FixedExpenseOverview = lazy(() => import("./FixedExpenseOverview"));
const DashboardAlerts = lazy(() => import("./DashboardAlerts"));

const ChartFallback = () => (
  <div className="dash-card bg-surface shadow-sm rounded-2xl p-6">
    <div className="skeleton" style={{ width: "100%", height: 200 }} />
  </div>
);

const now = new Date();
const YEAR = now.getFullYear();
const MONTH = now.getMonth() + 1;
const prevDate = new Date(YEAR, MONTH - 2, 1);
const PREV_YEAR = prevDate.getFullYear();
const PREV_MONTH = prevDate.getMonth() + 1;

const Dashboard = () => {
  const { data: accounts = [], isLoading: accLoading } = useAccounts();
  const { data: currencies = [] } = useCurrencies();
  const { data: currentTxs = [], isLoading: txLoading } = useTransactions({
    year: YEAR,
    month: MONTH,
  });
  const { data: prevTxs = [] } = useTransactions({
    year: PREV_YEAR,
    month: PREV_MONTH,
  });

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

  const fmt = useCallback(
    (amount) => formatMoney(amount, primaryCurrency),
    [primaryCurrency],
  );

  const netWorth = useMemo(
    () => accounts.reduce((s, a) => s + a.balance, 0),
    [accounts],
  );

  const totalAssets = useMemo(
    () => accounts.reduce((s, a) => s + (a.balance > 0 ? a.balance : 0), 0),
    [accounts],
  );

  const totalDebt = useMemo(
    () => accounts.reduce((s, a) => s + (a.balance < 0 ? Math.abs(a.balance) : 0), 0),
    [accounts],
  );

  const { income, expense } = useMemo(() => {
    let inc = 0,
      exp = 0;
    currentTxs.forEach((tx) => {
      if (tx.type === "income") inc += tx.amount;
      else if (tx.type === "expense") exp += tx.amount;
    });
    return { income: inc, expense: exp };
  }, [currentTxs]);

  const { prevIncome, prevExpense } = useMemo(() => {
    let inc = 0,
      exp = 0;
    prevTxs.forEach((tx) => {
      if (tx.type === "income") inc += tx.amount;
      else if (tx.type === "expense") exp += tx.amount;
    });
    return { prevIncome: inc, prevExpense: exp };
  }, [prevTxs]);

  if (accLoading || txLoading) return <DashboardSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text">대시보드</h2>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex">
            <LiveClock />
          </div>
          <Suspense fallback={null}>
            <DashboardAlerts fmt={fmt} />
          </Suspense>
        </div>
      </div>

      <KpiCards
        totalAssets={totalAssets}
        totalDebt={totalDebt}
        netWorth={netWorth}
        income={income}
        expense={expense}
        prevIncome={prevIncome}
        prevExpense={prevExpense}
        fmt={fmt}
      />

      {/* 계좌 잔액 + 최근 거래 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Suspense fallback={<ChartFallback />}>
          <AccountBalanceList
            accounts={accounts}
            getCurrencyByCode={getCurrencyByCode}
          />
        </Suspense>
        <Suspense fallback={<ChartFallback />}>
          <RecentTransactions transactions={currentTxs} />
        </Suspense>
      </div>

      {/* 예산 현황 + 고정지출 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Suspense fallback={<ChartFallback />}>
          <BudgetOverview fmt={fmt} />
        </Suspense>
        <Suspense fallback={<ChartFallback />}>
          <FixedExpenseOverview fmt={fmt} />
        </Suspense>
      </div>
    </div>
  );
};

export default Dashboard;
