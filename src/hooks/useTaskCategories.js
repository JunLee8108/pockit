import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../lib/supabase";
import { fromSupabase, getAuthUser } from "../lib/supabaseQuery";
import { queryKeys } from "../lib/queryKeys";
import useToastStore from "../store/useToastStore";

const toast = () => useToastStore.getState();

const DEFAULT_TASK_CATEGORIES = [
  { name: "업무", icon: "Briefcase", color: "#7dd3fc", sort_order: 0 },
  { name: "개인", icon: "Heart", color: "#f472b6", sort_order: 1 },
  { name: "공부", icon: "BookOpen", color: "#a78bfa", sort_order: 2 },
  { name: "건강", icon: "HeartPulse", color: "#6DD4B4", sort_order: 3 },
  { name: "쇼핑", icon: "ShoppingCart", color: "#fcd34d", sort_order: 4 },
];

export const useTaskCategories = () => {
  return useQuery({
    queryKey: queryKeys.taskCategories.all,
    queryFn: () =>
      fromSupabase(
        supabase.from("task_categories").select("*").order("sort_order"),
      ),
  });
};

export const useSeedDefaultTaskCategories = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const user = await getAuthUser();

      const { count } = await supabase
        .from("task_categories")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (count > 0) return [];

      const rows = DEFAULT_TASK_CATEGORIES.map((c) => ({
        ...c,
        user_id: user.id,
        is_default: true,
      }));
      return fromSupabase(
        supabase.from("task_categories").insert(rows).select(),
      );
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.taskCategories.all }),
  });
};

export const useAddTaskCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const user = await getAuthUser();
      return fromSupabase(
        supabase
          .from("task_categories")
          .insert({ ...payload, user_id: user.id })
          .select()
          .single(),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.taskCategories.all });
      toast().success("카테고리가 추가되었습니다");
    },
    onError: () => toast().error("카테고리 추가에 실패했습니다"),
  });
};

export const useUpdateTaskCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }) =>
      fromSupabase(
        supabase
          .from("task_categories")
          .update(updates)
          .eq("id", id)
          .select()
          .single(),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.taskCategories.all });
      toast().success("카테고리가 수정되었습니다");
    },
    onError: () => toast().error("카테고리 수정에 실패했습니다"),
  });
};

export const useDeleteTaskCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from("task_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.taskCategories.all });
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast().success("카테고리가 삭제되었습니다");
    },
    onError: () => toast().error("카테고리 삭제에 실패했습니다"),
  });
};
