import { useEffect, useRef, useState } from "react";
import { Check, Repeat } from "lucide-react";
import { getReadableTextColor } from "../../utils/colorContrast";
import {
  DAY_MINUTES,
  SNAP_MINUTES,
  DEFAULT_BLOCK_MINUTES,
  layoutBlocks,
  fromMinutes,
  snap,
  clampStart,
  nowMinutes,
  formatTimeRange,
  isEvent,
  itemColor,
  plannerDrag,
  startPlannerDrag,
  endPlannerDrag,
} from "../../utils/planner";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// ── 시간 블록 ──

const Block = ({ block, hourHeight, onEdit, onToggle, onResize }) => {
  const { task, start, end, col, cols } = block;
  const [previewEnd, setPreviewEnd] = useState(null);
  const resizeRef = useRef(null);

  const shownEnd = previewEnd ?? end;
  const top = (start / 60) * hourHeight;
  const height = Math.max(18, ((shownEnd - start) / 60) * hourHeight - 2);
  const compact = height < 36;

  const event = isEvent(task);
  const done = task.status === "done";
  const color = itemColor(task);
  const style = event
    ? { backgroundColor: color, color: getReadableTextColor(color) }
    : { backgroundColor: `${color}26`, borderLeft: `3px solid ${color}` };

  // 하단 핸들로 종료 시각 조절 (마우스/터치 공용)
  const handlePointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeRef.current = { y: e.clientY };
  };
  const handlePointerMove = (e) => {
    if (!resizeRef.current) return;
    const delta = ((e.clientY - resizeRef.current.y) / hourHeight) * 60;
    const next = Math.min(
      DAY_MINUTES,
      Math.max(start + SNAP_MINUTES, snap(end + delta)),
    );
    setPreviewEnd(next);
  };
  const handlePointerUp = () => {
    if (!resizeRef.current) return;
    resizeRef.current = null;
    if (previewEnd != null && previewEnd !== end) onResize(task, previewEnd);
    setPreviewEnd(null);
  };

  return (
    <div
      draggable={!done}
      onDragStart={(e) => {
        if (resizeRef.current) {
          e.preventDefault();
          return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const offset = ((e.clientY - rect.top) / hourHeight) * 60;
        startPlannerDrag(e, task, offset);
      }}
      onDragEnd={endPlannerDrag}
      onClick={(e) => {
        e.stopPropagation();
        onEdit(task);
      }}
      className={`absolute rounded-md px-1.5 overflow-hidden cursor-pointer select-none transition-shadow hover:shadow-md ${
        compact ? "py-0.5" : "py-1"
      } ${done ? "opacity-50" : ""} ${event ? "" : "text-text"}`}
      style={{
        top,
        height,
        left: `calc(${(col / cols) * 100}% + 2px)`,
        width: `calc(${100 / cols}% - 4px)`,
        ...style,
      }}
      title={`${task.title} · ${formatTimeRange(task.due_time, task.end_time)}`}
    >
      <div className={`flex gap-1 ${compact ? "items-center" : "items-start"}`}>
        {!event && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(task);
            }}
            className={`shrink-0 w-3.5 h-3.5 mt-px rounded border flex items-center justify-center cursor-pointer ${
              done ? "border-transparent" : "bg-surface"
            }`}
            style={{
              borderColor: done ? undefined : color,
              backgroundColor: done ? color : undefined,
            }}
            aria-label={done ? "완료 취소" : "완료"}
          >
            {done && <Check size={9} className="text-white" strokeWidth={3} />}
          </button>
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <div
            className={`text-[11px] font-semibold truncate ${done ? "line-through" : ""}`}
          >
            {task.recurring_task_id && (
              <Repeat size={9} className="inline -mt-px mr-0.5 opacity-70" />
            )}
            {task.title}
          </div>
          {!compact && (
            <div className="text-[10px] opacity-75 truncate">
              {formatTimeRange(
                fromMinutes(start),
                task.end_time || previewEnd != null ? fromMinutes(shownEnd) : null,
              )}
            </div>
          )}
        </div>
      </div>

      {/* Resize handle */}
      {!done && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize"
          style={{ touchAction: "none" }}
        />
      )}
    </div>
  );
};

// ── 하루 열 ──

const DayColumn = ({
  date,
  items,
  hourHeight,
  isToday,
  highlight,
  now,
  onCreate,
  onDropItem,
  onEdit,
  onToggle,
  onResize,
}) => {
  const ref = useRef(null);
  const [dropPreview, setDropPreview] = useState(null); // { start, duration }

  const minuteAt = (clientY) => {
    const rect = ref.current.getBoundingClientRect();
    return ((clientY - rect.top) / hourHeight) * 60;
  };

  const handleClick = (e) => {
    const start = Math.floor(minuteAt(e.clientY) / 30) * 30;
    onCreate({
      date,
      time: fromMinutes(start),
      endTime: fromMinutes(start + DEFAULT_BLOCK_MINUTES),
    });
  };

  const dropStart = (clientY) => {
    const drag = plannerDrag.current;
    if (!drag) return null;
    return {
      start: clampStart(snap(minuteAt(clientY) - drag.offset), drag.duration),
      duration: drag.duration,
    };
  };

  const blocks = layoutBlocks(items);

  return (
    <div
      ref={ref}
      onClick={handleClick}
      onDragOver={(e) => {
        if (!plannerDrag.current) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDropPreview(dropStart(e.clientY));
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setDropPreview(null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/planner-item");
        const target = dropStart(e.clientY);
        setDropPreview(null);
        endPlannerDrag();
        if (id && target) onDropItem(id, date, target.start);
      }}
      className={`relative flex-1 min-w-0 border-l border-border cursor-pointer ${
        highlight ? "bg-mint-bg" : ""
      }`}
      style={{ height: 24 * hourHeight }}
    >
      {/* Hour lines */}
      {HOURS.map((h) => (
        <div
          key={h}
          className="absolute left-0 right-0 border-t border-border"
          style={{ top: h * hourHeight }}
        >
          <div
            className="absolute left-0 right-0 border-t border-dashed border-border/50"
            style={{ top: hourHeight / 2 }}
          />
        </div>
      ))}

      {/* Drop preview */}
      {dropPreview && (
        <div
          className="absolute left-1 right-1 rounded-md border-2 border-dashed border-mint bg-mint-bg pointer-events-none z-10"
          style={{
            top: (dropPreview.start / 60) * hourHeight,
            height: (dropPreview.duration / 60) * hourHeight,
          }}
        >
          <span className="text-[10px] font-semibold text-mint px-1">
            {fromMinutes(dropPreview.start)}
          </span>
        </div>
      )}

      {/* Blocks */}
      {blocks.map((b) => (
        <Block
          key={b.task.id}
          block={b}
          hourHeight={hourHeight}
          onEdit={onEdit}
          onToggle={onToggle}
          onResize={onResize}
        />
      ))}

      {/* Now line */}
      {isToday && (
        <div
          className="absolute left-0 right-0 z-20 pointer-events-none"
          style={{ top: (now / 60) * hourHeight }}
        >
          <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-coral" />
          <div className="border-t-2 border-coral" />
        </div>
      )}
    </div>
  );
};

// ── 시간축 그리드 ──
// columns: [{ date, items }] — items는 시간이 있는 항목만

const TimeGrid = ({
  columns,
  today,
  hourHeight = 52,
  height = "min(68vh, 720px)",
  onCreate,
  onDropItem,
  onEdit,
  onToggle,
  onResize,
}) => {
  const scrollRef = useRef(null);
  const [now, setNow] = useState(nowMinutes);
  const hasToday = columns.some((c) => c.date === today);

  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // 처음 열 때 현재 시각(오늘) 또는 오전 7시 근처로 스크롤
  const firstDate = columns[0]?.date;
  useEffect(() => {
    if (!scrollRef.current) return;
    const target = hasToday ? nowMinutes() - 90 : 7 * 60;
    scrollRef.current.scrollTop = Math.max(0, (target / 60) * hourHeight);
  }, [firstDate, hasToday, hourHeight]);

  return (
    <div
      ref={scrollRef}
      className="relative overflow-y-auto overscroll-contain"
      style={{ height }}
    >
      <div className="relative flex" style={{ height: 24 * hourHeight }}>
        {/* Hour labels */}
        <div className="relative w-11 shrink-0">
          {HOURS.slice(1).map((h) => (
            <div
              key={h}
              className="absolute right-1.5 text-[10px] text-sub -translate-y-1/2"
              style={{ top: h * hourHeight }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {columns.map((c) => (
          <DayColumn
            key={c.date}
            date={c.date}
            items={c.items}
            hourHeight={hourHeight}
            isToday={c.date === today}
            highlight={c.date === today && columns.length > 1}
            now={now}
            onCreate={onCreate}
            onDropItem={onDropItem}
            onEdit={onEdit}
            onToggle={onToggle}
            onResize={onResize}
          />
        ))}
      </div>
    </div>
  );
};

export default TimeGrid;
