import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TimeGrid from "./TimeGrid";
import usePlannerMove from "../../hooks/usePlannerMove";
import { groupByDate, addDays } from "../../utils/recurrence";
import { getReadableTextColor } from "../../utils/colorContrast";
import {
  isEvent,
  itemColor,
  todayStr,
  dayOfWeek,
  weekStartOf,
  plannerDrag,
  startPlannerDrag,
  endPlannerDrag,
} from "../../utils/planner";

const VISIBLE_ALL_DAY = 3;

const formatRange = (start, end) => {
  const [, sm, sd] = start.split("-").map(Number);
  const [, em, ed] = end.split("-").map(Number);
  return sm === em ? `${sm}월 ${sd}일 - ${ed}일` : `${sm}월 ${sd}일 - ${em}월 ${ed}일`;
};

// 종일 일정 / 시간 미정 할일 칩 — 할일은 시간축으로 끌어 배정 가능
const AllDayChip = ({ task, onEdit }) => {
  const event = isEvent(task);
  const done = task.status === "done";
  const color = itemColor(task);
  return (
    <div
      draggable={!event && !done}
      onDragStart={(e) => startPlannerDrag(e, task)}
      onDragEnd={endPlannerDrag}
      onClick={(e) => {
        e.stopPropagation();
        onEdit(task);
      }}
      className={`truncate px-1.5 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
        done ? "opacity-50 line-through" : ""
      }`}
      style={
        event
          ? { backgroundColor: color, color: getReadableTextColor(color) }
          : { backgroundColor: `${color}26`, borderLeft: `2px solid ${color}` }
      }
      title={task.title}
    >
      {task.title}
    </div>
  );
};

const AllDayCell = ({ date, items, onEdit, onOpenDay, onDropItem }) => {
  const [dragOver, setDragOver] = useState(false);
  const visible = items.slice(0, VISIBLE_ALL_DAY);
  const overflow = items.length - visible.length;

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
        if (id) onDropItem(id, date);
      }}
      className={`flex-1 min-w-0 border-l border-border p-1 flex flex-col gap-0.5 min-h-[32px] ${
        dragOver ? "bg-mint-bg" : ""
      }`}
    >
      {visible.map((t) => (
        <AllDayChip key={t.id} task={t} onEdit={onEdit} />
      ))}
      {overflow > 0 && (
        <button
          type="button"
          onClick={() => onOpenDay(date)}
          className="text-[10px] text-sub hover:text-text text-left px-1 bg-transparent border-none cursor-pointer"
        >
          + {overflow}건 더
        </button>
      )}
    </div>
  );
};

// 주간 플래너 (데스크톱): 7일 시간축
const WeekPlanner = ({ tasks, date, onDateChange, onOpenDay, onAdd, onEdit, onToggle }) => {
  const today = todayStr();
  const { move, resize, unschedule } = usePlannerMove();

  const weekStart = weekStartOf(date);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const byDate = useMemo(
    () => groupByDate(tasks, days[0], days[6]),
    [tasks, days],
  );

  const columns = days.map((d) => {
    const items = byDate.get(d) || [];
    return {
      date: d,
      items: items.filter((t) => t.due_time),
      allDay: items.filter((t) => !t.due_time),
    };
  });
  const byId = new Map(
    [...byDate.values()].flat().map((t) => [t.id, t]),
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDateChange(addDays(weekStart, -7))}
            className="p-2 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none"
            aria-label="이전 주"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-[15px] font-semibold text-text px-2 min-w-[150px] text-center">
            {formatRange(days[0], days[6])}
          </div>
          <button
            onClick={() => onDateChange(addDays(weekStart, 7))}
            className="p-2 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none"
            aria-label="다음 주"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          onClick={() => onDateChange(today)}
          className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-sub bg-light hover:bg-border cursor-pointer border-none"
        >
          오늘
        </button>
      </div>

      <div className="dash-card bg-surface shadow-sm rounded-2xl overflow-hidden border border-border">
        {/* Day headers */}
        <div className="flex border-b border-border">
          <div className="w-11 shrink-0" />
          {days.map((d, i) => {
            const isToday = d === today;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onOpenDay(d)}
                className="flex-1 min-w-0 flex flex-col items-center gap-0.5 py-2 border-l border-border bg-transparent cursor-pointer hover:bg-light"
              >
                <span
                  className={`text-[11px] font-medium ${
                    i === 5 ? "text-sky" : i === 6 ? "text-coral" : "text-sub"
                  }`}
                >
                  {dayOfWeek(d)}
                </span>
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[14px] font-semibold ${
                    isToday ? "bg-mint text-white" : "text-text"
                  }`}
                >
                  {Number(d.slice(8, 10))}
                </span>
              </button>
            );
          })}
        </div>

        {/* All-day / unscheduled */}
        <div className="flex border-b border-border">
          <div className="w-11 shrink-0 pt-1.5 pr-1.5 text-[10px] text-sub text-right">
            종일
          </div>
          {columns.map((c) => (
            <AllDayCell
              key={c.date}
              date={c.date}
              items={c.allDay}
              onEdit={onEdit}
              onOpenDay={onOpenDay}
              onDropItem={(id, d) => byId.has(id) && unschedule(byId.get(id), d)}
            />
          ))}
        </div>

        <TimeGrid
          columns={columns}
          today={today}
          hourHeight={48}
          onCreate={({ date: d, time, endTime }) =>
            onAdd({ date: d, time, endTime, kind: "event" })
          }
          onDropItem={(id, d, start) => byId.has(id) && move(byId.get(id), d, start)}
          onEdit={onEdit}
          onToggle={onToggle}
          onResize={resize}
        />
      </div>
    </div>
  );
};

export default WeekPlanner;
