import { useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import TimeGrid from "./TimeGrid";
import UnscheduledTray from "./UnscheduledTray";
import usePlannerMove from "../../hooks/usePlannerMove";
import { groupByDate, addDays } from "../../utils/recurrence";
import { getReadableTextColor } from "../../utils/colorContrast";
import { isEvent, itemColor, todayStr, formatDayLabel } from "../../utils/planner";

const AllDayChip = ({ task, onEdit }) => {
  const color = itemColor(task);
  return (
    <button
      type="button"
      onClick={() => onEdit(task)}
      className="max-w-full truncate px-2 py-1 rounded-md text-[12px] font-medium cursor-pointer border-none"
      style={{ backgroundColor: color, color: getReadableTextColor(color) }}
      title={task.title}
    >
      {task.title}
    </button>
  );
};

// 오늘(하루) 플래너: 종일 일정 + 시간축 + 시간 미정 할일
const DayPlanner = ({
  tasks,
  listItems,
  date,
  onDateChange,
  onAdd,
  onEdit,
  onToggle,
  isMobile,
}) => {
  const today = todayStr();
  const { move, resize, unschedule } = usePlannerMove();

  const dayItems = useMemo(
    () => groupByDate(tasks, date, date).get(date) || [],
    [tasks, date],
  );
  const allDay = dayItems.filter((t) => isEvent(t) && !t.due_time);
  const timed = dayItems.filter((t) => t.due_time);
  const untimed = dayItems.filter((t) => !isEvent(t) && !t.due_time);
  // 오늘 화면에서는 지연된 할일도 함께 — 시간축에 놓으면 오늘로 재배정
  const overdue =
    date === today
      ? listItems.filter((t) => t.status === "todo" && t.due_date && t.due_date < today)
      : [];

  const dayTasks = dayItems.filter((t) => !isEvent(t));
  const doneCount = dayTasks.filter((t) => t.status === "done").length;
  const progress = dayTasks.length ? doneCount / dayTasks.length : 0;

  const byId = new Map([...dayItems, ...overdue].map((t) => [t.id, t]));

  const tray = (
    <UnscheduledTray
      tasks={untimed}
      overdue={overdue}
      onAdd={() => onAdd({ date })}
      onEdit={onEdit}
      onToggle={onToggle}
      onDropItem={(id) => byId.has(id) && unschedule(byId.get(id), date)}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 min-w-0">
          <button
            onClick={() => onDateChange(addDays(date, -1))}
            className="p-2 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none"
            aria-label="이전 날"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-[15px] font-semibold text-text px-1 truncate">
            {formatDayLabel(date)}
          </div>
          <button
            onClick={() => onDateChange(addDays(date, 1))}
            className="p-2 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none"
            aria-label="다음 날"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {date !== today && (
            <button
              onClick={() => onDateChange(today)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-sub bg-light hover:bg-border cursor-pointer border-none"
            >
              오늘
            </button>
          )}
          <button
            onClick={() => onAdd({ date, kind: "event" })}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium text-sub bg-light hover:bg-border cursor-pointer border-none"
          >
            <Plus size={13} />
            일정
          </button>
        </div>
      </div>

      {/* Progress */}
      {dayTasks.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 h-1.5 rounded-full bg-light overflow-hidden">
            <div
              className="h-full bg-mint rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="text-[12px] text-sub shrink-0">
            할일 {doneCount}/{dayTasks.length} 완료
          </span>
        </div>
      )}

      {isMobile && tray}

      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0 dash-card bg-surface shadow-sm rounded-2xl overflow-hidden border border-border">
          {/* All-day */}
          {allDay.length > 0 && (
            <div className="flex items-start gap-2 px-2 py-2 border-b border-border">
              <span className="w-9 shrink-0 pt-1 text-[10px] text-sub text-right">종일</span>
              <div className="flex flex-wrap gap-1 min-w-0">
                {allDay.map((t) => (
                  <AllDayChip key={t.id} task={t} onEdit={onEdit} />
                ))}
              </div>
            </div>
          )}
          <TimeGrid
            columns={[{ date, items: timed }]}
            today={today}
            hourHeight={isMobile ? 48 : 56}
            onCreate={({ time, endTime }) =>
              onAdd({ date, time, endTime, kind: "event" })
            }
            onDropItem={(id, d, start) => byId.has(id) && move(byId.get(id), d, start)}
            onEdit={onEdit}
            onToggle={onToggle}
            onResize={resize}
          />
        </div>

        {!isMobile && <div className="w-72 shrink-0 sticky top-4">{tray}</div>}
      </div>
    </div>
  );
};

export default DayPlanner;
