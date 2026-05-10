import { useState } from "react";
import { X } from "lucide-react";
import { useAddTask, useUpdateTask } from "../../hooks/useTasks";
import { useTaskCategories } from "../../hooks/useTaskCategories";
import CategoryIcon from "../../components/CategoryIcon";

const inputCls =
  "w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-text outline-none transition-colors duration-150 focus:border-mint";

const PRIORITIES = [
  { value: "low", label: "낮음", color: "#94a3b8" },
  { value: "normal", label: "보통", color: "#7dd3fc" },
  { value: "high", label: "높음", color: "#ef4444" },
];

const TaskFormInner = ({
  onClose,
  editTask = null,
  defaultDate = null,
  defaultTitle = "",
}) => {
  const addTask = useAddTask();
  const updateTask = useUpdateTask();
  const { data: categories = [] } = useTaskCategories();

  const isEdit = !!editTask;

  const [title, setTitle] = useState(editTask?.title || defaultTitle || "");
  const [description, setDescription] = useState(editTask?.description || "");
  const [dueDate, setDueDate] = useState(
    editTask?.due_date || defaultDate || "",
  );
  const [dueTime, setDueTime] = useState(editTask?.due_time?.slice(0, 5) || "");
  const [priority, setPriority] = useState(editTask?.priority || "normal");
  const [categoryId, setCategoryId] = useState(editTask?.category_id || "");
  const [error, setError] = useState("");

  const submitting = addTask.isPending || updateTask.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("할일 제목을 입력하세요");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate || null,
      due_time: dueTime || null,
      priority,
      category_id: categoryId || null,
    };

    try {
      if (isEdit) {
        await updateTask.mutateAsync({ id: editTask.id, updates: payload });
      } else {
        await addTask.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message || "오류가 발생했습니다");
    }
  };

  return (
    <>
      {error && (
        <div className="px-4 py-3 bg-error-bg rounded-lg text-[13px] text-error mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 보고서 작성, 운동 가기"
            required
            autoFocus={!isEdit}
            className={inputCls}
          />
        </div>

        {/* Due date + time */}
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-[13px] text-sub font-medium">기한일</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="w-32 flex flex-col gap-1.5">
            <label className="text-[13px] text-sub font-medium">시각</label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              disabled={!dueDate}
              className={inputCls}
            />
          </div>
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">우선순위</label>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer border-none transition-colors ${
                  priority === p.value ? "text-white" : "bg-light text-sub"
                }`}
                style={
                  priority === p.value ? { backgroundColor: p.color } : undefined
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">카테고리</label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryId("")}
              className={`px-3 py-1.5 rounded-lg text-[13px] cursor-pointer border transition-colors ${
                !categoryId
                  ? "border-mint bg-mint-bg text-mint font-semibold"
                  : "border-border bg-bg text-sub"
              }`}
            >
              없음
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] cursor-pointer border transition-colors ${
                  categoryId === c.id
                    ? "border-mint bg-mint-bg font-semibold"
                    : "border-border bg-bg"
                }`}
                style={{ color: categoryId === c.id ? c.color : undefined }}
              >
                <CategoryIcon name={c.icon} size={14} style={{ color: c.color }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-sub font-medium">메모</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="추가 설명 (선택)"
            className={`${inputCls} resize-none`}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full mt-2 py-3 rounded-lg text-[15px] font-semibold text-white border-none cursor-pointer transition-colors ${
            submitting
              ? "bg-border cursor-not-allowed"
              : "bg-mint hover:bg-mint-hover"
          }`}
        >
          {submitting
            ? isEdit
              ? "수정 중..."
              : "추가 중..."
            : isEdit
              ? "수정 완료"
              : "할일 추가"}
        </button>
      </form>
    </>
  );
};

const ANIM_DURATION = 250;

const TaskForm = ({
  open,
  onClose,
  editTask = null,
  defaultDate = null,
  defaultTitle = "",
}) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  if (open && !visible && !closing) {
    setVisible(true);
  }

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setVisible(false);
      onClose();
    }, ANIM_DURATION);
  };

  if (!visible) return null;

  const animating = closing;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleClose}
    >
      <div
        className={`fixed inset-0 bg-black/30 ${animating ? "animate-fadeOut" : "animate-fadeIn"}`}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative overscroll-contain bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-[500px] max-h-[90vh] overflow-y-auto ${
          animating ? "animate-slideDown" : "animate-slideUp"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[17px] font-semibold text-text">
            {editTask ? "할일 수정" : "할일 추가"}
          </h3>
          <button
            onClick={handleClose}
            className="text-sub p-1 cursor-pointer bg-transparent border-none"
          >
            <X size={18} />
          </button>
        </div>

        <TaskFormInner
          key={editTask?.id || `new-${defaultDate || ""}-${defaultTitle || ""}`}
          onClose={handleClose}
          editTask={editTask}
          defaultDate={defaultDate}
          defaultTitle={defaultTitle}
        />
      </div>
    </div>
  );
};

export default TaskForm;
