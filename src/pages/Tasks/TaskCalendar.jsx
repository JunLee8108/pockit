import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import TaskItem from "./TaskItem";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const ymd = (year, month, day) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const todayStr = () => {
  const d = new Date();
  return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
};

const TaskCalendar = ({ tasks, onAddForDate, onToggle, onEdit, onDelete }) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const tasksByDate = useMemo(() => {
    const map = new Map();
    for (const t of tasks) {
      if (!t.due_date) continue;
      if (!map.has(t.due_date)) map.set(t.due_date, []);
      map.get(t.due_date).push(t);
    }
    return map;
  }, [tasks]);

  const grid = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startWeekday = firstDay.getDay(); // 0=Sun
    const totalDays = lastDay.getDate();

    const cells = [];
    // 앞 빈칸
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    // 날짜
    for (let d = 1; d <= totalDays; d++) {
      cells.push({
        day: d,
        date: ymd(year, month, d),
      });
    }
    // 6주 채우기 (42칸)
    while (cells.length < 42) cells.push(null);
    return cells;
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
    setSelectedDate(todayStr());
  };

  const selectedTasks = selectedDate ? tasksByDate.get(selectedDate) || [] : [];

  return (
    <div className="flex flex-col gap-4">
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
      <div className="dash-card bg-surface shadow-sm rounded-2xl p-3">
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`text-center text-[11px] font-medium py-1 ${
                i === 0 ? "text-coral" : i === 6 ? "text-sky" : "text-sub"
              }`}
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell, idx) => {
            if (!cell) return <div key={idx} className="aspect-square" />;
            const items = tasksByDate.get(cell.date) || [];
            const todoCount = items.filter((t) => t.status === "todo").length;
            const doneCount = items.filter((t) => t.status === "done").length;
            const isToday = cell.date === today;
            const isSelected = cell.date === selectedDate;
            const weekday = idx % 7;

            return (
              <button
                key={cell.date}
                onClick={() => setSelectedDate(cell.date)}
                className={`aspect-square rounded-lg p-1 flex flex-col items-center cursor-pointer border transition-colors ${
                  isSelected
                    ? "border-mint bg-mint-bg"
                    : isToday
                      ? "border-mint bg-transparent"
                      : "border-transparent bg-transparent hover:bg-light"
                }`}
              >
                <span
                  className={`text-[12px] font-medium leading-none mt-1 ${
                    isToday
                      ? "text-mint font-bold"
                      : weekday === 0
                        ? "text-coral"
                        : weekday === 6
                          ? "text-sky"
                          : "text-text"
                  }`}
                >
                  {cell.day}
                </span>
                <div className="flex-1 flex items-end gap-0.5 pb-0.5">
                  {todoCount > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-mint" />
                  )}
                  {doneCount > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-border" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day list */}
      {selectedDate && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-[14px] font-semibold text-text">
              {(() => {
                const [y, m, d] = selectedDate.split("-").map(Number);
                return `${y}년 ${m}월 ${d}일`;
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
      )}
    </div>
  );
};

export default TaskCalendar;
