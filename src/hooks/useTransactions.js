import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import supabase from "../lib/supabase";
import { fromSupabase } from "../lib/supabaseQuery";
import { queryKeys } from "../lib/queryKeys";

const TX_SELECT =
  "*, category:categories(*), account:accounts!account_id(*), to_account:accounts!to_account_id(*)";

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
  const { year, month, type, accountId, categoryId, search } = filters;

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

    if (categoryId) {
      result = result.filter((tx) => tx.category_id === categoryId);
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
  }, [query.data, type, accountId, categoryId, search]);

  return {
    ...query,
    data: filtered,
  };
};

// ── Mutations ──

export const useAddTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

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
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
      qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
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

      return tx;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
      qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
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
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
      qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
};

// ── 잔액 헬퍼 ──

async function adjustBalance(accountId, delta) {
  if (!accountId || delta === 0) return;
  const { data } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", accountId)
    .single();
  if (!data) return;
  await supabase
    .from("accounts")
    .update({ balance: data.balance + delta })
    .eq("id", accountId);
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
