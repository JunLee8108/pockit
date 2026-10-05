// 플래너 시간 계산 유틸
// 시각은 'HH:MM' 또는 'HH:MM:SS' 문자열, 계산은 0시 기준 분 단위

export const DAY_MINUTES = 24 * 60;
export const SNAP_MINUTES = 15;
// 종료 시각 없는 할일의 표시 길이 / 새 시간 블록 기본 길이
export const DEFAULT_TASK_MINUTES = 30;
export const DEFAULT_BLOCK_MINUTES = 60;

export const toMinutes = (time) => {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

export const fromMinutes = (min) => {
  const clamped = Math.max(0, Math.min(DAY_MINUTES - 1, Math.round(min)));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
};

export const snap = (min) => Math.round(min / SNAP_MINUTES) * SNAP_MINUTES;

export const formatTimeRange = (start, end) => {
  if (!start) return "";
  return end ? `${start.slice(0, 5)} – ${end.slice(0, 5)}` : start.slice(0, 5);
};

export const isEvent = (t) => t.kind === "event";

// 블록의 시작/끝(분). 종료 시각이 없으면 기본 길이
export const blockRange = (t) => {
  const start = toMinutes(t.due_time);
  const end = toMinutes(t.end_time);
  const fallback = Math.min(DAY_MINUTES, start + DEFAULT_TASK_MINUTES);
  return { start, end: end && end > start ? end : fallback };
};

// 길이를 유지한 채 하루 안으로 시작 시각 보정
export const clampStart = (start, duration) =>
  Math.max(0, Math.min(DAY_MINUTES - duration, start));

// 겹치는 블록을 나란히 배치: 각 항목에 col(열 번호), cols(그룹 열 수)
export const layoutBlocks = (items) => {
  const sorted = items
    .map((t) => ({ task: t, ...blockRange(t) }))
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const result = [];
  let group = [];
  let groupEnd = -1;
  let columns = [];

  const flush = () => {
    const cols = columns.length;
    for (const b of group) result.push({ ...b, cols });
    group = [];
    columns = [];
  };

  for (const b of sorted) {
    if (b.start >= groupEnd) {
      flush();
      groupEnd = -1;
    }
    let col = columns.findIndex((end) => end <= b.start);
    if (col === -1) {
      col = columns.length;
      columns.push(b.end);
    } else {
      columns[col] = b.end;
    }
    group.push({ ...b, col });
    groupEnd = Math.max(groupEnd, b.end);
  }
  flush();
  return result;
};

export const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

// ── 표시 색상 ──

const PRIORITY_COLOR = { low: "#94a3b8", normal: "#7dd3fc", high: "#ef4444" };
const EVENT_COLOR = "#8b9cf7";

export const itemColor = (t) =>
  t.category?.color ||
  (isEvent(t) ? EVENT_COLOR : PRIORITY_COLOR[t.priority] || PRIORITY_COLOR.normal);

// ── 시간축으로 옮기기 ──

// 블록을 date의 start(분)로 옮길 때의 변경값
// - 시간 있는 항목: 길이 유지 (종료 시각 없는 할일은 그대로 없음)
// - 시간 없는 항목: 기본 길이의 시간 블록으로 배정
export const moveUpdates = (task, date, start) => {
  if (task.due_time) {
    const range = blockRange(task);
    const duration = range.end - range.start;
    const s = clampStart(start, duration);
    return {
      due_date: date,
      due_time: fromMinutes(s),
      end_time: task.end_time ? fromMinutes(s + duration) : null,
    };
  }
  const s = clampStart(start, DEFAULT_BLOCK_MINUTES);
  return {
    due_date: date,
    due_time: fromMinutes(s),
    end_time: fromMinutes(s + DEFAULT_BLOCK_MINUTES),
  };
};

export const isSameSlot = (task, updates) =>
  task.due_date === updates.due_date &&
  (task.due_time || "").slice(0, 5) === (updates.due_time || "") &&
  (task.end_time || "").slice(0, 5) === (updates.end_time || "");

// ── 드래그 상태 ──
// dragover 중에는 dataTransfer 내용을 읽을 수 없어 모듈 상태로 공유
// { id, offset: 잡은 지점의 블록 시작 기준 분, duration }
export const plannerDrag = { current: null };

export const startPlannerDrag = (e, task, offset = 0) => {
  const { start, end } = task.due_time
    ? blockRange(task)
    : { start: 0, end: DEFAULT_BLOCK_MINUTES };
  plannerDrag.current = { id: task.id, offset, duration: end - start };
  e.dataTransfer.setData("text/planner-item", task.id);
  e.dataTransfer.effectAllowed = "move";
};

export const endPlannerDrag = () => {
  plannerDrag.current = null;
};

// ── 날짜 ──

// 캘린더 요일 순서: 일요일 시작
export const WEEKDAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];

// 요일 열 글자색 (0=일, 6=토)
export const weekdayTextClass = (i) =>
  i === 0 ? "text-coral" : i === 6 ? "text-sky" : "text-sub";

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const parse = (date) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const dayOfWeek = (date) => WEEKDAY_HEADERS[parse(date).getDay()];

export const formatDayLabel = (date) => {
  const [, m, d] = date.split("-").map(Number);
  return `${m}월 ${d}일 ${dayOfWeek(date)}요일`;
};

// 일요일 시작 주의 첫날
export const weekStartOf = (date) => {
  const d = parse(date);
  d.setDate(d.getDate() - d.getDay());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
