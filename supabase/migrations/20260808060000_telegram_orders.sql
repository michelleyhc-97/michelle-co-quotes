-- Telegram ordering bot: a simple price list the bot looks up against, and
-- a record of orders it took. Deliberately separate from
-- customers/quotes/invoices — Telegram customers aren't matched against
-- the existing customer list, this is a lightweight, standalone flow.

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  unit_price numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists telegram_orders (
  id uuid primary key default gen_random_uuid(),
  telegram_chat_id bigint not null,
  telegram_username text,
  product_name text not null,
  quantity numeric not null,
  unit_price numeric not null,
  total numeric not null,
  created_at timestamptz not null default now()
);

alter table products enable row level security;
alter table telegram_orders enable row level security;
-- No anon-facing policies, by design — same pattern as every other table in
-- this app. The webhook route and the Products/Telegram Orders pages all
-- go through this app's own API using the service_role key server-side.

grant select, insert, update, delete on products, telegram_orders to service_role;
