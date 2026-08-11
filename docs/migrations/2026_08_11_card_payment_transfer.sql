-- ============================================================
-- 카드 대금 결제 → 이체 소급 정리 (2026-08-11)
-- 적용 완료: Supabase 프로젝트 Pockit (373건 변환)
--
-- 신용카드 대금 결제는 내 계좌 간 이동이므로 수입/지출이 아닌
-- 이체(transfer)로 분류한다. 이후 동기화부터는 Edge Function이
-- LOAN_PAYMENTS_CREDIT_CARD_PAYMENT (양쪽 거래) 및
-- 신용카드 계좌의 TRANSFER_IN 입금을 transfer로 저장한다.
-- ============================================================

update public.transactions
set type = 'transfer', category_id = null
where plaid_category = 'LOAN_PAYMENTS_CREDIT_CARD_PAYMENT'
  and type <> 'transfer';
