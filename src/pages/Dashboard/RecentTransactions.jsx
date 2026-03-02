// RecentTransactions.jsx

import { useState } from "react";
import { Link } from "react-router";
import { Pencil, Trash2, Copy } from "lucide-react";
import TransactionCard from "../Transactions/TransactionCard";
import SwipeableCard from "../Accounts/SwipeableCard";

const RecentTransactions = ({
  transactions,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const [openCardId, setOpenCardId] = useState(null);
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
      <div className="flex flex-col gap-2" onClick={() => setOpenCardId(null)}>
        {recent.map((tx) => (
          <SwipeableCard
            key={tx.id}
            cardId={tx.id}
            openCardId={openCardId}
            onOpenChange={setOpenCardId}
            actions={[
              {
                key: "duplicate",
                label: "복제",
                icon: <Copy size={18} />,
                className: "bg-sub",
                onClick: () => onDuplicate(tx),
              },
              {
                key: "edit",
                label: "수정",
                icon: <Pencil size={18} />,
                className: "bg-mint",
                onClick: () => onEdit(tx),
              },
              {
                key: "delete",
                label: "삭제",
                icon: <Trash2 size={18} />,
                className: "bg-coral",
                onClick: () => onDelete(tx),
              },
            ]}
          >
            <TransactionCard
              tx={tx}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          </SwipeableCard>
        ))}
      </div>
    </div>
  );
};

export default RecentTransactions;
