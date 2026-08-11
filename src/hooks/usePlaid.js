import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../lib/supabase";
import { fromSupabase } from "../lib/supabaseQuery";
import { queryKeys } from "../lib/queryKeys";
import useToastStore from "../store/useToastStore";

export const MAX_PLAID_ITEMS = 10;

// access_token, sync_cursor는 컬럼 권한으로 차단되어 있어 select("*") 금지
const PLAID_ITEM_COLUMNS =
  "id, institution_id, institution_name, status, error_code, last_synced_at, created_at, updated_at";

const toast = () => useToastStore.getState();

// Edge Function 호출 헬퍼 — 에러 바디에서 메시지 추출
async function invokePlaid(action, payload = {}) {
  const { data, error } = await supabase.functions.invoke("plaid-api", {
    body: { action, ...payload },
  });
  if (error) {
    let message = error.message;
    try {
      const body = await error.context?.json();
      if (body?.error?.message) message = body.error.message;
    } catch {
      // 바디 파싱 실패 시 기본 메시지 사용
    }
    throw new Error(message);
  }
  return data;
}

const invalidateFinancials = (qc) => {
  qc.invalidateQueries({ queryKey: queryKeys.plaidItems.all });
  qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
  qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
  qc.invalidateQueries({ queryKey: ["category-trend"] });
  qc.invalidateQueries({ queryKey: ["monthly-summary"] });
  qc.invalidateQueries({ queryKey: ["annual-summary"] });
  qc.invalidateQueries({ queryKey: ["annual-category"] });
};

export const usePlaidItems = () => {
  return useQuery({
    queryKey: queryKeys.plaidItems.all,
    queryFn: () =>
      fromSupabase(
        supabase
          .from("plaid_items")
          .select(PLAID_ITEM_COLUMNS)
          .order("created_at", { ascending: true }),
      ),
  });
};

// link_token 발급 — plaidItemId를 주면 재인증(update mode)용 토큰
export const useCreatePlaidLinkToken = () => {
  return useMutation({
    mutationFn: ({ plaidItemId } = {}) =>
      invokePlaid("create_link_token", { plaid_item_id: plaidItemId }),
    onError: (e) => toast().error(e.message || "은행 연결 준비에 실패했습니다"),
  });
};

export const useExchangePlaidToken = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicToken, institution }) =>
      invokePlaid("exchange_public_token", {
        public_token: publicToken,
        institution,
      }),
    onSuccess: (data) => {
      invalidateFinancials(qc);
      toast().success(
        `${data.institution_name || "은행"} 연결 완료 — 계좌 ${data.accounts_created}개 추가`,
      );
    },
    onError: (e) => toast().error(e.message || "은행 연결에 실패했습니다"),
  });
};

export const usePlaidSync = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ plaidItemId } = {}) =>
      invokePlaid("sync", { plaid_item_id: plaidItemId }),
    onSuccess: (data) => {
      invalidateFinancials(qc);
      const failed = data.results.filter((r) => !r.ok);
      const added = data.results.reduce((s, r) => s + (r.added ?? 0), 0);
      if (failed.length > 0) {
        toast().error(
          failed.some((r) => r.error_code === "ITEM_LOGIN_REQUIRED")
            ? "재인증이 필요한 연결이 있습니다"
            : "일부 연결 동기화에 실패했습니다",
        );
      } else {
        toast().success(
          added > 0 ? `새 거래 ${added}건을 가져왔습니다` : "최신 상태입니다",
        );
      }
    },
    onError: (e) => toast().error(e.message || "동기화에 실패했습니다"),
  });
};

export const useUnlinkPlaidItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ plaidItemId }) =>
      invokePlaid("unlink", { plaid_item_id: plaidItemId }),
    onSuccess: () => {
      invalidateFinancials(qc);
      toast().success("은행 연결이 해제되었습니다 (계좌·거래는 유지)");
    },
    onError: (e) => toast().error(e.message || "연결 해제에 실패했습니다"),
  });
};
