-- Pockit 할일 플래너 기능 추가
-- task_categories, tasks 테이블 생성 + RLS + 인덱스 + 트리거
-- 실행: Supabase SQL Editor 에서 그대로 실행

-- =========================================================
-- 1. task_categories — 할일 전용 카테고리
-- =========================================================
create table if not exists public.task_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default 'ListTodo',
  color text not null default '#6DD4B4',
  sort_order int not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists task_categories_user_id_idx
  on public.task_categories (user_id);

alter table public.task_categories enable row level security;

drop policy if exists "task_categories_select_own" on public.task_categories;
drop policy if exists "task_categories_insert_own" on public.task_categories;
drop policy if exists "task_categories_update_own" on public.task_categories;
drop policy if exists "task_categories_delete_own" on public.task_categories;

create policy "task_categories_select_own"
  on public.task_categories for select using (auth.uid() = user_id);
create policy "task_categories_insert_own"
  on public.task_categories for insert with check (auth.uid() = user_id);
create policy "task_categories_update_own"
  on public.task_categories for update using (auth.uid() = user_id);
create policy "task_categories_delete_own"
  on public.task_categories for delete using (auth.uid() = user_id);

drop trigger if exists set_task_categories_updated_at on public.task_categories;
create trigger set_task_categories_updated_at
  before update on public.task_categories
  for each row execute function public.update_updated_at();

-- =========================================================
-- 2. tasks — 할일
-- =========================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  due_time time,
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high')),
  status text not null default 'todo'
    check (status in ('todo', 'done')),
  category_id uuid references public.task_categories(id) on delete set null,
  completed_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_due_date_idx on public.tasks (due_date);
create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_category_id_idx on public.tasks (category_id);

alter table public.tasks enable row level security;

drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;

create policy "tasks_select_own"
  on public.tasks for select using (auth.uid() = user_id);
create policy "tasks_insert_own"
  on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update_own"
  on public.tasks for update using (auth.uid() = user_id);
create policy "tasks_delete_own"
  on public.tasks for delete using (auth.uid() = user_id);

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute function public.update_updated_at();
