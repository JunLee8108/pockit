import { useState } from "react";
import { Pencil, Trash2, Copy } from "lucide-react";
import TransactionCard from "./TransactionCard";
import SwipeableCard from "../Accounts/SwipeableCard";

const formatDateLabel = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const day = days[d.getDay()];
  return `${month}월 ${date}일 (${day})`;
};

const TransactionList = ({ transactions, onEdit, onDelete, onDuplicate }) => {
  const [openCardId, setOpenCardId] = useState(null);

  // 날짜별 그룹핑
  const grouped = {};
  transactions.forEach((tx) => {
    const key = tx.date;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (transactions.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-10 text-center">
        <p className="text-sub text-sm">거래내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" onClick={() => setOpenCardId(null)}>
      {sortedDates.map((date) => (
        <div key={date}>
          <h4 className="text-[13px] text-sub font-medium mb-2">
            {formatDateLabel(date)}
          </h4>
          <div className="flex flex-col gap-2">
            {grouped[date].map((tx) => (
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
      ))}
    </div>
  );
};

export default TransactionList;
