import { Pencil, Trash2 } from "lucide-react";
import CategoryIcon from "../../components/CategoryIcon";

const getStatus = (pct) => {
  if (pct >= 100)
    return { color: "bg-coral", text: "text-coral", label: "초과" };
  if (pct >= 80)
    return { color: "bg-amber", text: "text-amber", label: "주의" };
  return { color: "bg-mint", text: "text-mint", label: "" };
};

const BudgetCard = ({ budget, spent, fmt, onEdit, onDelete }) => {
  const cat = budget.category;
  const remaining = budget.amount - spent;
  const pct = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
  const status = getStatus(pct);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 group">
      <div className="flex items-center gap-3 mb-3">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: (cat?.color || "#94a3b8") + "18" }}
        >
          <CategoryIcon
            name={cat?.icon}
            size={18}
            style={{ color: cat?.color || "#94a3b8" }}
          />
        </div>

        {/* Name + Status */}
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium text-text truncate">
            {cat?.name || "미분류"}
          </div>
          {status.label && (
            <span className={`text-[11px] font-medium ${status.text}`}>
              {status.label}
            </span>
          )}
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <div className="text-[14px] font-semibold text-text">
            {fmt(budget.amount)}
          </div>
          <div
            className={`text-[12px] font-medium ${remaining < 0 ? "text-coral" : "text-sub"}`}
          >
            {remaining < 0 ? `-${fmt(Math.abs(remaining))}` : fmt(remaining)}{" "}
            남음
          </div>
        </div>

        {/* Hover Actions */}
        <div className="hover-actions flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(budget);
            }}
            className="p-1.5 rounded-md text-sub hover:bg-light cursor-pointer bg-transparent border-none"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(budget);
            }}
            className="p-1.5 rounded-md text-error hover:bg-error-bg cursor-pointer bg-transparent border-none"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-light rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${status.color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Bottom Info */}
      <div className="flex justify-between mt-2 text-[12px] text-sub">
        <span>지출 {fmt(spent)}</span>
        <span>{pct}%</span>
      </div>
    </div>
  );
};

export default BudgetCard;
