import { RRule } from "rrule";

// 반복 할일 — 구글 캘린더 방식
// - 원본(master) 행: recurrence_rule(RFC 5545 RRULE, DTSTART 제외) + due_date(시작일)
// - 회차: 조회 시 규칙으로 계산되는 가상 회차
// - 예외 행: recurring_task_id + original_date — 완료/수정/이동된 회차
// - recurrence_exdates: 삭제된 회차 날짜
//
// 날짜는 모두 'YYYY-MM-DD' 문자열. rrule 계산은 UTC 자정 Date로 처리해
// 타임존 영향 없이 날짜만 다룬다.

export const WEEKDAY_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
export const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

// 반복 회차 수정/삭제 범위 (구글 캘린더와 동일)
export const scopeChoices = (kind = "task") => {
  const noun = kind === "event" ? "일정" : "할일";
  return [
    { value: "this", label: `이 ${noun}` },
    { value: "following", label: `이 ${noun} 및 이후 ${noun}` },
    { value: "all", label: `모든 ${noun}` },
  ];
};

// ── 날짜 유틸 ──

const toUTC = (str) => {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const fromUTC = (date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

export const addDays = (str, n) => {
  const d = toUTC(str);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUTC(d);
};

export const diffDays = (a, b) => Math.round((toUTC(a) - toUTC(b)) / 86400000);

const weekdayIndex = (str) => (toUTC(str).getUTCDay() + 6) % 7; // Mon=0..Sun=6

const nthOfMonth = (str) => Math.ceil(Number(str.slice(8, 10)) / 7);

const isLastWeekOfMonth = (str) => {
  const d = toUTC(str);
  const next = new Date(d);
  next.setUTCDate(d.getUTCDate() + 7);
  return next.getUTCMonth() !== d.getUTCMonth();
};

// ── 규칙 파싱/생성 ──

const FREQS = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

// 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;UNTIL=20261231' → 구조체
export const parseRule = (rule) => {
  const parts = Object.fromEntries(
    (rule || "")
      .split(";")
      .filter(Boolean)
      .map((p) => p.split("=")),
  );
  const until = parts.UNTIL
    ? `${parts.UNTIL.slice(0, 4)}-${parts.UNTIL.slice(4, 6)}-${parts.UNTIL.slice(6, 8)}`
    : "";
  const byday = parts.BYDAY ? parts.BYDAY.split(",") : [];
  // 월간 N번째 요일: BYDAY=2TU / -1FR
  const nth = parts.FREQ === "MONTHLY" && /^-?\d/.test(byday[0] || "");
  return {
    freq: FREQS.includes(parts.FREQ) ? parts.FREQ : "DAILY",
    interval: Number(parts.INTERVAL) || 1,
    byday: nth ? [] : byday,
    monthMode: nth ? (byday[0].startsWith("-") ? "last" : "nth") : "date",
    nthDay: nth ? byday[0] : "",
    endType: parts.UNTIL ? "until" : parts.COUNT ? "count" : "never",
    until,
    count: Number(parts.COUNT) || 10,
  };
};

// 구조체 → 규칙 문자열
// anchorDate: 요일/N번째 요일 계산 기준일 (없으면 state.byday/nthDay 그대로 사용)
export const buildRule = (state, anchorDate = null) => {
  const parts = [`FREQ=${state.freq}`];
  if (state.interval > 1) parts.push(`INTERVAL=${state.interval}`);
  if (state.freq === "WEEKLY") {
    const days = WEEKDAY_CODES.filter((c) => state.byday.includes(c));
    const fallback = anchorDate ? [WEEKDAY_CODES[weekdayIndex(anchorDate)]] : [];
    const list = days.length ? days : fallback;
    if (list.length) parts.push(`BYDAY=${list.join(",")}`);
  }
  if (state.freq === "MONTHLY" && state.monthMode !== "date") {
    if (anchorDate) {
      const code = WEEKDAY_CODES[weekdayIndex(anchorDate)];
      const n = state.monthMode === "last" ? -1 : nthOfMonth(anchorDate);
      parts.push(`BYDAY=${n}${code}`);
    } else if (state.nthDay) {
      parts.push(`BYDAY=${state.nthDay}`);
    }
  }
  if (state.endType === "until" && state.until) {
    parts.push(`UNTIL=${state.until.replaceAll("-", "")}`);
  } else if (state.endType === "count" && state.count > 0) {
    parts.push(`COUNT=${state.count}`);
  }
  return parts.join(";");
};

// 비교용 정규화 (파트 순서/표기 차이 제거)
export const canonicalRule = (rule) => (rule ? buildRule(parseRule(rule)) : null);

export const sameRule = (a, b) => canonicalRule(a) === canonicalRule(b);

// 종료 조건 교체 — 시리즈 분할 시 사용
export const withUntil = (rule, untilDate) =>
  [
    ...rule.split(";").filter((p) => !/^(UNTIL|COUNT)=/.test(p)),
    `UNTIL=${untilDate.replaceAll("-", "")}`,
  ].join(";");

export const withCount = (rule, count) =>
  [
    ...rule.split(";").filter((p) => !/^(UNTIL|COUNT)=/.test(p)),
    `COUNT=${count}`,
  ].join(";");

export const ruleCount = (rule) => {
  const m = rule?.match(/COUNT=(\d+)/);
  return m ? Number(m[1]) : null;
};

// ── 프리셋 (구글 캘린더 반복 드롭다운) ──

export const presetOptions = (date) => {
  if (!date) return [{ key: "none", label: "반복 안 함" }];
  const wd = WEEKDAY_LABELS[weekdayIndex(date)];
  const [, m, d] = date.split("-").map(Number);
  const options = [
    { key: "none", label: "반복 안 함" },
    { key: "daily", label: "매일" },
    { key: "weekly", label: `매주 ${wd}요일` },
    { key: "monthly-date", label: `매월 ${d}일` },
    { key: "monthly-nth", label: `매월 ${nthOfMonth(date)}번째 ${wd}요일` },
  ];
  if (isLastWeekOfMonth(date)) {
    options.push({ key: "monthly-last", label: `매월 마지막 ${wd}요일` });
  }
  options.push(
    { key: "yearly", label: `매년 ${m}월 ${d}일` },
    { key: "weekdays", label: "주중 매일 (월-금)" },
    { key: "custom", label: "맞춤 설정..." },
  );
  return options;
};

export const buildPresetRule = (key, date) => {
  if (!date) return null;
  const wd = WEEKDAY_CODES[weekdayIndex(date)];
  switch (key) {
    case "daily":
      return "FREQ=DAILY";
    case "weekly":
      return `FREQ=WEEKLY;BYDAY=${wd}`;
    case "monthly-date":
      return "FREQ=MONTHLY";
    case "monthly-nth":
      return `FREQ=MONTHLY;BYDAY=${nthOfMonth(date)}${wd}`;
    case "monthly-last":
      return `FREQ=MONTHLY;BYDAY=-1${wd}`;
    case "yearly":
      return "FREQ=YEARLY";
    case "weekdays":
      return "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR";
    default:
      return null;
  }
};

export const detectPreset = (rule, date) => {
  if (!rule) return "none";
  const match = presetOptions(date).find(
    (o) =>
      o.key !== "none" &&
      o.key !== "custom" &&
      sameRule(buildPresetRule(o.key, date), rule),
  );
  return match ? match.key : "custom";
};

// 맞춤 설정 — 월간 반복 방식 선택지
export const monthlyOptions = (date) => {
  if (!date) return [{ value: "date", label: "같은 날짜" }];
  const wd = WEEKDAY_LABELS[weekdayIndex(date)];
  const options = [
    { value: "date", label: `매월 ${Number(date.slice(8, 10))}일` },
    { value: "nth", label: `매월 ${nthOfMonth(date)}번째 ${wd}요일` },
  ];
  if (isLastWeekOfMonth(date)) {
    options.push({ value: "last", label: `매월 마지막 ${wd}요일` });
  }
  return options;
};

// 맞춤 설정 초기값 — 현재 선택한 프리셋 기준
export const customFromPreset = (key, date) =>
  parseRule(
    buildPresetRule(key, date) ||
      buildPresetRule("weekly", date) ||
      "FREQ=WEEKLY",
  );

// ── 사람이 읽는 요약 ──

const UNIT = { DAILY: "일", WEEKLY: "주", MONTHLY: "개월", YEARLY: "년" };
const EVERY = { DAILY: "매일", WEEKLY: "매주", MONTHLY: "매월", YEARLY: "매년" };

export const describeRule = (rule, date) => {
  if (!rule) return "";
  const s = parseRule(rule);
  let text = s.interval > 1 ? `${s.interval}${UNIT[s.freq]}마다` : EVERY[s.freq];

  if (s.freq === "WEEKLY") {
    const days = s.byday.map((c) => WEEKDAY_LABELS[WEEKDAY_CODES.indexOf(c)]);
    if (days.join() === "월,화,수,목,금" && s.interval === 1) text = "주중 매일";
    else if (days.length) text += ` ${days.join("·")}`;
  } else if (s.freq === "MONTHLY" && date) {
    const m = rule.match(/BYDAY=(-?\d)([A-Z]{2})/);
    if (m) {
      const wd = WEEKDAY_LABELS[WEEKDAY_CODES.indexOf(m[2])];
      text += m[1] === "-1" ? ` 마지막 ${wd}요일` : ` ${m[1]}번째 ${wd}요일`;
    } else {
      text += ` ${Number(date.slice(8, 10))}일`;
    }
  } else if (s.freq === "YEARLY" && date) {
    text += ` ${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`;
  }

  if (s.endType === "until") {
    const [, m, d] = s.until.split("-").map(Number);
    text += `, ${m}월 ${d}일까지`;
  } else if (s.endType === "count") {
    text += `, ${s.count}회`;
  }
  return text;
};

// ── 회차 계산 ──

const rruleCache = new Map();

const getRRule = (rule, start) => {
  const key = `${rule}|${start}`;
  let r = rruleCache.get(key);
  if (!r) {
    r = new RRule({ ...RRule.parseString(rule), dtstart: toUTC(start) });
    rruleCache.set(key, r);
  }
  return r;
};

// 시리즈 회차 날짜 (from ~ to, 양끝 포함)
export const occurrenceDates = (rule, start, from, to) => {
  if (!rule || !start || from > to) return [];
  return getRRule(rule, start)
    .between(toUTC(from), toUTC(to), true)
    .map(fromUTC);
};

// 분할 시점 이전 회차 수 (COUNT 규칙 분할용)
export const countBefore = (rule, start, date) =>
  date <= start ? 0 : occurrenceDates(rule, start, start, addDays(date, -1)).length;

export const isMaster = (t) => !!t.recurrence_rule;

// 원본 시리즈 + 예외 행 인덱스
const indexSeries = (rows) => {
  const masters = new Map();
  const exceptions = new Map(); // masterId → Map(original_date → row)
  for (const t of rows) {
    if (isMaster(t)) masters.set(t.id, t);
  }
  for (const t of rows) {
    if (!t.recurring_task_id) continue;
    if (!exceptions.has(t.recurring_task_id)) {
      exceptions.set(t.recurring_task_id, new Map());
    }
    exceptions.get(t.recurring_task_id).set(t.original_date, t);
  }
  return { masters, exceptions };
};

const CONTENT_FIELDS = [
  "kind",
  "title",
  "description",
  "due_time",
  "end_time",
  "priority",
  "category_id",
  "category",
  "user_id",
];

const virtualOccurrence = (master, date) => ({
  ...Object.fromEntries(CONTENT_FIELDS.map((f) => [f, master[f]])),
  id: `${master.id}_${date}`,
  due_date: date,
  status: "todo",
  completed_at: null,
  recurrence_rule: null,
  recurring_task_id: master.id,
  original_date: date,
  isVirtual: true,
  series: master,
});

const withSeries = (row, masters) =>
  row.recurring_task_id && masters.has(row.recurring_task_id)
    ? { ...row, series: masters.get(row.recurring_task_id) }
    : row;

// 가상 회차 중 아직 처리되지 않은(예외/삭제되지 않은) 날짜만
const freeDates = (master, exMap, from, to) => {
  const exdates = new Set(master.recurrence_exdates || []);
  return occurrenceDates(master.recurrence_rule, master.due_date, from, to).filter(
    (d) => !exdates.has(d) && !exMap?.has(d),
  );
};

// 캘린더용: 기간 내 모든 회차 펼치기 (원본 행은 제외)
export const expandForRange = (rows, from, to) => {
  const { masters, exceptions } = indexSeries(rows);
  const result = [];
  for (const t of rows) {
    if (isMaster(t)) continue;
    result.push(withSeries(t, masters));
  }
  for (const master of masters.values()) {
    for (const d of freeDates(master, exceptions.get(master.id), from, to)) {
      result.push(virtualOccurrence(master, d));
    }
  }
  return result;
};

const NEXT_WINDOWS = [62, 400, 1830];

// 목록용: 시리즈별 미완료 회차 1개
// - 놓친 회차가 있으면 가장 최근 것 1개 (지연)
// - 없으면 오늘 이후 가장 가까운 회차
export const expandForList = (rows, today) => {
  const { masters, exceptions } = indexSeries(rows);
  const result = [];
  const pendingBySeries = new Map();

  for (const t of rows) {
    if (isMaster(t)) continue;
    const row = withSeries(t, masters);
    if (row.recurring_task_id && masters.has(row.recurring_task_id) && row.status === "todo") {
      if (!pendingBySeries.has(row.recurring_task_id)) {
        pendingBySeries.set(row.recurring_task_id, []);
      }
      pendingBySeries.get(row.recurring_task_id).push(row);
    } else {
      result.push(row);
    }
  }

  for (const master of masters.values()) {
    const exMap = exceptions.get(master.id);
    const pendingRows = pendingBySeries.get(master.id) || [];
    const yesterday = addDays(today, -1);

    // 놓친 회차: 가상 회차 + 기한이 지난 미완료 예외 행
    const missedVirtual = freeDates(master, exMap, master.due_date, yesterday);
    const missed = [
      ...missedVirtual.map((d) => ({ date: d, make: () => virtualOccurrence(master, d) })),
      ...pendingRows
        .filter((r) => r.due_date && r.due_date < today)
        .map((r) => ({ date: r.due_date, make: () => r })),
    ];
    if (missed.length) {
      missed.sort((a, b) => (a.date < b.date ? 1 : -1));
      result.push(missed[0].make());
      continue;
    }

    // 다음 회차: 가상 회차 vs 오늘 이후 미완료 예외 행 중 가장 이른 것
    let nextVirtual = null;
    for (const span of NEXT_WINDOWS) {
      const from = today < master.due_date ? master.due_date : today;
      const dates = freeDates(master, exMap, from, addDays(from, span));
      if (dates.length) {
        nextVirtual = dates[0];
        break;
      }
    }
    const upcoming = pendingRows
      .filter((r) => !r.due_date || r.due_date >= today)
      .sort((a, b) => ((a.due_date || "9999") < (b.due_date || "9999") ? -1 : 1));
    const nextRow = upcoming[0];

    if (nextRow && (!nextVirtual || (nextRow.due_date || "9999") <= nextVirtual)) {
      result.push(nextRow);
    } else if (nextVirtual) {
      result.push(virtualOccurrence(master, nextVirtual));
    }
  }

  return result;
};

const PRIORITY_RANK = { high: 3, normal: 2, low: 1 };

// 캘린더용: 기간 내 회차를 날짜별로 묶기 (미완료 → 종일/시간 미정 → 시작 시각 → 우선순위)
export const groupByDate = (rows, from, to) => {
  const map = new Map();
  for (const t of expandForRange(rows, from, to)) {
    if (!t.due_date || t.due_date < from || t.due_date > to) continue;
    if (!map.has(t.due_date)) map.set(t.due_date, []);
    map.get(t.due_date).push(t);
  }
  for (const list of map.values()) {
    list.sort((a, b) => {
      if (a.status !== b.status) return a.status === "todo" ? -1 : 1;
      const ta = a.due_time || "";
      const tb = b.due_time || "";
      if (ta !== tb) return ta < tb ? -1 : 1;
      return (PRIORITY_RANK[b.priority] || 2) - (PRIORITY_RANK[a.priority] || 2);
    });
  }
  return map;
};
