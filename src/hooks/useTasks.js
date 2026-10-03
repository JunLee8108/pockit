import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import supabase from "../lib/supabase";
import { fromSupabase, getAuthUser } from "../lib/supabaseQuery";
import { queryKeys } from "../lib/queryKeys";
import useToastStore from "../store/useToastStore";
import {
  expandForList,
  addDays,
  diffDays,
  withUntil,
  withCount,
  ruleCount,
  countBefore,
  sameRule,
} from "../utils/recurrence";

const TASK_SELECT = "*, category:task_categories(*)";

const toast = () => useToastStore.getState();

const noun = (t) => (t?.kind === "event" ? "일정" : "할일");

// 모든 할일을 한 번에 가져와서 클라이언트에서 필터링
// (할일 수는 보통 수백 단위, 거래내역처럼 많지 않음)
const useAllTasks = () => {
  return useQuery({
    queryKey: queryKeys.tasks.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(TASK_SELECT)
        .order("status")
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

const PRIORITY_RANK = { high: 3, normal: 2, low: 1 };

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const useTasks = (filters = {}) => {
  const { status, scope, categoryId, search, priority } = filters;
  const query = useAllTasks();

  // 할일함 목록: 일정 제외, 반복 원본은 시리즈별 회차 1개로 펼침
  // (놓친 회차 우선, 없으면 다음 회차)
  const items = useMemo(
    () =>
      query.data
        ? expandForList(
            query.data.filter((t) => t.kind !== "event"),
            todayStr(),
          )
        : [],
    [query.data],
  );

  const filtered = useMemo(() => {
    const today = todayStr();
    let result = items;

    if (status && status !== "all") {
      result = result.filter((t) => t.status === status);
    }

    if (scope === "today") {
      result = result.filter(
        (t) => t.status === "todo" && t.due_date && t.due_date <= today,
      );
    } else if (scope === "upcoming") {
      result = result.filter(
        (t) => t.status === "todo" && t.due_date && t.due_date > today,
      );
    } else if (scope === "no-date") {
      result = result.filter((t) => t.status === "todo" && !t.due_date);
    } else if (scope === "overdue") {
      result = result.filter(
        (t) => t.status === "todo" && t.due_date && t.due_date < today,
      );
    } else if (scope === "done") {
      result = result.filter((t) => t.status === "done");
    }

    if (categoryId) {
      result = result.filter((t) => t.category_id === categoryId);
    }

    if (priority && priority !== "all") {
      result = result.filter((t) => t.priority === priority);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.category?.name?.toLowerCase().includes(q),
      );
    }

    // 정렬: 우선순위 → 기한 → 생성일
    return [...result].sort((a, b) => {
      if (a.status !== b.status) return a.status === "todo" ? -1 : 1;
      const pa = PRIORITY_RANK[a.priority] || 2;
      const pb = PRIORITY_RANK[b.priority] || 2;
      if (pa !== pb) return pb - pa;
      if (a.due_date && b.due_date && a.due_date !== b.due_date) {
        return a.due_date < b.due_date ? -1 : 1;
      }
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;
      return 0;
    });
  }, [items, status, scope, categoryId, search, priority]);

  return {
    ...query,
    data: filtered,
    rawData: query.data || [],
    items,
  };
};

export const useAddTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const user = await getAuthUser();
      return fromSupabase(
        supabase
          .from("tasks")
          .insert({ ...payload, user_id: user.id })
          .select(TASK_SELECT)
          .single(),
      );
    },
    onSuccess: (_data, payload) => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast().success(`${noun(payload)}이 추가되었습니다`);
    },
    onError: (_err, payload) => toast().error(`${noun(payload)} 추가에 실패했습니다`),
  });
};

// ── 반복 할일 헬퍼 ──
// task: 목록/캘린더에 표시되는 항목 (일반 할일, 가상 회차, 예외 행)
// task.series: 회차가 속한 원본 행 / task.isVirtual: 아직 DB에 없는 회차

const CONTENT_FIELDS = [
  "kind",
  "title",
  "description",
  "due_time",
  "end_time",
  "priority",
  "category_id",
];

const pick = (obj, keys) =>
  Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));

const updateRow = (id, updates) =>
  fromSupabase(
    supabase.from("tasks").update(updates).eq("id", id).select(TASK_SELECT).single(),
  );

const insertRow = async (row) => {
  const user = await getAuthUser();
  return fromSupabase(
    supabase
      .from("tasks")
      .insert({ ...row, user_id: user.id })
      .select(TASK_SELECT)
      .single(),
  );
};

const run = async (query) => {
  const { error } = await query;
  if (error) throw error;
};

// 가상 회차를 예외 행으로 저장
const insertException = (series, date, overrides) =>
  insertRow({
    ...pick(series, CONTENT_FIELDS),
    due_date: date,
    ...overrides,
    recurring_task_id: series.id,
    original_date: date,
  });

// "모든 할일" — 원본 수정 + 예외 행에 내용 반영
const saveAll = async (task, series, fields, rule) => {
  const content = pick(fields, CONTENT_FIELDS);

  if (!rule) {
    // 반복 해제: 원본을 단일 할일로, 미완료 예외는 삭제, 완료 기록은 분리 보존
    await run(
      supabase
        .from("tasks")
        .delete()
        .eq("recurring_task_id", series.id)
        .eq("status", "todo"),
    );
    await run(
      supabase
        .from("tasks")
        .update({ recurring_task_id: null, original_date: null })
        .eq("recurring_task_id", series.id),
    );
    return updateRow(series.id, {
      ...content,
      due_date: fields.due_date,
      recurrence_rule: null,
      recurrence_exdates: [],
      status: "todo",
      completed_at: null,
    });
  }

  // 회차 날짜를 옮긴 만큼 시리즈 시작일도 이동
  const delta = fields.due_date ? diffDays(fields.due_date, task.original_date) : 0;
  const updated = await updateRow(series.id, {
    ...content,
    due_date: addDays(series.due_date, delta),
    recurrence_rule: rule,
  });
  if (Object.keys(content).length) {
    await run(
      supabase.from("tasks").update(content).eq("recurring_task_id", series.id),
    );
  }
  return updated;
};

// "이 할일 및 이후 할일" — 시리즈 분할
const saveFollowing = async (task, series, fields, rule) => {
  const split = task.original_date;
  const oldRule = series.recurrence_rule;
  const content = pick(fields, CONTENT_FIELDS);

  // 1. 기존 시리즈는 분할일 전날까지
  await updateRow(series.id, {
    recurrence_rule: withUntil(oldRule, addDays(split, -1)),
  });

  // 2. 이후 회차의 미완료 예외는 새 설정으로 대체
  await run(
    supabase
      .from("tasks")
      .delete()
      .eq("recurring_task_id", series.id)
      .gte("original_date", split)
      .eq("status", "todo"),
  );

  if (!rule) {
    // 반복 해제: 이 회차만 단일 할일로 남김, 이후 완료 기록은 분리 보존
    await run(
      supabase
        .from("tasks")
        .update({ recurring_task_id: null, original_date: null })
        .eq("recurring_task_id", series.id)
        .gte("original_date", split),
    );
    return insertRow({ ...pick(series, CONTENT_FIELDS), ...fields });
  }

  // 3. 새 시리즈 — 횟수 제한 규칙은 남은 횟수만
  let newRule = rule;
  const total = ruleCount(oldRule);
  if (total != null && sameRule(rule, oldRule)) {
    const used = countBefore(oldRule, series.due_date, split);
    newRule = withCount(rule, Math.max(1, total - used));
  }
  const master = await insertRow({
    ...pick(series, CONTENT_FIELDS),
    ...fields,
    recurrence_rule: newRule,
  });

  // 4. 이후 회차의 완료 기록은 새 시리즈로 이동
  await run(
    supabase
      .from("tasks")
      .update({ ...content, recurring_task_id: master.id })
      .eq("recurring_task_id", series.id)
      .gte("original_date", split),
  );
  return master;
};

// scope: "this" | "following" | "all" (반복 회차일 때만 의미 있음)
const saveTask = async ({ task, updates, scope = "this" }) => {
  const series = task.series;
  if (!series) {
    // 일반 할일 — 반복 규칙을 붙이면 원본(시리즈)이 됨
    const extra = updates.recurrence_rule
      ? { status: "todo", completed_at: null }
      : {};
    return updateRow(task.id, { ...updates, ...extra });
  }

  const { recurrence_rule: rule = series.recurrence_rule, ...fields } = updates;

  if (scope === "this") {
    return task.isVirtual
      ? insertException(series, task.original_date, fields)
      : updateRow(task.id, fields);
  }
  // 첫 회차부터 바꾸는 "이후 할일" = "모든 할일"
  if (scope === "all" || task.original_date <= series.due_date) {
    return saveAll(task, series, fields, rule);
  }
  return saveFollowing(task, series, fields, rule);
};

const SLOT_FIELDS = ["due_date", "due_time", "end_time"];
const isSlotOnly = (updates) =>
  Object.keys(updates).every((k) => SLOT_FIELDS.includes(k));

export const useSaveTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveTask,
    // 날짜/시간만 바꾸는 이동·크기 조절은 즉시 반영 (드래그 후 깜빡임 방지)
    onMutate: async ({ task, updates, scope = "this" }) => {
      if (!isSlotOnly(updates) || scope !== "this") return;
      await qc.cancelQueries({ queryKey: queryKeys.tasks.all });
      const prev = qc.getQueryData(queryKeys.tasks.all);
      if (task.isVirtual) {
        // eslint-disable-next-line no-unused-vars
        const { series, isVirtual, ...row } = task;
        qc.setQueryData(queryKeys.tasks.all, (old) => [
          ...(old || []),
          { ...row, ...updates, id: `temp-${task.id}` },
        ]);
      } else {
        qc.setQueryData(queryKeys.tasks.all, (old) =>
          old?.map((t) => (t.id === task.id ? { ...t, ...updates } : t)),
        );
      }
      return { prev };
    },
    onSuccess: (_data, { task, updates }) => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      // 드래그 이동/크기 조절은 화면에 바로 보이므로 알림 생략
      if (!isSlotOnly(updates)) toast().success(`${noun(task)}이 수정되었습니다`);
    },
    onError: (_err, { task }, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.tasks.all, ctx.prev);
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast().error(`${noun(task)} 수정에 실패했습니다`);
    },
  });
};

export const useToggleTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task) => {
      // 가상 회차 완료 → 완료 상태의 예외 행 생성
      if (task.isVirtual) {
        return insertException(task.series, task.original_date, {
          status: "done",
          completed_at: new Date().toISOString(),
        });
      }
      const nextStatus = task.status === "done" ? "todo" : "done";
      const updates = {
        status: nextStatus,
        completed_at: nextStatus === "done" ? new Date().toISOString() : null,
      };
      return fromSupabase(
        supabase
          .from("tasks")
          .update(updates)
          .eq("id", task.id)
          .select(TASK_SELECT)
          .single(),
      );
    },
    onMutate: async (task) => {
      await qc.cancelQueries({ queryKey: queryKeys.tasks.all });
      const prev = qc.getQueryData(queryKeys.tasks.all);
      const nextStatus = task.status === "done" ? "todo" : "done";
      if (task.isVirtual) {
        // eslint-disable-next-line no-unused-vars
        const { series, isVirtual, ...row } = task;
        qc.setQueryData(queryKeys.tasks.all, (old) => [
          ...(old || []),
          {
            ...row,
            id: `temp-${task.id}`,
            status: "done",
            completed_at: new Date().toISOString(),
          },
        ]);
        return { prev };
      }
      qc.setQueryData(queryKeys.tasks.all, (old) =>
        old?.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: nextStatus,
                completed_at:
                  nextStatus === "done" ? new Date().toISOString() : null,
              }
            : t,
        ),
      );
      return { prev };
    },
    onError: (_err, _task, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.tasks.all, ctx.prev);
      toast().error("상태 변경에 실패했습니다");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};

// scope: "this" | "following" | "all" (반복 회차일 때만 의미 있음)
const deleteTask = async ({ task, scope = "this" }) => {
  const series = task.series;
  if (!series) return run(supabase.from("tasks").delete().eq("id", task.id));

  const date = task.original_date;
  if (scope === "this") {
    if (!task.isVirtual) {
      await run(supabase.from("tasks").delete().eq("id", task.id));
    }
    const exdates = new Set(series.recurrence_exdates || []);
    exdates.add(date);
    return run(
      supabase
        .from("tasks")
        .update({ recurrence_exdates: [...exdates].sort() })
        .eq("id", series.id),
    );
  }
  if (scope === "all" || date <= series.due_date) {
    // 예외 행은 on delete cascade로 함께 삭제
    return run(supabase.from("tasks").delete().eq("id", series.id));
  }
  await run(
    supabase
      .from("tasks")
      .delete()
      .eq("recurring_task_id", series.id)
      .gte("original_date", date),
  );
  return run(
    supabase
      .from("tasks")
      .update({ recurrence_rule: withUntil(series.recurrence_rule, addDays(date, -1)) })
      .eq("id", series.id),
  );
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: (_data, { task }) => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast().success(`${noun(task)}이 삭제되었습니다`);
    },
    onError: (_err, { task }) => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast().error(`${noun(task)} 삭제에 실패했습니다`);
    },
  });
};
