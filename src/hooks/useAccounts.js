import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../lib/supabase";
import { fromSupabase, getAuthUser } from "../lib/supabaseQuery";
import { queryKeys } from "../lib/queryKeys";
import useToastStore from "../store/useToastStore";

export const useAccounts = () => {
  return useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: () =>
      fromSupabase(
        supabase
          .from("accounts")
          .select("*")
          .order("sort_order", { ascending: true }),
      ),
  });
};

// 공통 invalidation 헬퍼
const invalidateAll = (qc) => {
  qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
  qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
  qc.invalidateQueries({ queryKey: ["category-trend"] });
  qc.invalidateQueries({ queryKey: ["monthly-summary"] });
};

const toast = () => useToastStore.getState();

export const useAddAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const user = await getAuthUser();
      return fromSupabase(
        supabase
          .from("accounts")
          .insert({ ...payload, user_id: user.id })
          .select()
          .single(),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
      toast().success("계좌가 추가되었습니다");
    },
    onError: () => toast().error("계좌 추가에 실패했습니다"),
  });
};

export const useUpdateAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      return fromSupabase(
        supabase
          .from("accounts")
          .update(updates)
          .eq("id", id)
          .select()
          .single(),
      );
    },
    onSuccess: () => {
      invalidateAll(qc);
      toast().success("계좌가 수정되었습니다");
    },
    onError: () => toast().error("계좌 수정에 실패했습니다"),
  });
};

export const useDeleteAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(qc);
      toast().success("계좌가 삭제되었습니다");
    },
    onError: () => toast().error("계좌 삭제에 실패했습니다"),
  });
};
