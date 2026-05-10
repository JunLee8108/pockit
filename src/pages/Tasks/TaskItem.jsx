import { Pencil, Trash2, Check, Clock } from "lucide-react";
import CategoryIcon from "../../components/CategoryIcon";

const PRIORITY_DOT = {
  low: "#94a3b8",
  normal: "#7dd3fc",
  high: "#ef4444",
};

const PRIORITY_LABEL = {
  low: "낮음",
  normal: "보통",
  high: "높음",
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatDueDate = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const today = todayStr();
  const [, m, d] = dateStr.split("-").map(Number);
  const now = new Date();
  const tmrw = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tmrwStr = `${tmrw.getFullYear()}-${String(tmrw.getMonth() + 1).padStart(2, "0")}-${String(tmrw.getDate()).padStart(2, "0")}`;

  let label;
  if (dateStr === today) label = "오늘";
  else if (dateStr === tmrwStr) label = "내일";
  else label = `${m}월 ${d}일`;

  if (timeStr) {
    const [hh, mm] = timeStr.split(":");
    return `${label} ${hh}:${mm}`;
  }
  return label;
};

const TaskItem = ({ task, onToggle, onEdit, onDelete }) => {
  const isDone = task.status === "done";
  const today = todayStr();
  const overdue = !isDone && task.due_date && task.due_date < today;
  const dueLabel = formatDueDate(task.due_date, task.due_time);

  return (
    <div
      id={`task-${task.id}`}
      className="dash-card bg-surface shadow-sm rounded-xl p-3 flex items-start gap-3 group"
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task)}
        className={`shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${
          isDone
            ? "bg-mint border-mint"
            : "bg-transparent border-border hover:border-mint"
        }`}
        aria-label={isDone ? "완료 취소" : "완료"}
      >
        {isDone && <Check size={12} className="text-white" strokeWidth={3} />}
      </button>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="shrink-0 w-2 h-2 rounded-full"
            style={{ backgroundColor: PRIORITY_DOT[task.priority] }}
            title={PRIORITY_LABEL[task.priority]}
          />
          <div
            className={`text-[14px] font-medium leading-snug break-all ${
              isDone ? "line-through text-sub" : "text-text"
            }`}
          >
            {task.title}
          </div>
        </div>

        {(dueLabel || task.category || task.description) && (
          <div className="mt-1.5 flex items-center flex-wrap gap-x-2 gap-y-1 text-[12px] text-sub">
            {dueLabel && (
              <span
                className={`inline-flex items-center gap-1 ${overdue ? "text-error font-medium" : ""}`}
              >
                <Clock size={11} />
                {dueLabel}
              </span>
            )}
            {task.category && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: task.category.color + "18",
                  color: task.category.color,
                }}
              >
                <CategoryIcon
                  name={task.category.icon}
                  size={11}
                  style={{ color: task.category.color }}
                />
                {task.category.name}
              </span>
            )}
            {task.description && (
              <span className="truncate max-w-full text-sub">
                {task.description}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="hover-actions flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="p-1.5 rounded-md text-sub hover:bg-light cursor-pointer bg-transparent border-none"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task);
          }}
          className="p-1.5 rounded-md text-error hover:bg-error-bg cursor-pointer bg-transparent border-none"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default TaskItem;
