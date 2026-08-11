-- ============================================================
-- Plaid 연동 마이그레이션 (2026-08-11)
-- 적용 완료: Supabase 프로젝트 Pockit
--
-- 1) 기존 금융 데이터 초기화 (transactions, accounts)
-- 2) plaid_items 테이블 (은행 연결 단위, access_token은 서버 전용)
-- 3) accounts / transactions에 Plaid 연동 컬럼 추가
-- 4) plaid_category_map (Plaid 카테고리 → 사용자 카테고리 매핑)
-- 5) 트리거 함수 보안 하드닝
-- ============================================================

-- 1) 기존 데이터 초기화 --------------------------------------
delete from public.transactions;
delete from public.accounts;  -- fixed_expenses.account_id는 FK로 자동 null 처리

-- 2) plaid_items ---------------------------------------------
create table public.plaid_items (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  item_id          text not null unique,
  access_token     text not null,
  institution_id   text,
  institution_name text not null default '',
  sync_cursor      text,
  status           text not null default 'active'
                   check (status in ('active', 'login_required', 'error', 'disconnected')),
  error_code       text,
  last_synced_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index plaid_items_user_id_idx on public.plaid_items (user_id);

create trigger plaid_items_updated_at
  before update on public.plaid_items
  for each row execute function public.update_updated_at();

alter table public.plaid_items enable row level security;

-- 조회만 허용 (쓰기는 Edge Function의 service role 전용)
create policy "plaid_items_select_own" on public.plaid_items
  for select using (auth.uid() = user_id);

-- access_token / sync_cursor는 클라이언트에 절대 노출 금지: 컬럼 단위 권한
revoke all on table public.plaid_items from anon, authenticated;
grant select (id, user_id, institution_id, institution_name, status,
              error_code, last_synced_at, created_at, updated_at)
  on public.plaid_items to authenticated;

-- 3) accounts: Plaid 연동 컬럼 -------------------------------
alter table public.accounts
  add column plaid_item_id     uuid references public.plaid_items(id) on delete set null,
  add column plaid_account_id  text unique,
  add column available_balance bigint;

create index accounts_plaid_item_id_idx
  on public.accounts (plaid_item_id) where plaid_item_id is not null;

-- 4) transactions: Plaid 연동 컬럼 ---------------------------
alter table public.transactions
  add column plaid_transaction_id         text unique,
  add column pending_plaid_transaction_id text,
  add column is_pending                   boolean not null default false,
  add column source                       text not null default 'manual'
             check (source in ('manual', 'plaid')),
  add column merchant_name                text,
  add column plaid_category               text;

create index transactions_pending_idx
  on public.transactions (user_id) where is_pending;
create index transactions_pending_plaid_tx_idx
  on public.transactions (pending_plaid_transaction_id)
  where pending_plaid_transaction_id is not null;

-- 5) plaid_category_map --------------------------------------
create table public.plaid_category_map (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  plaid_category text not null,
  category_id    uuid not null references public.categories(id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, plaid_category)
);

create index plaid_category_map_user_id_idx on public.plaid_category_map (user_id);

create trigger plaid_category_map_updated_at
  before update on public.plaid_category_map
  for each row execute function public.update_updated_at();

alter table public.plaid_category_map enable row level security;

create policy "plaid_category_map_select_own" on public.plaid_category_map
  for select using (auth.uid() = user_id);
create policy "plaid_category_map_insert_own" on public.plaid_category_map
  for insert with check (auth.uid() = user_id);
create policy "plaid_category_map_update_own" on public.plaid_category_map
  for update using (auth.uid() = user_id);
create policy "plaid_category_map_delete_own" on public.plaid_category_map
  for delete using (auth.uid() = user_id);

-- 6) 트리거 함수 보안 하드닝 ---------------------------------
alter function public.update_updated_at() set search_path = '';
alter function public.handle_new_user() set search_path = '';

revoke execute on function public.update_updated_at() from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
