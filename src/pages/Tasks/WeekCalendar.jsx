import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import TaskItem from "./TaskItem";

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

const ymd = (year, month, day) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const todayStr = () => {
  const d = new Date();
  return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
};

// 주의 시작(월요일) 날짜 객체 반환
const startOfWeek = (date) => {
  const d = new Date(date);
  const dow = (d.getDay() + 6) % 7; // Mon=0..Sun=6
  d.setDate(d.getDate() - dow);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatRange = (start, end) => {
  const sM = start.getMonth() + 1;
  const sD = start.getDate();
  const eM = end.getMonth() + 1;
  const eD = end.getDate();
  if (sM === eM) return `${sM}월 ${sD}일 - ${eD}일`;
  return `${sM}월 ${sD}일 - ${eM}월 ${eD}일`;
};

const WeekCalendar = ({ tasks, onAddForDate, onToggle, onEdit, onDelete }) => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return {
        date: ymd(d.getFullYear(), d.getMonth() + 1, d.getDate()),
        day: d.getDate(),
        weekday: WEEKDAYS[i],
      };
    });
  }, [weekStart]);

  const tasksByDate = useMemo(() => {
    const map = new Map();
    for (const t of tasks) {
      if (!t.due_date) continue;
      if (!map.has(t.due_date)) map.set(t.due_date, []);
      map.get(t.due_date).push(t);
    }
    return map;
  }, [tasks]);

  const today = todayStr();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const goPrev = () => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() - 7);
    setWeekStart(d);
  };
  const goNext = () => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + 7);
    setWeekStart(d);
  };
  const goToday = () => {
    setWeekStart(startOfWeek(new Date()));
    setSelectedDate(todayStr());
  };

  const selectedTasks = selectedDate ? tasksByDate.get(selectedDate) || [] : [];

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            className="p-2 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none"
            aria-label="이전 주"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-[14px] font-semibold text-text px-2 min-w-[140px] text-center">
            {formatRange(weekStart, weekEnd)}
          </div>
          <button
            onClick={goNext}
            className="p-2 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none"
            aria-label="다음 주"
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

      {/* Day strip */}
      <div className="dash-card bg-surface shadow-sm rounded-2xl p-2">
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            const items = tasksByDate.get(d.date) || [];
            const todoCount = items.filter((t) => t.status === "todo").length;
            const doneCount = items.filter((t) => t.status === "done").length;
            const isToday = d.date === today;
            const isSelected = d.date === selectedDate;

            return (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl cursor-pointer border transition-colors ${
                  isSelected
                    ? "border-mint bg-mint-bg"
                    : "border-transparent bg-transparent hover:bg-light"
                }`}
              >
                <span
                  className={`text-[10px] font-medium ${
                    i === 5 ? "text-sky" : i === 6 ? "text-coral" : "text-sub"
                  }`}
                >
                  {d.weekday}
                </span>
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[13px] font-semibold ${
                    isToday
                      ? "bg-mint text-white"
                      : isSelected
                        ? "text-mint"
                        : "text-text"
                  }`}
                >
                  {d.day}
                </span>
                <div className="flex items-center gap-0.5 h-1.5">
                  {todoCount > 0 && (
                    <span className="w-1 h-1 rounded-full bg-mint" />
                  )}
                  {doneCount > 0 && (
                    <span className="w-1 h-1 rounded-full bg-border" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day list */}
      <div className="flex items-center justify-between mt-1">
        <h3 className="text-[14px] font-semibold text-text">
          {(() => {
            const [y, m, dd] = selectedDate.split("-").map(Number);
            return `${y}년 ${m}월 ${dd}일`;
          })()}
          <span className="ml-2 text-[12px] font-normal text-sub">
            {selectedTasks.length}건
          </span>
        </h3>
        <button
          onClick={() => onAddForDate(selectedDate)}
          className="flex items-center gap-1 px-3 py-1.5 bg-mint text-white rounded-lg text-[12px] font-medium cursor-pointer border-none hover:bg-mint-hover transition-colors"
        >
          <Plus size={14} />
          추가
        </button>
      </div>

      {selectedTasks.length === 0 ? (
        <div className="dash-card bg-surface shadow-sm rounded-xl p-6 text-center">
          <p className="text-sub text-[13px]">할일이 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {selectedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WeekCalendar;
