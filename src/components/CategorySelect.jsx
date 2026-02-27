import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import CategoryIcon from "../components/CategoryIcon";

const CategorySelect = ({
  categories,
  value,
  onChange,
  placeholder = "카테고리 선택",
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = categories.find((c) => c.id === value) || null;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger — div로 변경 (내부 button 중첩 방지) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((p) => !p)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((p) => !p);
          }
        }}
        className="w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-left outline-none transition-colors duration-150 focus:border-mint flex items-center gap-2.5 cursor-pointer"
      >
        {selected ? (
          <>
            <span
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: selected.color + "18" }}
            >
              <CategoryIcon
                name={selected.icon}
                size={14}
                style={{ color: selected.color }}
              />
            </span>
            <span className="flex-1 text-text truncate">{selected.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-0.5 rounded text-sub hover:text-text bg-transparent border-none cursor-pointer shrink-0"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 text-sub">{placeholder}</span>
            <ChevronDown size={16} className="text-sub shrink-0" />
          </>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-xl shadow-lg max-h-[240px] overflow-y-auto py-1">
          {/* 미분류 */}
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`w-full px-3 py-2 flex items-center gap-2.5 text-sm text-left cursor-pointer border-none transition-colors ${
              !value
                ? "bg-mint-bg text-mint font-medium"
                : "bg-transparent text-sub hover:bg-light"
            }`}
          >
            <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-light">
              <X size={14} className="text-sub" />
            </span>
            <span>미분류</span>
          </button>

          {/* 카테고리 목록 */}
          {categories.map((cat) => {
            const isSelected = cat.id === value;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChange(cat.id);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 flex items-center gap-2.5 text-sm text-left cursor-pointer border-none transition-colors ${
                  isSelected
                    ? "bg-mint-bg text-mint font-medium"
                    : "bg-transparent text-text hover:bg-light"
                }`}
              >
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: cat.color + "18" }}
                >
                  <CategoryIcon
                    name={cat.icon}
                    size={14}
                    style={{ color: cat.color }}
                  />
                </span>
                <span className="truncate">{cat.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategorySelect;
