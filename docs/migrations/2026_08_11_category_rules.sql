-- ============================================================
-- 카테고리 자동분류 규칙 (2026-08-11)
-- 적용 완료: Supabase 프로젝트 Pockit
--
-- 키워드 규칙: 거래 설명/가맹점명에 키워드가 포함되면 지정 카테고리로
-- 자동 분류. Plaid 동기화(Edge Function)가 적용하며, 우선순위는
--   사용자 직접 수정 > 키워드 규칙 > plaid_category_map(detailed > primary)
-- ============================================================

create table public.category_rules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  keyword     text not null check (length(trim(keyword)) >= 1),
  category_id uuid not null references public.categories(id) on delete cascade,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index category_rules_user_id_idx on public.category_rules (user_id);
create unique index category_rules_user_keyword_idx
  on public.category_rules (user_id, lower(keyword));

create trigger category_rules_updated_at
  before update on public.category_rules
  for each row execute function public.update_updated_at();

alter table public.category_rules enable row level security;

create policy "category_rules_select_own" on public.category_rules
  for select using (auth.uid() = user_id);
create policy "category_rules_insert_own" on public.category_rules
  for insert with check (auth.uid() = user_id);
create policy "category_rules_update_own" on public.category_rules
  for update using (auth.uid() = user_id);
create policy "category_rules_delete_own" on public.category_rules
  for delete using (auth.uid() = user_id);
