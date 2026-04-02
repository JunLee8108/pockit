import { useState } from "react";
import { Link } from "react-router";
import { Pencil, Trash2, Copy, Receipt, ArrowRightLeft } from "lucide-react";
import { formatMoney } from "../../utils/format";
import { useCurrencyByCode } from "../../hooks/useCurrencies";
import CategoryIcon from "../../components/CategoryIcon";
import SwipeableCard from "../Accounts/SwipeableCard";

const TYPE_STYLES = {
  income: { sign: "+", color: "text-mint" },
  expense: { sign: "-", color: "text-coral" },
  transfer: { sign: "", color: "text-sub" },
};

const TxRow = ({ tx, onEdit, onDelete, onDuplicate }) => {
  const currency = useCurrencyByCode(tx.currency);
  const style = TYPE_STYLES[tx.type];

  return (
    <div className="flex items-center gap-3 py-3 group">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{
          backgroundColor: tx.category?.color
            ? tx.category.color + "18"
            : "var(--color-light)",
        }}
      >
        {tx.type === "transfer" ? (
          <ArrowRightLeft size={16} className="text-sub" />
        ) : (
          <CategoryIcon
            name={tx.category?.icon}
            size={16}
            style={{ color: tx.category?.color || "#94a3b8" }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium text-text truncate">
          {tx.description ||
            tx.category?.name ||
            (tx.type === "transfer" ? "이체" : "거래")}
        </div>
        <div className="text-[12px] text-sub truncate">
          {tx.account?.name}
          {tx.type === "transfer" &&
            tx.to_account &&
            ` → ${tx.to_account.name}`}
          {tx.category && tx.type !== "transfer" && ` · ${tx.category.name}`}
        </div>
      </div>

      <div className={`text-[14px] font-semibold shrink-0 ${style.color}`}>
        {style.sign}
        {formatMoney(tx.amount, currency)}
      </div>

      <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
        <button
          onClick={() => onDuplicate(tx)}
          className="p-1.5 rounded-md text-sub hover:bg-light cursor-pointer bg-transparent border-none"
          title="복제"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={() => onEdit(tx)}
          className="p-1.5 rounded-md text-sub hover:bg-light cursor-pointer bg-transparent border-none"
          title="수정"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(tx)}
          className="p-1.5 rounded-md text-error hover:bg-error-bg cursor-pointer bg-transparent border-none"
          title="삭제"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const RecentTransactions = ({ transactions, onEdit, onDelete, onDuplicate }) => {
  const [openCardId, setOpenCardId] = useState(null);
  const recent = transactions.slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="dash-card bg-surface rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-lg bg-lavender/15 flex items-center justify-center">
            <Receipt size={14} className="text-lavender" />
          </span>
          <h3 className="text-[13px] text-sub font-medium tracking-wide">
            최근 거래
          </h3>
        </div>
        <p className="text-[13px] text-sub">이번달 거래가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="dash-card bg-surface rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-lavender/15 flex items-center justify-center">
            <Receipt size={14} className="text-lavender" />
          </span>
          <h3 className="text-[13px] text-sub font-medium tracking-wide">
            최근 거래
          </h3>
        </div>
        <Link
          to="/transactions"
          className="text-mint text-[12px] font-medium no-underline"
        >
          전체 보기 →
        </Link>
      </div>

      <div onClick={() => setOpenCardId(null)}>
        {recent.map((tx, i) => (
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
            <div
              className={
                i < recent.length - 1 ? "border-b border-border" : ""
              }
            >
              <TxRow
                tx={tx}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
              />
            </div>
          </SwipeableCard>
        ))}
      </div>
    </div>
  );
};

export default RecentTransactions;
