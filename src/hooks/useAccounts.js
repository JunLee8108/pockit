import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../lib/supabase";
import { fromSupabase } from "../lib/supabaseQuery";
import { queryKeys } from "../lib/queryKeys";

// 조회
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

// 추가
export const useAddAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return fromSupabase(
        supabase
          .from("accounts")
          .insert({ ...payload, user_id: user.id })
          .select()
          .single(),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts.all }),
  });
};

// 수정
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
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts.all }),
  });
};

// 삭제
export const useDeleteAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts.all }),
  });
};
