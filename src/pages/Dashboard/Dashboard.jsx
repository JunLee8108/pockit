import { useMemo, useCallback } from "react";
import { useAccounts } from "../../hooks/useAccounts";
import {
  useTransactions,
  useDeleteTransaction,
} from "../../hooks/useTransactions";
import { useCurrencies } from "../../hooks/useCurrencies";
import useMonthlySummary from "../../hooks/useMonthlySummary";
import useUIStore from "../../store/useUIStore";
import { formatMoney } from "../../utils/format";
import KpiCards from "./KpiCards";
import MonthlyTrendChart from "./MonthlyTrendChart";
import CategoryPieChart from "./CategoryPieChart";
import AccountBalanceList from "./AccountBalanceList";
import RecentTransactions from "./RecentTransactions";
import TransactionForm from "../Transactions/TransactionForm";
import DashboardSkeleton from "./DashboardSkeleton";

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
  const { summary } = useMonthlySummary(6);
  const deleteTx = useDeleteTransaction();
  const { txFormOpen, txEditTarget, openTxForm, closeTxForm } = useUIStore();

  const getCurrencyByCode = useCallback(
    (code) => currencies.find((c) => c.code === code) ?? null,
    [currencies],
  );

  // 주요 통화 (가장 많은 계좌의 통화)
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

  // 순자산 (전 계좌 합산)
  const netWorth = useMemo(
    () => accounts.reduce((s, a) => s + a.balance, 0),
    [accounts],
  );

  // minor unit → display unit 변환용
  const dp = primaryCurrency?.decimal_places ?? 2;
  const divisor = 10 ** dp;

  // 이번달 / 전월 수입·지출
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

  // 차트용 display 단위로 변환
  const displaySummary = useMemo(
    () =>
      summary.map((s) => ({
        ...s,
        income: s.income / divisor,
        expense: s.expense / divisor,
      })),
    [summary, divisor],
  );

  // 핸들러
  const handleEdit = useCallback((tx) => openTxForm(tx), [openTxForm]);

  const handleDuplicate = useCallback(
    (tx) => {
      openTxForm({
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency,
        account_id: tx.account_id,
        to_account_id: tx.to_account_id,
        category_id: tx.category_id,
        description: tx.description,
        memo: tx.memo,
        date: new Date().toISOString().split("T")[0],
        duplicateKey: Date.now(),
      });
    },
    [openTxForm],
  );

  const handleDelete = useCallback(
    async (tx) => {
      if (window.confirm("이 거래를 삭제하시겠습니까?")) {
        deleteTx.mutate(tx);
      }
    },
    [deleteTx],
  );

  if (accLoading || txLoading) return <DashboardSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <h2 className="text-xl font-semibold text-text">대시보드</h2>

      {/* KPI */}
      <KpiCards
        netWorth={netWorth}
        income={income}
        expense={expense}
        prevIncome={prevIncome}
        prevExpense={prevExpense}
        fmt={fmt}
      />

      {/* 월별 추이 */}
      <MonthlyTrendChart data={displaySummary} />

      {/* 2-Column: 카테고리 + 계좌 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryPieChart transactions={currentTxs} fmt={fmt} />
        <AccountBalanceList
          accounts={accounts}
          getCurrencyByCode={getCurrencyByCode}
        />
      </div>

      {/* 최근 거래 */}
      <RecentTransactions
        transactions={currentTxs}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />

      {/* 거래 수정 모달 */}
      <TransactionForm
        open={txFormOpen}
        onClose={closeTxForm}
        editTx={txEditTarget}
      />
    </div>
  );
};

export default Dashboard;
