import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import supabase from "../lib/supabase";
import { fromSupabase, getAuthUser } from "../lib/supabaseQuery";
import { queryKeys } from "../lib/queryKeys";
import useToastStore from "../store/useToastStore";

const toast = () => useToastStore.getState();

const DEFAULT_CATEGORIES = [
  {
    name: "급여",
    icon: "Banknote",
    color: "#6DD4B4",
    type: "income",
    sort_order: 0,
  },
  {
    name: "부수입",
    icon: "Briefcase",
    color: "#7dd3fc",
    type: "income",
    sort_order: 1,
  },
  {
    name: "투자수익",
    icon: "TrendingUp",
    color: "#a78bfa",
    type: "income",
    sort_order: 2,
  },
  {
    name: "기타수입",
    icon: "Inbox",
    color: "#94a3b8",
    type: "income",
    sort_order: 3,
  },
  {
    name: "식비",
    icon: "Utensils",
    color: "#f4845f",
    type: "expense",
    sort_order: 0,
  },
  {
    name: "교통",
    icon: "Car",
    color: "#fcd34d",
    type: "expense",
    sort_order: 1,
  },
  {
    name: "주거",
    icon: "Home",
    color: "#6DD4B4",
    type: "expense",
    sort_order: 2,
  },
  {
    name: "통신",
    icon: "Smartphone",
    color: "#7dd3fc",
    type: "expense",
    sort_order: 3,
  },
  {
    name: "쇼핑",
    icon: "ShoppingCart",
    color: "#f472b6",
    type: "expense",
    sort_order: 4,
  },
  {
    name: "의료",
    icon: "HeartPulse",
    color: "#ef4444",
    type: "expense",
    sort_order: 5,
  },
  {
    name: "교육",
    icon: "GraduationCap",
    color: "#a78bfa",
    type: "expense",
    sort_order: 6,
  },
  {
    name: "여가",
    icon: "Gamepad2",
    color: "#fb923c",
    type: "expense",
    sort_order: 7,
  },
  {
    name: "구독",
    icon: "RotateCw",
    color: "#38bdf8",
    type: "expense",
    sort_order: 8,
  },
  {
    name: "기타지출",
    icon: "Package",
    color: "#94a3b8",
    type: "expense",
    sort_order: 9,
  },
];

export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () =>
      fromSupabase(
        supabase
          .from("categories")
          .select("*")
          .order("type")
          .order("sort_order"),
      ),
  });
};

export const useSeedDefaultCategories = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const user = await getAuthUser();

      const { count } = await supabase
        .from("categories")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (count > 0) return [];

      const rows = DEFAULT_CATEGORIES.map((c) => ({
        ...c,
        user_id: user.id,
        is_default: true,
      }));
      return fromSupabase(supabase.from("categories").insert(rows).select());
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
};

/**
 * 카테고리를 계층 구조로 변환 — 부모 카테고리 아래 서브 카테고리 그룹핑
 * [{ ...parent, children: [sub1, sub2] }, ...]
 */
export const useCategoryTree = () => {
  const { data: categories = [], ...rest } = useCategories();

  const tree = useMemo(() => {
    const parents = categories.filter((c) => !c.parent_id);
    const childMap = {};
    categories
      .filter((c) => c.parent_id)
      .forEach((c) => {
        if (!childMap[c.parent_id]) childMap[c.parent_id] = [];
        childMap[c.parent_id].push(c);
      });
    return parents.map((p) => ({
      ...p,
      children: (childMap[p.id] || []).sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    }));
  }, [categories]);

  return { data: tree, categories, ...rest };
};

export const useAddCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const user = await getAuthUser();
      return fromSupabase(
        supabase
          .from("categories")
          .insert({ ...payload, user_id: user.id })
          .select()
          .single(),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast().success("카테고리가 추가되었습니다");
    },
    onError: () => toast().error("카테고리 추가에 실패했습니다"),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }) =>
      fromSupabase(
        supabase
          .from("categories")
          .update(updates)
          .eq("id", id)
          .select()
          .single(),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast().success("카테고리가 수정되었습니다");
    },
    onError: () => toast().error("카테고리 수정에 실패했습니다"),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast().success("카테고리가 삭제되었습니다");
    },
    onError: () => toast().error("카테고리 삭제에 실패했습니다"),
  });
};
