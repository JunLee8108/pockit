// Pockit Plaid API — 단일 Edge Function (액션 라우팅)
//
// 사용자 액션 (Authorization: 사용자 JWT 필수):
//   create_link_token   { plaid_item_id? }        → { link_token }  (item_id 있으면 update mode)
//   exchange_public_token { public_token, institution } → 계좌 생성 + 초기 동기화
//   sync                { plaid_item_id? }        → 전체 or 단일 item 동기화
//   unlink              { plaid_item_id }         → Plaid item 제거, 계좌는 수동 계좌로 전환
//
// 서버 트리거 (verify_jwt=false, 자체 검증):
//   plaid-verification 헤더 → Plaid 웹훅 (JWT 서명 + body sha256 검증 후 해당 item 동기화)
//   x-cron-secret 헤더      → pg_cron 정기 동기화 (Vault의 PLAID_CRON_SECRET 대조)
//
// Plaid 설정(PLAID_CLIENT_ID/SECRET/ENV/CRON_SECRET)은 Supabase Vault에 저장되어 있고
// service role 전용 RPC get_plaid_config()로만 읽는다.

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  jwtVerify,
  importJWK,
  decodeProtectedHeader,
} from "npm:jose@5";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const MAX_PLAID_ITEMS = 10;
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/plaid-api`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── Plaid 클라이언트 ──────────────────────────────────────────

class PlaidError extends Error {
  code: string;
  constructor(body: Record<string, unknown>) {
    super((body.error_message as string) ?? "Plaid request failed");
    this.code = (body.error_code as string) ?? "UNKNOWN";
  }
}

let cachedConfig: Record<string, string> | null = null;

async function getPlaidConfig(): Promise<Record<string, string>> {
  if (cachedConfig) return cachedConfig;
  const { data, error } = await admin.rpc("get_plaid_config");
  if (error || !data?.PLAID_CLIENT_ID || !data?.PLAID_SECRET) {
    throw new Error("Plaid config missing in Vault");
  }
  cachedConfig = data;
  return data;
}

async function plaid(path: string, body: Record<string, unknown>) {
  const cfg = await getPlaidConfig();
  const env = cfg.PLAID_ENV ?? "production";
  const res = await fetch(`https://${env}.plaid.com${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: cfg.PLAID_CLIENT_ID,
      secret: cfg.PLAID_SECRET,
      ...body,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new PlaidError(json);
  return json;
}

// ── 통화 변환 (major unit float → minor unit bigint) ─────────

let decimalsCache: Map<string, number> | null = null;

async function getCurrencyDecimals(): Promise<Map<string, number>> {
  if (decimalsCache) return decimalsCache;
  const { data, error } = await admin
    .from("currencies")
    .select("code, decimal_places");
  if (error) throw error;
  decimalsCache = new Map(data.map((c) => [c.code, c.decimal_places]));
  return decimalsCache;
}

// transactions.currency는 currencies FK — 미등록 통화는 최소 정보로 등록해서 FK 위반 방지
async function ensureCurrency(code: string): Promise<string> {
  if (!code) return "USD";
  const decimals = await getCurrencyDecimals();
  if (decimals.has(code)) return code;
  const { error } = await admin
    .from("currencies")
    .insert({ code, name: code, symbol: code, decimal_places: 2 });
  if (error) return "USD";
  decimals.set(code, 2);
  return code;
}

async function toMinorUnits(amount: number, code: string): Promise<number> {
  const decimals = await getCurrencyDecimals();
  const dp = decimals.get(code) ?? 2;
  return Math.round(Math.abs(amount) * 10 ** dp);
}

// ── 계좌 매핑 ────────────────────────────────────────────────

function mapAccountType(type: string, subtype: string | null): string {
  if (type === "credit") return "credit_card";
  if (type === "investment" || type === "brokerage") return "investment";
  if (type === "depository") {
    return subtype === "savings" ? "savings" : "checking";
  }
  return "checking";
}

// credit/loan은 Plaid가 부채를 양수로 주므로 앱 관례(음수=부채)에 맞게 부호 반전
function balanceSign(type: string): number {
  return type === "credit" || type === "loan" ? -1 : 1;
}

const ACCOUNT_COLORS = ["#6DD4B4", "#7BA7F7", "#F7B267", "#B58DF1", "#F78FB3"];

// ── 인증 ─────────────────────────────────────────────────────

async function getUser(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Unauthorized");
  return data.user;
}

async function getOwnedItem(userId: string, plaidItemId: string) {
  const { data, error } = await admin
    .from("plaid_items")
    .select("*")
    .eq("id", plaidItemId)
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("Plaid item not found");
  return data;
}

// ── 액션: create_link_token ──────────────────────────────────

async function createLinkToken(
  userId: string,
  body: { plaid_item_id?: string },
) {
  const base = {
    user: { client_user_id: userId },
    client_name: "Pockit",
    language: "en",
    country_codes: ["US"],
  };

  if (body.plaid_item_id) {
    // update mode (재인증) — products 없이 access_token 전달
    const item = await getOwnedItem(userId, body.plaid_item_id);
    const res = await plaid("/link/token/create", {
      ...base,
      access_token: item.access_token,
    });
    return { link_token: res.link_token, update_mode: true };
  }

  const { count, error } = await admin
    .from("plaid_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  if ((count ?? 0) >= MAX_PLAID_ITEMS) {
    throw new Error(`은행 연결은 최대 ${MAX_PLAID_ITEMS}개까지 가능합니다`);
  }

  const res = await plaid("/link/token/create", {
    ...base,
    products: ["transactions"],
    transactions: { days_requested: 730 },
    webhook: WEBHOOK_URL,
  });
  return { link_token: res.link_token, update_mode: false };
}

// ── 액션: exchange_public_token ──────────────────────────────

async function exchangePublicToken(
  userId: string,
  body: {
    public_token: string;
    institution?: { institution_id?: string; name?: string };
  },
) {
  const { access_token, item_id } = await plaid("/item/public_token/exchange", {
    public_token: body.public_token,
  });

  const { data: item, error: itemErr } = await admin
    .from("plaid_items")
    .insert({
      user_id: userId,
      item_id,
      access_token,
      institution_id: body.institution?.institution_id ?? null,
      institution_name: body.institution?.name ?? "",
    })
    .select()
    .single();
  if (itemErr) throw itemErr;

  // Plaid 계좌 → accounts 행 생성
  const accountsRes = await plaid("/accounts/get", { access_token });
  const rows = [];
  for (const [i, acct] of accountsRes.accounts.entries()) {
    const currency = await ensureCurrency(
      acct.balances.iso_currency_code ?? "USD",
    );
    const sign = balanceSign(acct.type);
    rows.push({
      user_id: userId,
      name: acct.name,
      institution: body.institution?.name ?? "",
      account_number: acct.mask ?? null,
      account_type: mapAccountType(acct.type, acct.subtype),
      currency,
      balance:
        sign * (await toMinorUnits(acct.balances.current ?? 0, currency)),
      available_balance:
        acct.balances.available != null
          ? await toMinorUnits(acct.balances.available, currency)
          : null,
      color: ACCOUNT_COLORS[i % ACCOUNT_COLORS.length],
      plaid_item_id: item.id,
      plaid_account_id: acct.account_id,
    });
  }
  const { error: acctErr } = await admin.from("accounts").insert(rows);
  if (acctErr) throw acctErr;

  // 초기 동기화 (Plaid가 아직 준비 전이면 다음 sync에서 마저 가져옴)
  let sync = null;
  try {
    sync = await syncItem(userId, item);
  } catch (_e) {
    sync = { added: 0, modified: 0, removed: 0, deferred: true };
  }

  return {
    plaid_item_id: item.id,
    institution_name: item.institution_name,
    accounts_created: rows.length,
    sync,
  };
}

// ── 동기화 ───────────────────────────────────────────────────

async function syncItem(
  userId: string,
  item: Record<string, unknown>,
) {
  let cursor = (item.sync_cursor as string) ?? undefined;
  const added: Record<string, unknown>[] = [];
  const modified: Record<string, unknown>[] = [];
  const removed: string[] = [];

  try {
    let hasMore = true;
    while (hasMore) {
      const res = await plaid("/transactions/sync", {
        access_token: item.access_token,
        cursor,
        count: 500,
      });
      added.push(...res.added);
      modified.push(...res.modified);
      removed.push(...res.removed.map((r) => r.transaction_id));
      cursor = res.next_cursor;
      hasMore = res.has_more;
    }
  } catch (e) {
    if (e instanceof PlaidError) {
      await admin
        .from("plaid_items")
        .update({
          status: e.code === "ITEM_LOGIN_REQUIRED" ? "login_required" : "error",
          error_code: e.code,
        })
        .eq("id", item.id);
    }
    throw e;
  }

  // 사용자 계좌 매핑 (앱에서 삭제된 계좌의 거래는 스킵)
  const { data: accounts, error: acctErr } = await admin
    .from("accounts")
    .select("id, plaid_account_id, account_type")
    .eq("plaid_item_id", item.id);
  if (acctErr) throw acctErr;
  const accountByPlaidId = new Map(
    accounts.map((a) => [a.plaid_account_id, a]),
  );

  // 사용자 카테고리 매핑 (detailed 우선, primary 폴백)
  const { data: catMaps } = await admin
    .from("plaid_category_map")
    .select("plaid_category, category_id")
    .eq("user_id", userId);
  const categoryMap = new Map(
    (catMaps ?? []).map((m) => [m.plaid_category, m.category_id]),
  );

  // 키워드 규칙 (가맹점명/설명 부분일치, sort_order 순으로 첫 매칭 적용)
  const { data: rules } = await admin
    .from("category_rules")
    .select("keyword, category_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at");
  const matchRule = (t: Record<string, unknown>): string | null => {
    const haystack = `${(t.merchant_name as string) ?? ""} ${(t.name as string) ?? ""}`
      .toLowerCase();
    for (const r of rules ?? []) {
      if (haystack.includes(r.keyword.toLowerCase())) return r.category_id;
    }
    return null;
  };

  const upserts = [...added, ...modified];

  // 기존 행의 사용자 수정(카테고리/메모/타입)을 보존하기 위해 미리 조회
  // pending → posted 전환 시에도 pending 행의 카테고리를 승계
  const lookupIds = new Set<string>();
  for (const t of upserts) {
    lookupIds.add(t.transaction_id as string);
    if (t.pending_transaction_id) lookupIds.add(t.pending_transaction_id as string);
  }
  const existingById = new Map<string, Record<string, unknown>>();
  if (lookupIds.size > 0) {
    const { data: existing } = await admin
      .from("transactions")
      .select("plaid_transaction_id, category_id, memo, type")
      .eq("user_id", userId)
      .in("plaid_transaction_id", [...lookupIds]);
    for (const row of existing ?? []) {
      existingById.set(row.plaid_transaction_id as string, row);
    }
  }

  const rows = [];
  let skipped = 0;
  for (const t of upserts) {
    const account = accountByPlaidId.get(t.account_id as string);
    if (!account) {
      skipped++;
      continue;
    }
    const currency = await ensureCurrency(
      (t.iso_currency_code as string) ?? "USD",
    );
    const pfc = t.personal_finance_category as
      | { primary?: string; detailed?: string }
      | null;
    const prev =
      existingById.get(t.transaction_id as string) ??
      (t.pending_transaction_id
        ? existingById.get(t.pending_transaction_id as string)
        : undefined);

    // 카드 대금 결제는 내 계좌 간 이동 — 수입/지출이 아닌 이체로 분류.
    // Plaid는 양쪽(출금/입금)을 독립된 거래로 주므로 각각 단방향 이체로 저장.
    const isCardPayment =
      pfc?.detailed === "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT" ||
      (account.account_type === "credit_card" &&
        (t.amount as number) < 0 &&
        pfc?.primary === "TRANSFER_IN");

    // 사용자가 수동으로 바꾼 type은 재동기화 때 보존
    const txType =
      (prev?.type as string) ??
      (isCardPayment
        ? "transfer"
        : (t.amount as number) >= 0
          ? "expense"
          : "income");

    rows.push({
      user_id: userId,
      account_id: account.id,
      type: txType,
      amount: await toMinorUnits(t.amount as number, currency),
      currency,
      description: (t.merchant_name as string) || (t.name as string) || "",
      merchant_name: (t.merchant_name as string) ?? null,
      date: (t.date as string) ?? null,
      memo: (prev?.memo as string) ?? null,
      category_id:
        txType === "transfer"
          ? null
          : ((prev?.category_id as string) ??
            matchRule(t) ??
            categoryMap.get(pfc?.detailed ?? "") ??
            categoryMap.get(pfc?.primary ?? "") ??
            null),
      plaid_transaction_id: t.transaction_id as string,
      pending_plaid_transaction_id:
        (t.pending_transaction_id as string) ?? null,
      is_pending: (t.pending as boolean) ?? false,
      source: "plaid",
      plaid_category: pfc?.detailed ?? null,
    });
  }

  // 삭제분 제거 (pending → posted 전환 시 pending 행도 여기서 제거됨)
  const toRemove = new Set(removed);
  for (const t of upserts) {
    if (t.pending_transaction_id) toRemove.add(t.pending_transaction_id as string);
  }
  // 새로 upsert되는 ID는 삭제 대상에서 제외
  for (const r of rows) toRemove.delete(r.plaid_transaction_id);

  if (toRemove.size > 0) {
    const { error } = await admin
      .from("transactions")
      .delete()
      .eq("user_id", userId)
      .in("plaid_transaction_id", [...toRemove]);
    if (error) throw error;
  }

  if (rows.length > 0) {
    const { error } = await admin
      .from("transactions")
      .upsert(rows, { onConflict: "plaid_transaction_id" });
    if (error) throw error;
  }

  // 잔액을 Plaid 기준으로 갱신
  const balRes = await plaid("/accounts/get", {
    access_token: item.access_token,
  });
  for (const acct of balRes.accounts) {
    const account = accountByPlaidId.get(acct.account_id);
    if (!account) continue;
    const currency = await ensureCurrency(
      acct.balances.iso_currency_code ?? "USD",
    );
    const sign = balanceSign(acct.type);
    await admin
      .from("accounts")
      .update({
        balance:
          sign * (await toMinorUnits(acct.balances.current ?? 0, currency)),
        available_balance:
          acct.balances.available != null
            ? await toMinorUnits(acct.balances.available, currency)
            : null,
      })
      .eq("id", account.id);
  }

  await admin
    .from("plaid_items")
    .update({
      sync_cursor: cursor,
      status: "active",
      error_code: null,
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", item.id);

  return {
    added: added.length,
    modified: modified.length,
    removed: removed.length,
    skipped,
  };
}

async function syncAction(userId: string, body: { plaid_item_id?: string }) {
  let items;
  if (body.plaid_item_id) {
    items = [await getOwnedItem(userId, body.plaid_item_id)];
  } else {
    const { data, error } = await admin
      .from("plaid_items")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "disconnected");
    if (error) throw error;
    items = data;
  }

  const results = [];
  for (const item of items) {
    try {
      const r = await syncItem(userId, item);
      results.push({ plaid_item_id: item.id, ok: true, ...r });
    } catch (e) {
      results.push({
        plaid_item_id: item.id,
        ok: false,
        error_code: e instanceof PlaidError ? e.code : "SYNC_FAILED",
      });
    }
  }
  return { results };
}

// ── 액션: unlink ─────────────────────────────────────────────

async function unlink(userId: string, body: { plaid_item_id: string }) {
  const item = await getOwnedItem(userId, body.plaid_item_id);

  try {
    await plaid("/item/remove", { access_token: item.access_token });
  } catch (_e) {
    // 이미 무효화된 토큰이어도 로컬 정리는 계속 진행
  }

  // 계좌는 수동 계좌로 전환 (거래 기록 보존), plaid_account_id는 재연결 대비 해제
  const { error: acctErr } = await admin
    .from("accounts")
    .update({ plaid_account_id: null, available_balance: null })
    .eq("plaid_item_id", item.id);
  if (acctErr) throw acctErr;

  // plaid_items 삭제 → accounts.plaid_item_id는 FK로 자동 null
  const { error } = await admin
    .from("plaid_items")
    .delete()
    .eq("id", item.id);
  if (error) throw error;

  return { unlinked: true };
}

// ── Plaid 웹훅 ───────────────────────────────────────────────

// plaid-verification 헤더의 ES256 JWT를 Plaid 공개키로 검증하고
// body sha256이 클레임과 일치하는지 확인
async function verifyPlaidWebhook(
  req: Request,
  rawBody: string,
): Promise<boolean> {
  const token = req.headers.get("plaid-verification");
  if (!token) return false;
  try {
    const { kid, alg } = decodeProtectedHeader(token);
    if (alg !== "ES256" || !kid) return false;
    const keyRes = await plaid("/webhook_verification_key/get", {
      key_id: kid,
    });
    const key = await importJWK(keyRes.key, "ES256");
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["ES256"],
      maxTokenAge: "5 min",
    });
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(rawBody),
    );
    const bodyHash = [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return payload.request_body_sha256 === bodyHash;
  } catch (_e) {
    return false;
  }
}

async function handleWebhook(req: Request, rawBody: string) {
  if (!(await verifyPlaidWebhook(req, rawBody))) {
    return new Response("invalid signature", { status: 401 });
  }

  const hook = JSON.parse(rawBody);
  const ack = () =>
    new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });

  const { data: item } = await admin
    .from("plaid_items")
    .select("*")
    .eq("item_id", hook.item_id)
    .maybeSingle();
  if (!item) return ack();

  if (hook.webhook_type === "TRANSACTIONS") {
    // SYNC_UPDATES_AVAILABLE 및 레거시 업데이트 코드 모두 동기화로 처리
    try {
      await syncItem(item.user_id, item);
    } catch (_e) {
      // 실패 상태는 syncItem이 plaid_items에 기록
    }
  } else if (hook.webhook_type === "ITEM") {
    switch (hook.webhook_code) {
      case "ERROR":
        await admin
          .from("plaid_items")
          .update({
            status:
              hook.error?.error_code === "ITEM_LOGIN_REQUIRED"
                ? "login_required"
                : "error",
            error_code: hook.error?.error_code ?? "ITEM_ERROR",
          })
          .eq("id", item.id);
        break;
      case "PENDING_EXPIRATION":
      case "PENDING_DISCONNECT":
        await admin
          .from("plaid_items")
          .update({ status: "login_required", error_code: hook.webhook_code })
          .eq("id", item.id);
        break;
      case "LOGIN_REPAIRED":
        await admin
          .from("plaid_items")
          .update({ status: "active", error_code: null })
          .eq("id", item.id);
        try {
          await syncItem(item.user_id, item);
        } catch (_e) {
          // 실패 상태는 syncItem이 기록
        }
        break;
      case "USER_PERMISSION_REVOKED":
      case "USER_ACCOUNT_REVOKED":
        await admin
          .from("plaid_items")
          .update({ status: "disconnected", error_code: hook.webhook_code })
          .eq("id", item.id);
        break;
    }
  }

  return ack();
}

// ── pg_cron 정기 동기화 (모든 사용자) ────────────────────────

async function handleCron(req: Request) {
  const cfg = await getPlaidConfig();
  if (
    !cfg.PLAID_CRON_SECRET ||
    req.headers.get("x-cron-secret") !== cfg.PLAID_CRON_SECRET
  ) {
    return new Response("unauthorized", { status: 401 });
  }

  const { data: items, error } = await admin
    .from("plaid_items")
    .select("*")
    .in("status", ["active", "error"]);
  if (error) throw error;

  const results = [];
  for (const item of items) {
    try {
      const r = await syncItem(item.user_id, item);
      results.push({ plaid_item_id: item.id, ok: true, ...r });
    } catch (e) {
      results.push({
        plaid_item_id: item.id,
        ok: false,
        error_code: e instanceof PlaidError ? e.code : "SYNC_FAILED",
      });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json" },
  });
}

// ── 라우터 ───────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // 서버 트리거 경로 (사용자 JWT 없음, 자체 검증)
  if (req.headers.get("plaid-verification")) {
    return await handleWebhook(req, await req.text());
  }
  if (req.headers.get("x-cron-secret")) {
    return await handleCron(req);
  }

  try {
    const user = await getUser(req);
    const body = await req.json();

    let result;
    switch (body.action) {
      case "create_link_token":
        result = await createLinkToken(user.id, body);
        break;
      case "exchange_public_token":
        result = await exchangePublicToken(user.id, body);
        break;
      case "sync":
        result = await syncAction(user.id, body);
        break;
      case "unlink":
        result = await unlink(user.id, body);
        break;
      default:
        throw new Error(`Unknown action: ${body.action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    const err = e as Error;
    const status = err.message === "Unauthorized" ? 401 : 400;
    return new Response(
      JSON.stringify({
        error: {
          message: err.message ?? "Unknown error",
          code: e instanceof PlaidError ? e.code : undefined,
        },
      }),
      {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }
});
