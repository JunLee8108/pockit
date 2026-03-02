import { Pencil, Trash2, Copy, ArrowRightLeft } from "lucide-react";
import { formatMoney } from "../../utils/format";
import CategoryIcon from "../../components/CategoryIcon";
import { useCurrencyByCode } from "../../hooks/useCurrencies";

const TYPE_STYLES = {
  income: { sign: "+", color: "text-mint" },
  expense: { sign: "-", color: "text-coral" },
  transfer: { sign: "", color: "text-sub" },
};

const TransactionCard = ({ tx, onEdit, onDelete, onDuplicate }) => {
  const currency = useCurrencyByCode(tx.currency);
  const style = TYPE_STYLES[tx.type];

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3 group">
      {/* Category Icon */}
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
            size={18}
            style={{ color: tx.category?.color || "#94a3b8" }}
          />
        )}
      </div>

      {/* Info */}
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

      {/* Amount */}
      <div className={`text-[15px] font-semibold shrink-0 ${style.color}`}>
        {style.sign}
        {formatMoney(tx.amount, currency)}
      </div>

      {/* Actions */}
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

export default TransactionCard;
