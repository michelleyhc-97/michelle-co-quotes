-- Adds a real Invoice concept, separate from Quotes. An invoice is created
-- from a quote (normally an Accepted one) and snapshots that quote's
-- customer, line items, and totals at that moment — so editing the
-- original quote afterwards never changes an invoice that's already gone
-- out. Mirrors the quotes/quote_items pattern.

create sequence if not exists invoice_number_seq start 1;

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null default (
    'INV-' || extract(year from now())::int::text || '-' ||
    lpad(nextval('invoice_number_seq')::text, 3, '0')
  ),
  quote_id uuid references quotes(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  status text not null default 'Unpaid' check (status in ('Unpaid', 'Paid', 'Overdue', 'Cancelled')),
  subtotal numeric not null default 0,
  tax_rate numeric not null default 0,
  service_charge_rate numeric not null default 0,
  total numeric not null default 0,
  issue_date date not null default current_date,
  due_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table invoices enable row level security;
alter table invoice_items enable row level security;
-- No anon-facing policies, by design — same pattern as customers/quotes/
-- quote_items. All access goes through this app's own API routes using the
-- service_role key server-side, which bypasses RLS.

grant usage, select on invoice_number_seq to service_role;
grant select, insert, update, delete on invoices, invoice_items to service_role;
