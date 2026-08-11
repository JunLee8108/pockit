-- ============================================================
-- 고정지출 기능 제거 (2026-08-11)
-- 적용 완료: Supabase 프로젝트 Pockit
--
-- Plaid 자동 동기화 도입으로 고정지출 기능을 제거한다.
-- (추후 필요 시 Plaid /transactions/recurring/get 기반으로 재설계)
-- ============================================================

-- transactions.fixed_expense_id 컬럼 제거 (관련 인덱스는 자동 삭제)
alter table public.transactions
  drop column if exists fixed_expense_id;

-- fixed_expenses 테이블 제거 (RLS 정책, 트리거, 인덱스 포함)
drop table if exists public.fixed_expenses;
