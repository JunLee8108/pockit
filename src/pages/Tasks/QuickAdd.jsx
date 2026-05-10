import { useState, useRef } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { useAddTask } from "../../hooks/useTasks";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const QuickAdd = ({ onOpenFull }) => {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);
  const addTask = useAddTask();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await addTask.mutateAsync({
        title: trimmed,
        due_date: todayStr(),
        priority: "normal",
      });
      setTitle("");
      requestAnimationFrame(() => inputRef.current?.focus());
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenFull = () => {
    onOpenFull?.(title.trim() || null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 focus-within:border-mint transition-colors"
    >
      <Plus size={16} className="text-sub shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="빠른 할일 추가 (Enter로 저장 · 오늘 기한)"
        className="flex-1 bg-transparent border-none outline-none text-[14px] text-text placeholder:text-sub min-w-0"
        disabled={submitting}
      />
      {title.trim() && (
        <button
          type="button"
          onClick={handleOpenFull}
          className="flex items-center gap-0.5 text-[12px] text-sub hover:text-text bg-transparent border-none cursor-pointer shrink-0"
          title="상세 입력"
        >
          상세
          <ChevronRight size={14} />
        </button>
      )}
    </form>
  );
};

export default QuickAdd;
