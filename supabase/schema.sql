-- ══════════════════════════════════════════════════════════
-- 엔앤씨 결제 시스템 — Supabase DB 스키마
-- Supabase 대시보드 → SQL Editor에서 실행하세요
-- ══════════════════════════════════════════════════════════

-- UUID 확장 활성화
create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────
-- 1. 고객 (customers)
-- ──────────────────────────────────────────
create table if not exists customers (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  name        text        not null,
  phone       text,
  org         text,                    -- 기관명 (어린이집, 유치원 등)
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────────
-- 2. 플랜 (plans) — 초기 데이터 포함
-- ──────────────────────────────────────────
create table if not exists plans (
  id          text primary key,        -- 'sub-basic', 'sub-standard', ...
  name        text        not null,
  type        text        not null,    -- 'subscription' | 'onetime'
  amount      integer     not null,    -- 원 단위
  interval    text,                    -- 'month' | null (onetime)
  features    jsonb,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- 플랜 기본 데이터 삽입
insert into plans (id, name, type, amount, interval) values
  ('sub-basic',       '베이직 구독',          'subscription', 49000,  'month'),
  ('sub-standard',    '스탠다드 구독',        'subscription', 89000,  'month'),
  ('sub-premium',     '프리미엄 구독',        'subscription', 149000, 'month'),
  ('ot-wash',         '방문 세척 서비스',     'onetime',       50000,  null),
  ('ot-premium-wash', '프리미엄 세척 패키지', 'onetime',      120000,  null)
on conflict (id) do nothing;

-- ──────────────────────────────────────────
-- 3. 빌링키 (billing_keys) — 구독 자동결제용
-- ──────────────────────────────────────────
create table if not exists billing_keys (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid references customers(id) on delete cascade,
  billing_key  text        not null,   -- 포트원 발급 빌링키
  card_name    text,                   -- 카드사 이름
  card_number  text,                   -- 마스킹된 카드 번호 (예: **** **** **** 1234)
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- ──────────────────────────────────────────
-- 4. 구독 (subscriptions)
-- ──────────────────────────────────────────
create table if not exists subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  customer_id        uuid references customers(id) on delete cascade,
  plan_id            text references plans(id),
  billing_key_id     uuid references billing_keys(id),
  status             text default 'active',   -- 'active' | 'paused' | 'cancelled' | 'past_due'
  start_date         date default current_date,
  next_billing_date  date,
  cancelled_at       timestamptz,
  created_at         timestamptz default now()
);

-- ──────────────────────────────────────────
-- 5. 결제 내역 (payments)
-- ──────────────────────────────────────────
create table if not exists payments (
  id               uuid primary key default gen_random_uuid(),
  portone_id       text unique not null,     -- 포트원 payment_id
  customer_id      uuid references customers(id),
  subscription_id  uuid references subscriptions(id),
  plan_id          text references plans(id),
  amount           integer     not null,
  status           text        not null,     -- 'paid' | 'failed' | 'cancelled'
  pay_method       text,                     -- 결제 수단
  paid_at          timestamptz,
  fail_reason      text,
  created_at       timestamptz default now()
);

-- ──────────────────────────────────────────
-- 인덱스
-- ──────────────────────────────────────────
create index if not exists idx_customers_email         on customers(email);
create index if not exists idx_subscriptions_customer  on subscriptions(customer_id);
create index if not exists idx_subscriptions_status    on subscriptions(status);
create index if not exists idx_subscriptions_billing   on subscriptions(next_billing_date) where status = 'active';
create index if not exists idx_payments_portone_id     on payments(portone_id);
create index if not exists idx_payments_customer       on payments(customer_id);

-- ──────────────────────────────────────────
-- Row Level Security (RLS)
-- ──────────────────────────────────────────
-- Edge Functions는 service_role key를 사용하므로 RLS 우회 가능
-- 클라이언트에서 직접 읽는 것은 막습니다
alter table customers    enable row level security;
alter table billing_keys enable row level security;
alter table subscriptions enable row level security;
alter table payments      enable row level security;
alter table plans         enable row level security;

-- plans는 누구나 읽기 가능
create policy "plans_public_read" on plans
  for select using (true);

-- 나머지 테이블은 Edge Function(service_role)만 접근
-- (anon key로는 접근 불가 — 프론트에서 직접 읽기 차단)
