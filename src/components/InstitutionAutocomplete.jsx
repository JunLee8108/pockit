import { useState, useRef, useEffect, useMemo } from "react";
import { INSTITUTIONS } from "../utils/constants";

const InstitutionAutocomplete = ({ value, onChange, className = "" }) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef(null);
  const listRef = useRef(null);

  const filtered = useMemo(() => {
    const q = value?.trim().toLowerCase();
    if (!q) return [];
    return INSTITUTIONS.filter((name) =>
      name.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [value]);

  const showDropdown = open && filtered.length > 0;

  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [value]);

  const handleSelect = (name) => {
    onChange(name);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex];
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="예: Chase, 신한은행"
        className={className}
      />
      {showDropdown && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-xl shadow-lg max-h-[180px] overflow-y-auto py-1"
        >
          {filtered.map((name, i) => (
            <button
              key={name}
              type="button"
              onClick={() => handleSelect(name)}
              className={`w-full px-3 py-2 text-[13px] text-left cursor-pointer border-none transition-colors ${
                i === activeIndex
                  ? "bg-mint-bg text-mint font-medium"
                  : "bg-transparent text-text hover:bg-light"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstitutionAutocomplete;
