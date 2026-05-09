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
| `created_at` | timestamptz | now() | 생성일 |
| `updated_at` | timestamptz | now() | 수정일 (자동) |

**RLS**: 본인만 CRUD  
**인덱스**: `user_id`, `is_active`

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
| `fixed_expense_id` | uuid | — | `fixed_expenses(id)` FK (on delete set null) |
| `memo` | text | — | 메모 |
| `created_at` | timestamptz | now() | 생성일 |
| `updated_at` | timestamptz | now() | 수정일 (자동) |

**RLS**: 본인만 CRUD  
**인덱스**: `user_id`, `account_id`, `category_id`, `date DESC`, `type`, `fixed_expense_id`

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

### 9. `fixed_expenses` — 고정지출

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `id` | uuid **PK** | gen_random_uuid() | — |
| `user_id` | uuid | — | `auth.users(id)` FK |
| `name` | text | — | 지출명 (넷플릭스, 월세 등) |
| `amount` | bigint | — | 금액 (minor unit) |
| `currency` | text | 'USD' | `currencies(code)` FK |
| `category_id` | uuid | — | `categories(id)` FK (on delete set null) |
| `account_id` | uuid | — | `accounts(id)` FK (on delete set null) |
| `billing_day` | int | 1 | 결제일 (1-31) |
| `is_variable` | boolean | false | 변동 금액 여부 (true면 자동 생성 안 함, 수동 등록) |
| `memo` | text | — | 메모 |
| `is_active` | boolean | true | 활성 여부 |
| `created_at` | timestamptz | now() | 생성일 |
| `updated_at` | timestamptz | now() | 수정일 (자동) |

**RLS**: 본인만 CRUD  
**인덱스**: `user_id`, `(user_id, is_active)`

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
