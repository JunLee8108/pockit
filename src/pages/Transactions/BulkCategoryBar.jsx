import { useState, useRef, useEffect } from "react";
import { X, CheckCheck, Tag, Loader2 } from "lucide-react";
import CategoryIcon from "../../components/CategoryIcon";

// 선택 모드 하단 고정 액션 바 — 선택 건수, 전체 선택, 카테고리 지정
const BulkCategoryBar = ({
  count,
  allSelected,
  onSelectAll,
  onApply,
  onClose,
  categories,
  applying,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  const expense = categories.filter((c) => c.type === "expense");
  const income = categories.filter((c) => c.type === "income");

  const pick = (categoryId) => {
    setPickerOpen(false);
    onApply(categoryId);
  };

  return (
    <div
      ref={ref}
      className="fixed left-1/2 -translate-x-1/2 z-40 bottom-[calc(6rem+env(safe-area-inset-bottom))] lg:bottom-6 w-[calc(100%-2rem)] max-w-md"
    >
      {pickerOpen && (
        <div className="absolute bottom-full mb-2 w-full bg-surface border border-border rounded-xl shadow-lg max-h-[280px] overflow-y-auto py-1">
          <button
            type="button"
            onClick={() => pick(null)}
            className="w-full px-3 py-2 flex items-center gap-2.5 text-sm text-left cursor-pointer border-none bg-transparent text-sub hover:bg-light transition-colors"
          >
            <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-light">
              <X size={14} className="text-sub" />
            </span>
            <span>미분류로 변경</span>
          </button>
          {[
            { label: "지출", items: expense },
            { label: "수입", items: income },
          ].map(
            (group) =>
              group.items.length > 0 && (
                <div key={group.label}>
                  <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-sub uppercase tracking-wider">
                    {group.label}
                  </div>
                  {group.items.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => pick(cat.id)}
                      className="w-full px-3 py-2 flex items-center gap-2.5 text-sm text-left cursor-pointer border-none bg-transparent text-text hover:bg-light transition-colors"
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
                  ))}
                </div>
              ),
          )}
        </div>
      )}

      <div className="dash-card bg-surface border border-border shadow-lg rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-[13px] font-semibold text-text whitespace-nowrap">
          {count}건 선택
        </span>

        <button
          onClick={onSelectAll}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer border-none transition-colors ${
            allSelected ? "bg-mint-bg text-mint" : "bg-light text-sub hover:text-text"
          }`}
        >
          <CheckCheck size={14} />
          전체
        </button>

        <button
          onClick={() => setPickerOpen((p) => !p)}
          disabled={count === 0 || applying}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-mint text-white rounded-lg text-[13px] font-medium cursor-pointer border-none hover:bg-mint-hover transition-colors disabled:opacity-40 disabled:cursor-default"
        >
          {applying ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Tag size={14} />
          )}
          카테고리 지정
        </button>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default BulkCategoryBar;
