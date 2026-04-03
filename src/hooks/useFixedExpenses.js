import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../lib/supabase";
import { fromSupabase, getAuthUser } from "../lib/supabaseQuery";
import { queryKeys } from "../lib/queryKeys";
import useToastStore from "../store/useToastStore";

const FE_SELECT =
  "*, category:categories(*), account:accounts(*)";

const toast = () => useToastStore.getState();

export const useFixedExpenses = () => {
  return useQuery({
    queryKey: queryKeys.fixedExpenses.all,
    queryFn: () =>
      fromSupabase(
        supabase
          .from("fixed_expenses")
          .select(FE_SELECT)
          .order("billing_day")
          .order("created_at"),
      ),
  });
};

export const useAddFixedExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const user = await getAuthUser();
      return fromSupabase(
        supabase
          .from("fixed_expenses")
          .insert({ ...payload, user_id: user.id })
          .select(FE_SELECT)
          .single(),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fixedExpenses.all });
      toast().success("고정지출이 추가되었습니다");
    },
    onError: () => toast().error("고정지출 추가에 실패했습니다"),
  });
};

export const useUpdateFixedExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }) =>
      fromSupabase(
        supabase
          .from("fixed_expenses")
          .update(updates)
          .eq("id", id)
          .select(FE_SELECT)
          .single(),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fixedExpenses.all });
      toast().success("고정지출이 수정되었습니다");
    },
    onError: () => toast().error("고정지출 수정에 실패했습니다"),
  });
};

export const useDeleteFixedExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from("fixed_expenses")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fixedExpenses.all });
      toast().success("고정지출이 삭제되었습니다");
    },
    onError: () => toast().error("고정지출 삭제에 실패했습니다"),
  });
};

export const useToggleFixedExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }) =>
      fromSupabase(
        supabase
          .from("fixed_expenses")
          .update({ is_active })
          .eq("id", id)
          .select(FE_SELECT)
          .single(),
      ),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.fixedExpenses.all });
      toast().success(
        data.is_active ? "고정지출이 활성화되었습니다" : "고정지출이 비활성화되었습니다",
      );
    },
    onError: () => toast().error("오류가 발생했습니다"),
  });
};
