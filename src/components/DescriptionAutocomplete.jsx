import { useState, useRef, useEffect, useMemo } from "react";
import CategoryIcon from "./CategoryIcon";

const DescriptionAutocomplete = ({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder = "예: 점심식사, 월급",
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef(null);
  const listRef = useRef(null);

  // 입력값으로 필터링
  const filtered = useMemo(() => {
    const q = value?.trim().toLowerCase();
    if (!q) return [];
    return suggestions
      .filter((s) => s.description.toLowerCase().includes(q))
      .slice(0, 8);
  }, [value, suggestions]);

  const showDropdown = open && filtered.length > 0;

  // 외부 클릭 닫기
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  // 활성 항목 스크롤
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[activeIndex];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleSelect = (suggestion) => {
    onChange(suggestion.description);
    onSelect?.(suggestion);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {showDropdown && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-xl shadow-lg max-h-[200px] overflow-y-auto py-1"
        >
          {filtered.map((s, idx) => (
            <button
              key={s.description}
              type="button"
              onClick={() => handleSelect(s)}
              className={`w-full px-3 py-2 flex items-center gap-2.5 text-sm text-left cursor-pointer border-none transition-colors ${
                idx === activeIndex
                  ? "bg-mint-bg text-mint"
                  : "bg-transparent text-text hover:bg-light"
              }`}
            >
              {s.categoryIcon && (
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: (s.categoryColor || "#94a3b8") + "18",
                  }}
                >
                  <CategoryIcon
                    name={s.categoryIcon}
                    size={14}
                    style={{ color: s.categoryColor || "#94a3b8" }}
                  />
                </span>
              )}
              <span className="flex-1 truncate">{s.description}</span>
              {s.categoryName && (
                <span className="text-[12px] text-sub shrink-0">
                  {s.categoryName}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DescriptionAutocomplete;
