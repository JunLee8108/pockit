import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import supabase from "../lib/supabase";
import { fromSupabase, getAuthUser } from "../lib/supabaseQuery";
import { queryKeys } from "../lib/queryKeys";
import useToastStore from "../store/useToastStore";

const TASK_SELECT = "*, category:task_categories(*)";

const toast = () => useToastStore.getState();

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

  const filtered = useMemo(() => {
    if (!query.data) return [];
    const today = todayStr();
    let result = query.data;

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
  }, [query.data, status, scope, categoryId, search, priority]);

  return {
    ...query,
    data: filtered,
    rawData: query.data || [],
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast().success("할일이 추가되었습니다");
    },
    onError: () => toast().error("할일 추가에 실패했습니다"),
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }) =>
      fromSupabase(
        supabase
          .from("tasks")
          .update(updates)
          .eq("id", id)
          .select(TASK_SELECT)
          .single(),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast().success("할일이 수정되었습니다");
    },
    onError: () => toast().error("할일 수정에 실패했습니다"),
  });
};

export const useToggleTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task) => {
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

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast().success("할일이 삭제되었습니다");
    },
    onError: () => toast().error("할일 삭제에 실패했습니다"),
  });
};
