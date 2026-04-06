import { Pencil, Trash2 } from "lucide-react";
import CategoryIcon from "../../components/CategoryIcon";

const CategoryCard = ({ category, onEdit, onDelete, isSub = false }) => {
  return (
    <div
      id={`cat-${category.id}`}
      className={`dash-card bg-surface shadow-sm rounded-xl flex items-center gap-3 group ${
        isSub ? "p-3" : "p-4"
      }`}
    >
      <div
        className={`rounded-lg flex items-center justify-center shrink-0 ${
          isSub ? "w-7 h-7" : "w-9 h-9"
        }`}
        style={{ backgroundColor: category.color + "18" }}
      >
        <CategoryIcon
          name={category.icon}
          size={isSub ? 14 : 18}
          style={{ color: category.color }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={`font-medium text-text truncate ${
            isSub ? "text-[13px]" : "text-[14px]"
          }`}
        >
          {category.name}
        </div>
        {category.is_default && (
          <span className="text-[11px] text-sub">기본</span>
        )}
      </div>

      <div
        className="w-3.5 h-3.5 rounded-full shrink-0"
        style={{ backgroundColor: category.color }}
      />

      <div className="hover-actions flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(category);
          }}
          className="p-1.5 rounded-md text-sub hover:bg-light cursor-pointer bg-transparent border-none"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(category);
          }}
          className="p-1.5 rounded-md text-error hover:bg-error-bg cursor-pointer bg-transparent border-none"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default CategoryCard;
