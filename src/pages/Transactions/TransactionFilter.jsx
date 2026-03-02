import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import CategoryIcon from "../../components/CategoryIcon";

const TYPE_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "income", label: "수입" },
  { value: "expense", label: "지출" },
  { value: "transfer", label: "이체" },
];

const TransactionFilter = ({
  filters,
  onChange,
  categories = [],
  categoryIds = [],
  onCategoryToggle,
}) => {
  const { year, month, type, search } = filters;

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
    onChange({ ...filters, year: y, month: m });
  };

  const showCategories =
    type !== "transfer" && categories.length > 0 && onCategoryToggle;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Month Nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goMonth(-1)}
            className="p-1.5 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-[15px] font-semibold text-text min-w-[120px] text-center">
            {year}년 {month}월
          </span>
          <button
            onClick={() => goMonth(1)}
            className="p-1.5 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Type Filter */}
        <div className="flex gap-1 bg-light rounded-lg p-1">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, type: opt.value })}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium cursor-pointer border-none transition-colors ${
                type === opt.value
                  ? "bg-surface text-text shadow-sm"
                  : "bg-transparent text-sub hover:text-text"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Chips — 모바일만 */}
      {showCategories && (
        <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => onCategoryToggle(null)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer border-none transition-colors whitespace-nowrap shrink-0 ${
              categoryIds.length === 0
                ? "bg-text text-surface"
                : "bg-light text-sub"
            }`}
          >
            전체
          </button>
          {categories.map((cat) => {
            const selected = categoryIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryToggle(cat.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer border-none transition-colors whitespace-nowrap shrink-0 ${
                  selected ? "text-white" : "bg-light text-sub"
                }`}
                style={
                  selected
                    ? { backgroundColor: cat.color || "#94a3b8" }
                    : undefined
                }
              >
                <CategoryIcon
                  name={cat.icon}
                  size={12}
                  style={{ color: selected ? "#fff" : cat.color || "#94a3b8" }}
                />
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none"
        />
        <input
          type="text"
          value={search || ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="설명, 카테고리, 계좌, 메모 검색"
          className="w-full pl-9 pr-9 py-2.5 bg-bg border border-border rounded-lg text-sm text-text outline-none transition-colors duration-150 focus:border-mint"
        />
        {search && (
          <button
            onClick={() => onChange({ ...filters, search: "" })}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-sub hover:text-text bg-transparent border-none cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TransactionFilter;
