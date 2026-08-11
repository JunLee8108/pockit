import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../lib/supabase";
import { fromSupabase, getAuthUser } from "../lib/supabaseQuery";
import { queryKeys } from "../lib/queryKeys";
import useToastStore from "../store/useToastStore";

const toast = () => useToastStore.getState();

const RULE_SELECT = "*, category:categories(*)";

export const useCategoryRules = () => {
  return useQuery({
    queryKey: queryKeys.categoryRules.all,
    queryFn: () =>
      fromSupabase(
        supabase
          .from("category_rules")
          .select(RULE_SELECT)
          .order("sort_order")
          .order("created_at"),
      ),
  });
};

export const useAddCategoryRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const user = await getAuthUser();
      return fromSupabase(
        supabase
          .from("category_rules")
          .insert({ ...payload, user_id: user.id })
          .select(RULE_SELECT)
          .single(),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categoryRules.all });
      toast().success("규칙이 추가되었습니다");
    },
    onError: (e) =>
      toast().error(
        e?.code === "23505"
          ? "이미 같은 키워드의 규칙이 있습니다"
          : "규칙 추가에 실패했습니다",
      ),
  });
};

export const useUpdateCategoryRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }) =>
      fromSupabase(
        supabase
          .from("category_rules")
          .update(updates)
          .eq("id", id)
          .select(RULE_SELECT)
          .single(),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categoryRules.all });
    },
    onError: (e) =>
      toast().error(
        e?.code === "23505"
          ? "이미 같은 키워드의 규칙이 있습니다"
          : "규칙 수정에 실패했습니다",
      ),
  });
};

// 새 순서의 규칙 배열을 받아 sort_order를 인덱스로 재부여
export const useReorderCategoryRules = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedRules) => {
      const changed = orderedRules
        .map((r, i) => ({ id: r.id, sort_order: i, prev: r.sort_order }))
        .filter((r) => r.sort_order !== r.prev);
      await Promise.all(
        changed.map(({ id, sort_order }) =>
          fromSupabase(
            supabase
              .from("category_rules")
              .update({ sort_order })
              .eq("id", id)
              .select("id"),
          ),
        ),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categoryRules.all });
    },
    onError: () => toast().error("순서 변경에 실패했습니다"),
  });
};

export const useDeleteCategoryRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from("category_rules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categoryRules.all });
      toast().success("규칙이 삭제되었습니다");
    },
    onError: () => toast().error("규칙 삭제에 실패했습니다"),
  });
};

// ── 소급 적용: 키워드와 일치하는 미분류 거래에 카테고리 지정 ──

// 미분류 거래 중 키워드 매칭 건수 (이체 제외)
export const countRuleMatches = async (keyword) => {
  const kw = keyword.trim();
  if (!kw) return 0;
  const pattern = `%${kw}%`;

  const countBy = async (column) => {
    const { count, error } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .is("category_id", null)
      .neq("type", "transfer")
      .ilike(column, pattern);
    if (error) throw error;
    return count ?? 0;
  };

  // description / merchant_name 중복 매칭이 있어도 적용 결과는 동일하므로
  // 안내용 건수는 합집합 대신 두 컬럼 중 큰 값으로 근사하지 않고 정확히 센다
  const { count, error } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .is("category_id", null)
    .neq("type", "transfer")
    .or(`description.ilike.${pattern},merchant_name.ilike.${pattern}`);
  if (error) {
    // 키워드에 or 구문 특수문자(쉼표 등)가 있으면 개별 컬럼으로 폴백
    const [a, b] = await Promise.all([
      countBy("description"),
      countBy("merchant_name"),
    ]);
    return Math.max(a, b);
  }
  return count ?? 0;
};

export const useApplyRuleToUncategorized = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ keyword, categoryId }) => {
      const pattern = `%${keyword.trim()}%`;

      const applyBy = async (column) => {
        const { data, error } = await supabase
          .from("transactions")
          .update({ category_id: categoryId })
          .is("category_id", null)
          .neq("type", "transfer")
          .ilike(column, pattern)
          .select("id");
        if (error) throw error;
        return data?.length ?? 0;
      };

      // 두 컬럼을 순차 적용 — 첫 적용에서 채워진 거래는 두 번째에서 제외됨
      const a = await applyBy("description");
      const b = await applyBy("merchant_name");
      return a + b;
    },
    onSuccess: (applied) => {
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
      qc.invalidateQueries({ queryKey: ["category-trend"] });
      qc.invalidateQueries({ queryKey: ["monthly-summary"] });
      qc.invalidateQueries({ queryKey: ["annual-summary"] });
      qc.invalidateQueries({ queryKey: ["annual-category"] });
      if (applied > 0) toast().success(`${applied}건에 카테고리를 적용했습니다`);
    },
    onError: () => toast().error("기존 거래 적용에 실패했습니다"),
  });
};
