import { Pencil, Trash2, Landmark } from "lucide-react";
import { formatMoney } from "../../utils/format";
import { ACCOUNT_ICON_MAP } from "../../utils/constants";
import { useCurrencyByCode } from "../../hooks/useCurrencies";

const AccountCard = ({ account, onEdit, onDelete }) => {
  const currency = useCurrencyByCode(account.currency);
  const isNegative = account.balance < 0;
  const IconComponent = ACCOUNT_ICON_MAP[account.icon];

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 group">
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
        <div className="text-[14px] font-medium text-text truncate">
          {account.name}
        </div>
        {account.institution && (
          <div className="text-[12px] text-sub truncate">
            {account.institution}
          </div>
        )}
      </div>

      <div className="text-right shrink-0">
        <div
          className={`text-[15px] font-semibold ${
            isNegative ? "text-coral" : "text-text"
          }`}
        >
          {formatMoney(account.balance, currency)}
        </div>
        <div className="text-[11px] text-sub">{account.currency}</div>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
        <button
          onClick={() => onEdit(account)}
          className="p-1.5 rounded-md text-sub hover:bg-light cursor-pointer bg-transparent border-none"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(account)}
          className="p-1.5 rounded-md text-error hover:bg-error-bg cursor-pointer bg-transparent border-none"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default AccountCard;
