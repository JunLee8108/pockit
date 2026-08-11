import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import supabase from "../lib/supabase";
import { fromSupabase, getAuthUser } from "../lib/supabaseQuery";
import { queryKeys } from "../lib/queryKeys";
import useToastStore from "../store/useToastStore";

const TX_SELECT =
  "*, category:categories(*), account:accounts!account_id(*), to_account:accounts!to_account_id(*)";

// 카테고리 필터에서 "미분류"를 나타내는 특수 값
export const UNCATEGORIZED = "__uncategorized__";

// ── 월 단위 데이터 fetch (서버) ──

const useMonthTransactions = (year, month) => {
  return useQuery({
    queryKey: queryKeys.transactions.list({ year, month }),
    queryFn: async () => {
      const start = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = new Date(year, month, 0);
      const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

      const { data, error } = await supabase
        .from("transactions")
        .select(TX_SELECT)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!year && !!month,
  });
};

// ── 클라이언트 필터링 (네트워크 요청 없음) ──

export const useTransactions = (filters = {}) => {
  const { year, month, type, accountId, categoryIds, search } = filters;

  const query = useMonthTransactions(year, month);

  const filtered = useMemo(() => {
    if (!query.data) return [];

    let result = query.data;

    if (type && type !== "all") {
      result = result.filter((tx) => tx.type === type);
    }

    if (accountId) {
      result = result.filter(
        (tx) => tx.account_id === accountId || tx.to_account_id === accountId,
      );
    }

    if (categoryIds && categoryIds.length > 0) {
      const set = new Set(categoryIds);
      result = result.filter(
        (tx) =>
          set.has(tx.category_id) ||
          (set.has(UNCATEGORIZED) &&
            !tx.category_id &&
            tx.type !== "transfer"),
      );
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (tx) =>
          tx.description?.toLowerCase().includes(q) ||
          tx.memo?.toLowerCase().includes(q) ||
          tx.category?.name?.toLowerCase().includes(q) ||
          tx.account?.name?.toLowerCase().includes(q) ||
          tx.to_account?.name?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [query.data, type, accountId, categoryIds, search]);

  return {
    ...query,
    data: filtered,
    rawData: query.data || [],
  };
};

// ── 공통 invalidation 헬퍼 ──

const invalidateAll = (qc) => {
  qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
  qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
  qc.invalidateQueries({ queryKey: ["category-trend"] });
  qc.invalidateQueries({ queryKey: ["monthly-summary"] });
  qc.invalidateQueries({ queryKey: ["annual-summary"] });
  qc.invalidateQueries({ queryKey: ["annual-category"] });
};

const toast = () => useToastStore.getState();

// ── Mutations ──

export const useAddTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const user = await getAuthUser();

      const tx = await fromSupabase(
        supabase
          .from("transactions")
          .insert({ ...payload, user_id: user.id })
          .select(TX_SELECT)
          .single(),
      );

      await updateBalances(
        payload.type,
        payload.amount,
        payload.account_id,
        payload.to_account_id,
      );

      return tx;
    },
    onSuccess: () => {
      invalidateAll(qc);
      toast().success("거래가 추가되었습니다");
    },
    onError: () => toast().error("거래 추가에 실패했습니다"),
  });
};

export const useUpdateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates, prevTx }) => {
      await revertBalances(
        prevTx.type,
        prevTx.amount,
        prevTx.account_id,
        prevTx.to_account_id,
      );

      const tx = await fromSupabase(
        supabase
          .from("transactions")
          .update(updates)
          .eq("id", id)
          .select(TX_SELECT)
          .single(),
      );

      await updateBalances(
        updates.type,
        updates.amount,
        updates.account_id,
        updates.to_account_id,
      );

      // Plaid 거래 재분류 시 매핑 학습 → 다음 동기화부터 자동 분류
      if (
        prevTx.source === "plaid" &&
        prevTx.plaid_category &&
        updates.category_id &&
        updates.category_id !== prevTx.category_id
      ) {
        const user = await getAuthUser();
        await supabase.from("plaid_category_map").upsert(
          {
            user_id: user.id,
            plaid_category: prevTx.plaid_category,
            category_id: updates.category_id,
          },
          { onConflict: "user_id,plaid_category" },
        );
      }

      return tx;
    },
    onSuccess: () => {
      invalidateAll(qc);
      toast().success("거래가 수정되었습니다");
    },
    onError: () => toast().error("거래 수정에 실패했습니다"),
  });
};

// 일괄 카테고리 지정 — 금액/잔액에 영향이 없으므로 단일 update로 처리.
// Plaid 거래가 포함되면 plaid_category_map에 학습해 다음 동기화부터 자동 분류.
export const useBulkUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ txs, categoryId }) => {
      const ids = txs.map((t) => t.id);
      const { data, error } = await supabase
        .from("transactions")
        .update({ category_id: categoryId })
        .in("id", ids)
        .select("id");
      if (error) throw error;

      let learned = 0;
      if (categoryId) {
        const plaidCategories = [
          ...new Set(
            txs
              .filter((t) => t.source === "plaid" && t.plaid_category)
              .map((t) => t.plaid_category),
          ),
        ];
        if (plaidCategories.length > 0) {
          const user = await getAuthUser();
          const { error: mapErr } = await supabase
            .from("plaid_category_map")
            .upsert(
              plaidCategories.map((pc) => ({
                user_id: user.id,
                plaid_category: pc,
                category_id: categoryId,
              })),
              { onConflict: "user_id,plaid_category" },
            );
          if (!mapErr) learned = plaidCategories.length;
        }
      }

      return { updated: data?.length ?? 0, learned };
    },
    onSuccess: ({ updated, learned }) => {
      invalidateAll(qc);
      qc.invalidateQueries({ queryKey: queryKeys.plaidCategoryMap.all });
      toast().success(
        learned > 0
          ? `${updated}건 변경 · ${learned}개 유형을 학습했습니다`
          : `${updated}건의 카테고리를 변경했습니다`,
      );
    },
    onError: () => toast().error("일괄 변경에 실패했습니다"),
  });
};

export const useDeleteTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx) => {
      await revertBalances(tx.type, tx.amount, tx.account_id, tx.to_account_id);

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", tx.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(qc);
      toast().success("거래가 삭제되었습니다");
    },
    onError: () => toast().error("거래 삭제에 실패했습니다"),
  });
};

// ── 잔액 헬퍼 (에러 처리 추가) ──

async function adjustBalance(accountId, delta) {
  if (!accountId || delta === 0) return;

  const { data, error: selectErr } = await supabase
    .from("accounts")
    .select("balance, plaid_item_id")
    .eq("id", accountId)
    .single();

  if (selectErr || !data) {
    console.error("adjustBalance select failed:", selectErr);
    return;
  }

  // Plaid 연결 계좌는 동기화가 실제 잔액을 관리하므로 수동 증감 금지
  if (data.plaid_item_id) return;

  const { error: updateErr } = await supabase
    .from("accounts")
    .update({ balance: data.balance + delta })
    .eq("id", accountId);

  if (updateErr) {
    console.error("adjustBalance update failed:", updateErr);
  }
}

async function updateBalances(type, amount, accountId, toAccountId) {
  if (type === "expense") {
    await adjustBalance(accountId, -amount);
  } else if (type === "income") {
    await adjustBalance(accountId, amount);
  } else if (type === "transfer") {
    await adjustBalance(accountId, -amount);
    await adjustBalance(toAccountId, amount);
  }
}

async function revertBalances(type, amount, accountId, toAccountId) {
  if (type === "expense") {
    await adjustBalance(accountId, amount);
  } else if (type === "income") {
    await adjustBalance(accountId, -amount);
  } else if (type === "transfer") {
    await adjustBalance(accountId, amount);
    await adjustBalance(toAccountId, -amount);
  }
}
