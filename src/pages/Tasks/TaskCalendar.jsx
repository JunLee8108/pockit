import { useMemo, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useUpdateTask } from "../../hooks/useTasks";
import { getReadableTextColor } from "../../utils/colorContrast";
import BottomSheet from "../../components/BottomSheet";
import TaskItem from "./TaskItem";

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

const ymd = (year, month, day) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const todayStr = () => {
  const d = new Date();
  return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
};

const PRIORITY_DEFAULT_COLOR = {
  low: "#94a3b8",
  normal: "#7dd3fc",
  high: "#ef4444",
};

const barColor = (task) =>
  task.category?.color || PRIORITY_DEFAULT_COLOR[task.priority] || "#7dd3fc";

const VISIBLE_PER_CELL = 3;

const TaskBar = ({ task, onClick, onDragStart, onDragEnd }) => {
  const isDone = task.status === "done";
  const color = barColor(task);
  const textColor = getReadableTextColor(color);

  return (
    <button
      type="button"
      draggable={!isDone}
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onClick(task);
      }}
      className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium leading-tight truncate cursor-pointer border-none transition-opacity hover:opacity-90 ${
        isDone ? "opacity-50 line-through" : ""
      }`}
      style={{
        backgroundColor: color,
        color: textColor,
      }}
      title={task.title}
    >
      {task.due_time && (
        <span className="opacity-80 mr-1">{task.due_time.slice(0, 5)}</span>
      )}
      {task.title}
    </button>
  );
};

const TaskCalendar = ({ tasks, onAddForDate, onToggle, onEdit, onDelete }) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [dragOverDate, setDragOverDate] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [sheetDate, setSheetDate] = useState(null);
  const updateTask = useUpdateTask();

  const tasksByDate = useMemo(() => {
    const map = new Map();
    for (const t of tasks) {
      if (!t.due_date) continue;
      if (!map.has(t.due_date)) map.set(t.due_date, []);
      map.get(t.due_date).push(t);
    }
    return map;
  }, [tasks]);

  // 6주(42칸) 그리드 — 이전/다음 달 날짜 포함
  const cells = useMemo(() => {
    const firstOfMonth = new Date(year, month - 1, 1);
    // JS getDay: Sun=0..Sat=6 → 월요일 시작 인덱스로 변환
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // Mon=0..Sun=6
    // 그리드 첫 칸의 실제 날짜
    const gridStart = new Date(year, month - 1, 1 - firstWeekday);

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const yy = d.getFullYear();
      const mm = d.getMonth() + 1;
      const dd = d.getDate();
      return {
        date: ymd(yy, mm, dd),
        year: yy,
        month: mm,
        day: dd,
        isCurrentMonth: mm === month && yy === year,
      };
    });
  }, [year, month]);

  const today = todayStr();

  const goPrev = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else setMonth(month - 1);
  };
  const goNext = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else setMonth(month + 1);
  };
  const goToday = () => {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  // ── DnD ──
  const handleDragStart = useCallback((e, task) => {
    e.dataTransfer.setData("text/task-id", task.id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(task.id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverDate(null);
  }, []);

  const handleDragOver = useCallback((e, date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(date);
  }, []);

  const handleDragLeave = useCallback((e, date) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragOverDate((curr) => (curr === date ? null : curr));
  }, []);

  const handleDrop = useCallback(
    (e, targetDate) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData("text/task-id");
      setDragOverDate(null);
      setDraggingId(null);
      if (!taskId) return;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      if (task.due_date === targetDate) return;
      updateTask.mutate({
        id: taskId,
        updates: { due_date: targetDate },
      });
    },
    [tasks, updateTask],
  );

  const handleCellClick = (cell) => {
    onAddForDate(cell.date);
  };

  const sheetTasks = sheetDate ? tasksByDate.get(sheetDate) || [] : [];

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            className="p-2 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none"
            aria-label="이전 달"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-[15px] font-semibold text-text px-2 min-w-[110px] text-center">
            {year}년 {month}월
          </div>
          <button
            onClick={goNext}
            className="p-2 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none"
            aria-label="다음 달"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          onClick={goToday}
          className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-sub bg-light hover:bg-border cursor-pointer border-none"
        >
          오늘
        </button>
      </div>

      {/* Calendar grid */}
      <div className="dash-card bg-surface shadow-sm rounded-2xl overflow-hidden border border-border">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`text-center text-[11px] font-medium py-2 ${
                i === 5 ? "text-sky" : i === 6 ? "text-coral" : "text-sub"
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* 6주 × 7일 */}
        <div className="grid grid-cols-7 grid-rows-6">
          {cells.map((cell, idx) => {
            const items = tasksByDate.get(cell.date) || [];
            const visible = items.slice(0, VISIBLE_PER_CELL);
            const overflow = items.length - visible.length;
            const isToday = cell.date === today;
            const isDragOver = dragOverDate === cell.date;
            const weekday = idx % 7;
            const isFirstOfMonth = cell.day === 1;
            const dayLabel = isFirstOfMonth ? `${cell.month}월 1일` : cell.day;

            return (
              <div
                key={cell.date}
                onClick={() => handleCellClick(cell)}
                onDragOver={(e) => handleDragOver(e, cell.date)}
                onDragLeave={(e) => handleDragLeave(e, cell.date)}
                onDrop={(e) => handleDrop(e, cell.date)}
                className={`min-h-[88px] sm:min-h-[110px] p-1 sm:p-1.5 border-r border-b border-border last:border-r-0 cursor-pointer transition-colors flex flex-col gap-0.5 ${
                  idx >= 35 ? "border-b-0" : ""
                } ${(idx + 1) % 7 === 0 ? "border-r-0" : ""} ${
                  isDragOver
                    ? "bg-mint-bg ring-2 ring-mint ring-inset"
                    : "hover:bg-light"
                } ${cell.isCurrentMonth ? "" : "bg-bg/40"}`}
              >
                {/* Day label */}
                <div className="flex items-center justify-start mb-0.5">
                  {isToday ? (
                    <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-mint text-white text-[11px] font-semibold">
                      {dayLabel}
                    </span>
                  ) : (
                    <span
                      className={`text-[11px] font-medium px-1 ${
                        !cell.isCurrentMonth
                          ? "text-sub/50"
                          : weekday === 5
                            ? "text-sky"
                            : weekday === 6
                              ? "text-coral"
                              : "text-text"
                      }`}
                    >
                      {dayLabel}
                    </span>
                  )}
                </div>

                {/* Task bars */}
                <div className="flex flex-col gap-0.5">
                  {visible.map((task) => (
                    <TaskBar
                      key={task.id}
                      task={task}
                      onClick={onEdit}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                  {overflow > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSheetDate(cell.date);
                      }}
                      className="text-[10px] text-sub hover:text-text cursor-pointer bg-transparent border-none text-left px-1 py-0.5"
                    >
                      + {overflow}건 더
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drag hint */}
      {draggingId && (
        <div className="text-[12px] text-sub text-center">
          다른 날짜로 드래그해서 기한을 변경하세요
        </div>
      )}

      {/* Day overflow sheet */}
      <BottomSheet open={!!sheetDate} onClose={() => setSheetDate(null)}>
        <div className="px-4 pb-6">
          <div className="flex items-center justify-between py-3">
            <h3 className="text-[15px] font-semibold text-text">
              {sheetDate && (() => {
                const [y, m, d] = sheetDate.split("-").map(Number);
                return `${y}년 ${m}월 ${d}일`;
              })()}
              <span className="ml-2 text-[12px] font-normal text-sub">
                {sheetTasks.length}건
              </span>
            </h3>
            <button
              onClick={() => setSheetDate(null)}
              className="text-sub p-1 cursor-pointer bg-transparent border-none"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
            {sheetTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onEdit={(t) => {
                  setSheetDate(null);
                  onEdit(t);
                }}
                onDelete={(t) => {
                  setSheetDate(null);
                  onDelete(t);
                }}
              />
            ))}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default TaskCalendar;
