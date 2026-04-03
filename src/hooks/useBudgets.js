import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../lib/supabase";
import { fromSupabase, getAuthUser } from "../lib/supabaseQuery";
import { queryKeys } from "../lib/queryKeys";
import useToastStore from "../store/useToastStore";

const toast = () => useToastStore.getState();

export const useBudgets = (year, month) => {
  return useQuery({
    queryKey: queryKeys.budgets.list({ year, month }),
    queryFn: () =>
      fromSupabase(
        supabase
          .from("budgets")
          .select("*, category:categories(*)")
          .eq("year", year)
          .eq("month", month)
          .order("created_at"),
      ),
    enabled: !!year && !!month,
  });
};

export const useAddBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const user = await getAuthUser();
      return fromSupabase(
        supabase
          .from("budgets")
          .insert({ ...payload, user_id: user.id })
          .select("*, category:categories(*)")
          .single(),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.budgets.all });
      toast().success("예산이 추가되었습니다");
    },
    onError: () => toast().error("예산 추가에 실패했습니다"),
  });
};

export const useUpdateBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }) =>
      fromSupabase(
        supabase
          .from("budgets")
          .update(updates)
          .eq("id", id)
          .select("*, category:categories(*)")
          .single(),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.budgets.all });
      toast().success("예산이 수정되었습니다");
    },
    onError: () => toast().error("예산 수정에 실패했습니다"),
  });
};

export const useDeleteBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.budgets.all });
      toast().success("예산이 삭제되었습니다");
    },
    onError: () => toast().error("예산 삭제에 실패했습니다"),
  });
};

export const useCopyBudgets = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ fromYear, fromMonth, toYear, toMonth }) => {
      const user = await getAuthUser();

      const source = await fromSupabase(
        supabase
          .from("budgets")
          .select("category_id, amount, currency")
          .eq("user_id", user.id)
          .eq("year", fromYear)
          .eq("month", fromMonth),
      );

      if (!source.length) throw new Error("복사할 예산이 없습니다");

      const existing = await fromSupabase(
        supabase
          .from("budgets")
          .select("category_id")
          .eq("user_id", user.id)
          .eq("year", toYear)
          .eq("month", toMonth),
      );
      const existingIds = new Set(existing.map((b) => b.category_id));

      const rows = source
        .filter((b) => !existingIds.has(b.category_id))
        .map((b) => ({
          user_id: user.id,
          category_id: b.category_id,
          amount: b.amount,
          currency: b.currency,
          year: toYear,
          month: toMonth,
        }));

      if (rows.length === 0) return [];

      return fromSupabase(
        supabase
          .from("budgets")
          .insert(rows)
          .select("*, category:categories(*)"),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.budgets.all });
      toast().success("예산이 복사되었습니다");
    },
    onError: () => toast().error("예산 복사에 실패했습니다"),
  });
};
