# Pockit DB Schema

Supabase (PostgreSQL) 기반 데이터베이스 스키마 문서

---

## 공통

### `update_updated_at()` 트리거 함수

모든 테이블의 `updated_at` 컬럼을 자동 갱신한다.

```sql
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

---

## 테이블

### 1. `currencies` — 통화 참조

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `code` | text **PK** | — | ISO 4217 코드 (USD, KRW 등) |
| `name` | text | — | 통화명 |
| `symbol` | text | — | 기호 ($, ₩ 등) |
| `decimal_places` | int2 | 2 | 소수점 자릿수 |
| `symbol_position` | text | 'before' | 'before' \| 'after' |
| `locale` | text | 'en-US' | 로케일 |

**RLS**: 모든 사용자 조회 허용 (`using (true)`)

---

### 2. `profiles` — 사용자 프로필

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `id` | uuid **PK** | — | `auth.users(id)` FK |
| `email` | text | — | 이메일 |
| `display_name` | text | — | 표시 이름 |
| `avatar_url` | text | — | 아바타 URL |
| `default_currency` | text | 'USD' | `currencies(code)` FK |
| `locale` | text | 'en' | 언어 설정 |
| `timezone` | text | 'America/Chicago' | 타임존 |
| `created_at` | timestamptz | now() | 생성일 |
| `updated_at` | timestamptz | now() | 수정일 (자동) |

**RLS**: 본인만 조회/수정  
**트리거**: `handle_new_user()` — 회원가입 시 자동 생성

---

### 3. `accounts` — 계좌

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `id` | uuid **PK** | gen_random_uuid() | — |
| `user_id` | uuid | — | `auth.users(id)` FK |
| `name` | text | — | 계좌명 |
| `institution` | text | '' | 금융기관 |
| `account_type` | text | 'checking' | checking, savings, credit_card, cash, investment |
| `account_number` | text | — | 계좌번호 |
| `currency` | text | 'USD' | `currencies(code)` FK |
| `balance` | bigint | 0 | 잔액 (minor unit) |
| `color` | text | '#6DD4B4' | 색상 |
| `icon` | text | '🏦' | 아이콘 |
| `is_active` | boolean | true | 활성 여부 |
| `sort_order` | int | 0 | 정렬 순서 |
| `memo` | text | — | 메모 |
| `plaid_item_id` | uuid | — | `plaid_items(id)` FK (on delete set null) — Plaid 연결 계좌 |
| `plaid_account_id` | text | — | Plaid account_id (unique) |
| `available_balance` | bigint | — | Plaid available 잔액 (minor unit) |
| `created_at` | timestamptz | now() | 생성일 |
| `updated_at` | timestamptz | now() | 수정일 (자동) |

**RLS**: 본인만 CRUD  
**인덱스**: `user_id`, `is_active`, `plaid_item_id` (partial)

> `plaid_item_id`가 있는 계좌는 Plaid 동기화가 잔액을 관리한다.
> 클라이언트의 수동 잔액 증감(`adjustBalance`) 로직은 이 계좌를 건너뛰어야 한다.

---

### 4. `categories` — 카테고리

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `id` | uuid **PK** | gen_random_uuid() | — |
| `user_id` | uuid | — | `auth.users(id)` FK |
| `name` | text | — | 카테고리명 |
| `icon` | text | '📁' | 아이콘 |
| `color` | text | '#6DD4B4' | 색상 |
| `type` | text | 'expense' | income \| expense |
| `sort_order` | int | 0 | 정렬 순서 |
| `is_default` | boolean | false | 기본 카테고리 여부 |
| `created_at` | timestamptz | now() | 생성일 |
| `updated_at` | timestamptz | now() | 수정일 (자동) |

**RLS**: 본인만 CRUD  
**인덱스**: `user_id`

---

### 5. `transactions` — 거래내역

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `id` | uuid **PK** | gen_random_uuid() | — |
| `user_id` | uuid | — | `auth.users(id)` FK |
| `account_id` | uuid | — | `accounts(id)` FK (on delete cascade) |
| `category_id` | uuid | — | `categories(id)` FK (on delete set null) |
| `type` | text | — | income \| expense \| transfer |
| `amount` | bigint | — | 금액 (minor unit) |
| `currency` | text | 'USD' | `currencies(code)` FK |
| `description` | text | '' | 설명 |
| `date` | date | current_date | 거래일 |
| `to_account_id` | uuid | — | `accounts(id)` FK (이체 대상, on delete set null) |
| `memo` | text | — | 메모 |
| `plaid_transaction_id` | text | — | Plaid transaction_id (unique, 동기화 upsert 키) |
| `pending_plaid_transaction_id` | text | — | pending → posted 전환 시 원본 pending 거래의 Plaid ID |
| `is_pending` | boolean | false | Plaid 승인 대기 거래 여부 |
| `source` | text | 'manual' | manual \| plaid |
| `merchant_name` | text | — | Plaid 가맹점명 |
| `plaid_category` | text | — | Plaid personal_finance_category (detailed) |
| `created_at` | timestamptz | now() | 생성일 |
| `updated_at` | timestamptz | now() | 수정일 (자동) |

**RLS**: 본인만 CRUD  
**인덱스**: `user_id`, `account_id`, `category_id`, `date DESC`, `type`, `is_pending` (partial), `pending_plaid_transaction_id` (partial)

---

### 6. `budgets` — 월별 예산

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `id` | uuid **PK** | gen_random_uuid() | — |
| `user_id` | uuid | — | `auth.users(id)` FK |
| `category_id` | uuid | — | `categories(id)` FK (on delete cascade) |
| `amount` | bigint | — | 예산 금액 (minor unit) |
| `currency` | text | 'USD' | `currencies(code)` FK |
| `year` | int | — | 연도 |
| `month` | int | — | 월 (1-12) |
| `created_at` | timestamptz | now() | 생성일 |
| `updated_at` | timestamptz | now() | 수정일 (자동) |

**RLS**: 본인만 CRUD  
**유니크 인덱스**: `(user_id, category_id, year, month)` — 월별 카테고리당 1건

---

### 7. `task_categories` — 할일 카테고리

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `id` | uuid **PK** | gen_random_uuid() | — |
| `user_id` | uuid | — | `auth.users(id)` FK |
| `name` | text | — | 카테고리명 (업무, 개인, 공부 등) |
| `icon` | text | 'ListTodo' | 아이콘 |
| `color` | text | '#6DD4B4' | 색상 |
| `sort_order` | int | 0 | 정렬 순서 |
| `is_default` | boolean | false | 기본 카테고리 여부 |
| `created_at` | timestamptz | now() | 생성일 |
| `updated_at` | timestamptz | now() | 수정일 (자동) |

**RLS**: 본인만 CRUD
**인덱스**: `user_id`

---

### 8. `tasks` — 할일

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `id` | uuid **PK** | gen_random_uuid() | — |
| `user_id` | uuid | — | `auth.users(id)` FK |
| `title` | text | — | 할일 제목 |
| `description` | text | — | 상세 설명 |
| `due_date` | date | — | 기한 날짜 (nullable) |
| `due_time` | time | — | 기한 시각 (nullable) |
| `priority` | text | 'normal' | low \| normal \| high |
| `status` | text | 'todo' | todo \| done |
| `category_id` | uuid | — | `task_categories(id)` FK (on delete set null) |
| `completed_at` | timestamptz | — | 완료 시각 |
| `sort_order` | int | 0 | 정렬 순서 |
| `created_at` | timestamptz | now() | 생성일 |
| `updated_at` | timestamptz | now() | 수정일 (자동) |

**RLS**: 본인만 CRUD
**인덱스**: `user_id`, `due_date`, `status`, `category_id`

---

### 9. `plaid_items` — Plaid 은행 연결 (Item)

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `id` | uuid **PK** | gen_random_uuid() | — |
| `user_id` | uuid | — | `auth.users(id)` FK (on delete cascade) |
| `item_id` | text | — | Plaid item_id (unique) |
| `access_token` | text | — | Plaid access_token — **서버 전용, 클라이언트 노출 금지** |
| `institution_id` | text | — | Plaid 기관 ID |
| `institution_name` | text | '' | 기관명 |
| `sync_cursor` | text | — | `/transactions/sync` cursor — **서버 전용** |
| `status` | text | 'active' | active \| login_required \| error \| disconnected |
| `error_code` | text | — | 마지막 Plaid 에러 코드 |
| `last_synced_at` | timestamptz | — | 마지막 동기화 시각 |
| `created_at` | timestamptz | now() | 생성일 |
| `updated_at` | timestamptz | now() | 수정일 (자동) |

**RLS**: 본인만 SELECT (쓰기 정책 없음 — Edge Function의 service role 전용)  
**컬럼 권한**: `authenticated`에는 `access_token`, `sync_cursor`를 **제외한** 컬럼만 SELECT 허용.
따라서 클라이언트에서 `select("*")`는 permission denied — 반드시 컬럼을 명시해서 조회할 것:

```js
supabase.from("plaid_items")
  .select("id, institution_id, institution_name, status, error_code, last_synced_at, created_at, updated_at")
```

**인덱스**: `user_id`

---

### 10. `plaid_category_map` — Plaid 카테고리 매핑

Plaid `personal_finance_category`(detailed) → 사용자 `categories` 매핑.
사용자가 Plaid 거래를 재분류하면 저장해 두고 다음 동기화부터 자동 적용(학습).

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `id` | uuid **PK** | gen_random_uuid() | — |
| `user_id` | uuid | — | `auth.users(id)` FK (on delete cascade) |
| `plaid_category` | text | — | Plaid detailed 카테고리 (예: FOOD_AND_DRINK_COFFEE) |
| `category_id` | uuid | — | `categories(id)` FK (on delete cascade) |
| `created_at` | timestamptz | now() | 생성일 |
| `updated_at` | timestamptz | now() | 수정일 (자동) |

**RLS**: 본인만 CRUD  
**유니크**: `(user_id, plaid_category)`  
**인덱스**: `user_id`

---

### 11. `category_rules` — 카테고리 자동분류 키워드 규칙

거래 설명/가맹점명에 키워드가 포함되면 지정 카테고리로 자동 분류.
Plaid 동기화(Edge Function)가 `sort_order` 순으로 첫 매칭을 적용한다.

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `id` | uuid **PK** | gen_random_uuid() | — |
| `user_id` | uuid | — | `auth.users(id)` FK (on delete cascade) |
| `keyword` | text | — | 부분일치 키워드 (대소문자 무시) |
| `category_id` | uuid | — | `categories(id)` FK (on delete cascade) |
| `is_active` | boolean | true | 활성 여부 |
| `sort_order` | int | 0 | 우선순위 (낮을수록 먼저 적용) |
| `created_at` | timestamptz | now() | 생성일 |
| `updated_at` | timestamptz | now() | 수정일 (자동) |

**RLS**: 본인만 CRUD  
**유니크 인덱스**: `(user_id, lower(keyword))`  
**인덱스**: `user_id`

---

## Plaid 데이터 변환 규칙

- **금액**: Plaid는 주 통화 단위 float(`12.34`) → minor unit bigint(`1234`)로 `Math.round(amount * 100)` 변환 (통화의 `decimal_places` 기준)
- **부호**: Plaid는 출금이 양수 → `expense`, 입금(음수) → `income` (amount는 절대값 저장)
- **잔액**: Plaid 연결 계좌는 동기화 시 Plaid의 실제 잔액으로 덮어씀 (클라이언트 증감 금지)
- **pending**: posted 전환 시 `pending_plaid_transaction_id`로 기존 pending 행을 찾아 교체
- **카테고리 우선순위**: 사용자 직접 수정(기존 행 보존) > `category_rules` 키워드 규칙 > `plaid_category_map` detailed > primary > 미분류

---

## RLS 정책 패턴

모든 사용자 데이터 테이블에 동일한 RLS 패턴 적용:

```sql
alter table public.<table> enable row level security;

create policy "<table>_select_own" on public.<table> for select using (auth.uid() = user_id);
create policy "<table>_insert_own" on public.<table> for insert with check (auth.uid() = user_id);
create policy "<table>_update_own" on public.<table> for update using (auth.uid() = user_id);
create policy "<table>_delete_own" on public.<table> for delete using (auth.uid() = user_id);
```

## 금액 저장 규칙

모든 금액은 **minor unit** (최소 통화 단위)으로 저장:
- KRW: 1원 = 1 (decimal_places: 0)
- USD: 1센트 = 1, $1.00 = 100 (decimal_places: 2)
- JPY: 1엔 = 1 (decimal_places: 0)
