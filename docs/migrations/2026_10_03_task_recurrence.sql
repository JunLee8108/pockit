-- ============================================================
-- 적용 완료: Supabase 프로젝트 Pockit (2026-10-03)
-- 실행: Supabase SQL Editor 에서 그대로 실행
--
-- 구글 캘린더 방식:
--   원본(master) 행  : recurrence_rule(RRULE, DTSTART 제외) + due_date(시작일)
--                      회차는 DB에 만들지 않고 클라이언트에서 규칙으로 계산
--   예외 행          : recurring_task_id + original_date
--                      완료/수정/이동된 회차만 실제 행으로 저장
--   recurrence_exdates: 삭제된 회차 날짜 목록
-- ============================================================

alter table public.tasks
  add column if not exists recurrence_rule text,
  add column if not exists recurrence_exdates date[] not null default '{}',
  add column if not exists recurring_task_id uuid
    references public.tasks(id) on delete cascade,
  add column if not exists original_date date;

alter table public.tasks
  drop constraint if exists tasks_recurrence_needs_due_date,
  add constraint tasks_recurrence_needs_due_date
    check (recurrence_rule is null or due_date is not null),
  drop constraint if exists tasks_master_not_exception,
  add constraint tasks_master_not_exception
    check (recurrence_rule is null or recurring_task_id is null),
  drop constraint if exists tasks_exception_has_original_date,
  add constraint tasks_exception_has_original_date
    check (recurring_task_id is null or original_date is not null);

create index if not exists tasks_recurring_task_id_idx
  on public.tasks (recurring_task_id);

-- 회차당 예외 행은 1개
create unique index if not exists tasks_recurring_occurrence_idx
  on public.tasks (recurring_task_id, original_date)
  where recurring_task_id is not null;
