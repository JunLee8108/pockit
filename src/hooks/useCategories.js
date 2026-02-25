import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../lib/supabase";
import { fromSupabase } from "../lib/supabaseQuery";
import { queryKeys } from "../lib/queryKeys";

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 이미 카테고리가 있으면 skip
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

export const useAddCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return fromSupabase(
        supabase
          .from("categories")
          .insert({ ...payload, user_id: user.id })
          .select()
          .single(),
      );
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
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
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
};
