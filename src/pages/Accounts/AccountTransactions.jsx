import { useState, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Plus,
  Landmark,
} from "lucide-react";
import {
  useTransactions,
  useDeleteTransaction,
} from "../../hooks/useTransactions";
import { useCurrencyByCode } from "../../hooks/useCurrencies";
import { formatMoney } from "../../utils/format";
import { ACCOUNT_ICON_MAP } from "../../utils/constants";
import useUIStore from "../../store/useUIStore";
import useConfirm from "../../hooks/useConfirm";
import TransactionList from "../Transactions/TransactionList";
import TransactionForm from "../Transactions/TransactionForm";

const now = new Date();

const AccountTransactions = ({ account, onBack }) => {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const currency = useCurrencyByCode(account.currency);
  const IconComponent = ACCOUNT_ICON_MAP[account.icon];
  const confirm = useConfirm();

  const { data: transactions = [], isLoading } = useTransactions({
    year,
    month,
    accountId: account.id,
  });

  const deleteTx = useDeleteTransaction();
  const { txFormOpen, txEditTarget, openTxForm, closeTxForm } = useUIStore();

  const goMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setYear(y);
    setMonth(m);
  };

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
      const ok = await confirm({
        title: "거래 삭제",
        message: "이 거래를 삭제하시겠습니까?",
        confirmText: "삭제",
        variant: "danger",
      });
      if (ok) deleteTx.mutate(tx);
    },
    [deleteTx, confirm],
  );

  const handleAddTx = () => {
    openTxForm({
      account_id: account.id,
      date: new Date().toISOString().split("T")[0],
      duplicateKey: Date.now(),
    });
  };

  const summary = useMemo(() => {
    let income = 0,
      expense = 0,
      transferIn = 0,
      transferOut = 0;
    transactions.forEach((tx) => {
      if (tx.type === "income") income += tx.amount;
      else if (tx.type === "expense") expense += tx.amount;
      else if (tx.type === "transfer") {
        if (tx.account_id === account.id) transferOut += tx.amount;
        if (tx.to_account_id === account.id) transferIn += tx.amount;
      }
    });
    return { income, expense, transferIn, transferOut, net: income - expense };
  }, [transactions, account.id]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: account.color + "20" }}
        >
          {IconComponent ? (
            <IconComponent size={20} style={{ color: account.color }} />
          ) : (
            <Landmark size={20} style={{ color: account.color }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-semibold text-text truncate">
            {account.name}
          </div>
          {account.institution && (
            <div className="text-[12px] text-sub">{account.institution}</div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div
            className={`text-[18px] font-bold ${account.balance < 0 ? "text-coral" : "text-text"}`}
          >
            {formatMoney(account.balance, currency)}
          </div>
          <div className="text-[11px] text-sub">{account.currency}</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => goMonth(-1)}
            className="p-1.5 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-[15px] font-semibold text-text">
            {year}년 {month}월
          </span>
          <button
            onClick={() => goMonth(1)}
            className="p-1.5 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex gap-4 text-[13px]">
          <div className="flex-1 text-center">
            <div className="text-sub mb-1">수입</div>
            <div className="text-mint font-semibold">
              +{formatMoney(summary.income, currency)}
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-sub mb-1">지출</div>
            <div className="text-coral font-semibold">
              -{formatMoney(summary.expense, currency)}
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-sub mb-1">순수지</div>
            <div
              className={`font-semibold ${summary.net >= 0 ? "text-mint" : "text-coral"}`}
            >
              {summary.net >= 0 ? "+" : "-"}
              {formatMoney(Math.abs(summary.net), currency)}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleAddTx}
        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-sm font-medium cursor-pointer border border-dashed border-border text-sub hover:border-mint hover:text-mint bg-transparent transition-colors"
      >
        <Plus size={16} />이 계좌에 거래 추가
      </button>

      {isLoading ? (
        <div className="text-center py-10 text-sub text-sm">불러오는 중...</div>
      ) : (
        <TransactionList
          transactions={transactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      )}

      <TransactionForm
        open={txFormOpen}
        onClose={closeTxForm}
        editTx={txEditTarget}
      />
    </div>
  );
};

export default AccountTransactions;
