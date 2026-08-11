import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../lib/supabase";
import { fromSupabase } from "../lib/supabaseQuery";
import { queryKeys } from "../lib/queryKeys";
import useToastStore from "../store/useToastStore";

const toast = () => useToastStore.getState();

export const usePlaidCategoryMap = () => {
  return useQuery({
    queryKey: queryKeys.plaidCategoryMap.all,
    queryFn: () =>
      fromSupabase(
        supabase
          .from("plaid_category_map")
          .select("*, category:categories(*)")
          .order("created_at", { ascending: false }),
      ),
  });
};

export const useUpdatePlaidCategoryMap = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, categoryId }) =>
      fromSupabase(
        supabase
          .from("plaid_category_map")
          .update({ category_id: categoryId })
          .eq("id", id)
          .select("*, category:categories(*)")
          .single(),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.plaidCategoryMap.all });
      toast().success("매핑이 수정되었습니다");
    },
    onError: () => toast().error("매핑 수정에 실패했습니다"),
  });
};

export const useDeletePlaidCategoryMap = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from("plaid_category_map")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.plaidCategoryMap.all });
      toast().success("매핑이 삭제되었습니다");
    },
    onError: () => toast().error("매핑 삭제에 실패했습니다"),
  });
};
