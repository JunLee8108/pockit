-- ============================================================
-- 플래너: 할일 + 일정 (2026-10-04)
-- 적용 완료: Supabase 프로젝트 Pockit
--
-- tasks 테이블 하나로 할일과 일정을 함께 관리 (반복/카테고리/캘린더 공용)
--   kind = 'task'  : 할일 — 완료 체크. due_time ~ end_time 이 있으면 시간 블록
--   kind = 'event' : 일정 — 완료 체크 없음. 시간이 없으면 종일 일정
--   end_time       : 종료 시각 (같은 날, 시작 시각 이후)
-- ============================================================

alter table public.tasks
  add column if not exists kind text not null default 'task',
  add column if not exists end_time time;

alter table public.tasks
  drop constraint if exists tasks_kind_check,
  add constraint tasks_kind_check
    check (kind in ('task', 'event')),
  drop constraint if exists tasks_event_needs_due_date,
  add constraint tasks_event_needs_due_date
    check (kind = 'task' or due_date is not null),
  drop constraint if exists tasks_end_time_check,
  add constraint tasks_end_time_check
    check (end_time is null or (due_time is not null and end_time > due_time));
