import { useState } from "react";
import { Check, Plus, Repeat, GripVertical } from "lucide-react";
import {
  itemColor,
  plannerDrag,
  startPlannerDrag,
  endPlannerDrag,
} from "../../utils/planner";

const TrayItem = ({ task, overdue, onEdit, onToggle }) => {
  const done = task.status === "done";
  const color = itemColor(task);
  const [, m, d] = (task.due_date || "").split("-").map(Number);

  return (
    <div
      draggable={!done}
      onDragStart={(e) => startPlannerDrag(e, task)}
      onDragEnd={endPlannerDrag}
      onClick={() => onEdit(task)}
      className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-light cursor-pointer"
    >
      <GripVertical
        size={12}
        className="shrink-0 text-sub/50 hidden sm:block opacity-0 group-hover:opacity-100"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task);
        }}
        className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${
          done ? "bg-mint border-mint" : "bg-transparent border-border hover:border-mint"
        }`}
        aria-label={done ? "완료 취소" : "완료"}
      >
        {done && <Check size={10} className="text-white" strokeWidth={3} />}
      </button>
      <span
        className="shrink-0 w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span
        className={`flex-1 min-w-0 truncate text-[13px] ${
          done ? "line-through text-sub" : "text-text"
        }`}
      >
        {task.recurring_task_id && (
          <Repeat size={10} className="inline -mt-px mr-1 text-sub" />
        )}
        {task.title}
      </span>
      {overdue && (
        <span className="shrink-0 text-[11px] font-medium text-error">
          {m}/{d}
        </span>
      )}
    </div>
  );
};

// 시간 미정 할일 — 시간축으로 끌어다 놓아 시간 블록으로 배정
// 시간 블록을 여기로 끌어오면 시간 해제
const UnscheduledTray = ({ tasks, overdue = [], onAdd, onEdit, onToggle, onDropItem }) => {
  const [dragOver, setDragOver] = useState(false);
  const todoCount =
    tasks.filter((t) => t.status === "todo").length + overdue.length;

  return (
    <div
      onDragOver={(e) => {
        if (!plannerDrag.current) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const id = e.dataTransfer.getData("text/planner-item");
        endPlannerDrag();
        if (id) onDropItem(id);
      }}
      className={`dash-card bg-surface shadow-sm rounded-2xl p-3 flex flex-col gap-1 transition-colors ${
        dragOver ? "ring-2 ring-mint ring-inset bg-mint-bg" : ""
      }`}
    >
      <div className="flex items-center justify-between px-1 pb-1">
        <h3 className="text-[13px] font-semibold text-text">
          시간 미정
          <span className="ml-1.5 text-[12px] font-normal text-sub">{todoCount}</span>
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-0.5 text-[12px] text-mint font-medium bg-transparent border-none cursor-pointer"
        >
          <Plus size={13} />
          할일
        </button>
      </div>

      {overdue.length > 0 && (
        <>
          <div className="px-2 pt-1 text-[11px] font-medium text-error">지연됨</div>
          {overdue.map((t) => (
            <TrayItem key={t.id} task={t} overdue onEdit={onEdit} onToggle={onToggle} />
          ))}
          {tasks.length > 0 && <div className="mx-2 my-1 border-t border-border" />}
        </>
      )}

      {tasks.map((t) => (
        <TrayItem key={t.id} task={t} onEdit={onEdit} onToggle={onToggle} />
      ))}

      {tasks.length === 0 && overdue.length === 0 && (
        <p className="px-2 py-3 text-[12px] text-sub text-center">
          시간 미정 할일이 없습니다
        </p>
      )}

      <p className="hidden sm:block px-2 pt-1 text-[11px] text-sub">
        시간표로 끌어다 놓으면 시간 블록이 됩니다
      </p>
    </div>
  );
};

export default UnscheduledTray;
