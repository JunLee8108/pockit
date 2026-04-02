import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../lib/supabase";
import { fromSupabase, getAuthUser } from "../lib/supabaseQuery";
import { queryKeys } from "../lib/queryKeys";

const FE_SELECT =
  "*, category:categories(*), account:accounts(*)";

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
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.fixedExpenses.all }),
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
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.fixedExpenses.all }),
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
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.fixedExpenses.all }),
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
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.fixedExpenses.all }),
  });
};
