import { Link } from "react-router";
import TransactionCard from "../Transactions/TransactionCard";

const RecentTransactions = ({
  transactions,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const recent = transactions.slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-[13px] text-sub font-medium mb-3">최근 거래</h3>
        <p className="text-[13px] text-sub">이번달 거래가 없습니다</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] text-sub font-medium">최근 거래</h3>
        <Link
          to="/transactions"
          className="text-mint text-[12px] font-medium no-underline"
        >
          전체 보기 →
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {recent.map((tx) => (
          <TransactionCard
            key={tx.id}
            tx={tx}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        ))}
      </div>
    </div>
  );
};

export default RecentTransactions;
