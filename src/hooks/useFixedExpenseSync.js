import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../lib/supabase";
import { getAuthUser } from "../lib/supabaseQuery";
import { queryKeys } from "../lib/queryKeys";

/**
 * 앱 접속 시 활성 고정지출 중 결제일이 지났지만
 * 이번 달 transaction이 아직 생성되지 않은 항목을 자동 생성한다.
 *
 * - localStorage에 마지막 동기화 월을 저장하여 같은 월 중복 실행 방지
 * - 결제일이 오늘이거나 이미 지난 항목만 대상
 */

const SYNC_KEY = "pockit_fe_sync";

function getSyncState() {
  try {
    return JSON.parse(localStorage.getItem(SYNC_KEY)) || {};
  } catch {
    return {};
  }
}

function setSyncState(year, month) {
  localStorage.setItem(SYNC_KEY, JSON.stringify({ year, month }));
}

async function adjustBalance(accountId, delta) {
  if (!accountId || delta === 0) return;
  const { data, error: selErr } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", accountId)
    .single();
  if (selErr || !data) return;
  await supabase
    .from("accounts")
    .update({ balance: data.balance + delta })
    .eq("id", accountId);
}

async function syncFixedExpenses() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.getDate();

  // 같은 월에 이미 동기화 완료했으면 스킵
  const prev = getSyncState();
  if (prev.year === year && prev.month === month) return [];

  const user = await getAuthUser();

  // 1) 활성 고정지출 목록
  const { data: actives, error: feErr } = await supabase
    .from("fixed_expenses")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true);
  if (feErr) throw feErr;
  if (!actives || actives.length === 0) {
    setSyncState(year, month);
    return [];
  }

  // 2) 이번 달에 이미 생성된 고정지출 transaction 조회
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: existing, error: txErr } = await supabase
    .from("transactions")
    .select("fixed_expense_id")
    .eq("user_id", user.id)
    .not("fixed_expense_id", "is", null)
    .gte("date", startDate)
    .lte("date", endDate);
  if (txErr) throw txErr;

  const existingIds = new Set((existing || []).map((t) => t.fixed_expense_id));

  // 3) 결제일이 오늘이거나 지난 것 중 미생성 항목 필터
  const toCreate = actives.filter(
    (fe) => fe.billing_day <= today && !existingIds.has(fe.id),
  );

  if (toCreate.length === 0) {
    // 모든 결제일이 아직 안 됐으면 동기화 상태 저장 안 함 (다음 접속 시 재시도)
    // 모든 항목의 결제일이 지났으면 동기화 완료로 표시
    const allPassed = actives.every((fe) => fe.billing_day <= today);
    if (allPassed) setSyncState(year, month);
    return [];
  }

  // 4) transaction 일괄 생성
  const rows = toCreate.map((fe) => {
    const billingDay = Math.min(fe.billing_day, lastDay);
    const date = `${year}-${String(month).padStart(2, "0")}-${String(billingDay).padStart(2, "0")}`;
    return {
      user_id: user.id,
      account_id: fe.account_id,
      category_id: fe.category_id,
      type: "expense",
      amount: fe.amount,
      currency: fe.currency,
      description: fe.name,
      date,
      fixed_expense_id: fe.id,
      memo: fe.memo || null,
    };
  });

  const { data: created, error: insErr } = await supabase
    .from("transactions")
    .insert(rows)
    .select("*");
  if (insErr) throw insErr;

  // 5) 잔액 차감
  for (const fe of toCreate) {
    await adjustBalance(fe.account_id, -fe.amount);
  }

  // 모든 활성 항목의 결제일이 지났으면 동기화 완료
  const allPassed = actives.every((fe) => fe.billing_day <= today);
  if (allPassed) setSyncState(year, month);

  return created || [];
}

export const useFixedExpenseSync = () => {
  const qc = useQueryClient();
  const ranRef = useRef(false);

  const { mutate } = useMutation({
    mutationFn: syncFixedExpenses,
    onSuccess: (created) => {
      if (created.length > 0) {
        qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
        qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
        qc.invalidateQueries({ queryKey: queryKeys.fixedExpenses.all });
      }
    },
  });

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    mutate();
  }, [mutate]);
};

/**
 * 수동 일괄 등록 — 고정지출 리스트 페이지에서 "이번 달 일괄 등록" 버튼용
 */
export const useBulkCreateFixedExpenseTx = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fixedExpenses) => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const lastDay = new Date(year, month, 0).getDate();
      const user = await getAuthUser();

      // 이미 생성된 것 조회
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const { data: existing } = await supabase
        .from("transactions")
        .select("fixed_expense_id")
        .eq("user_id", user.id)
        .not("fixed_expense_id", "is", null)
        .gte("date", startDate)
        .lte("date", endDate);

      const existingIds = new Set(
        (existing || []).map((t) => t.fixed_expense_id),
      );
      const toCreate = fixedExpenses.filter(
        (fe) => fe.is_active && !existingIds.has(fe.id),
      );

      if (toCreate.length === 0) return [];

      const rows = toCreate.map((fe) => {
        const billingDay = Math.min(fe.billing_day, lastDay);
        const date = `${year}-${String(month).padStart(2, "0")}-${String(billingDay).padStart(2, "0")}`;
        return {
          user_id: user.id,
          account_id: fe.account_id,
          category_id: fe.category_id,
          type: "expense",
          amount: fe.amount,
          currency: fe.currency,
          description: fe.name,
          date,
          fixed_expense_id: fe.id,
          memo: fe.memo || null,
        };
      });

      const { data: created, error } = await supabase
        .from("transactions")
        .insert(rows)
        .select("*");
      if (error) throw error;

      for (const fe of toCreate) {
        await adjustBalance(fe.account_id, -fe.amount);
      }

      return created || [];
    },
    onSuccess: (created) => {
      if (created.length > 0) {
        qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
        qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
        qc.invalidateQueries({ queryKey: queryKeys.fixedExpenses.all });
        qc.invalidateQueries({ queryKey: ["monthly-summary"] });
        qc.invalidateQueries({ queryKey: ["annual-summary"] });
        qc.invalidateQueries({ queryKey: ["annual-category"] });
      }
    },
  });
};
