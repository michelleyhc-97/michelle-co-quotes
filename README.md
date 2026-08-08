# Quotation System — Michelle & Co. Creatives

Internal tool for managing customers and quotes. Built as a separate app
from the public marketing site (`../website`) since it's for you and your
sales team, not the public.

## Getting started

```bash
npm install
npm run dev -- -p 3001
```

Open [http://localhost:3001](http://localhost:3001) (port 3001 so it can
run alongside the marketing site's dev server on 3000). You'll land on a
login screen — see **Authentication** below for the demo accounts.

## Current status: real, persistent data

Customers, quotes, and invoices are stored in a real Postgres database
(Supabase) — adding, editing, or deleting something and refreshing the page
keeps it. Auth, PDF generation, and email delivery are all real too.
Nothing in this app is mock data anymore.

### A note on where the schema came from

When connecting Supabase, the project already had `customers`, `quotes`,
and `quote_items` tables — with real seed data (7 customers, 14 quotes) —
that don't quite match the shape this README originally sketched (e.g.
`company_name`/`contact_person` instead of `company`/`contact`,
`quote_number` instead of `number`, plus invoicing fields — `tax_rate`,
`subtotal`, `valid_until`, `notes` — the app originally had no UI for).
Rather than drop and recreate those tables, **the app was adapted to the
existing schema** — see [`lib/dataMappers.js`](lib/dataMappers.js), which translates
between the database's column names and the camelCase shape every page
component already expected. No page component needed to change.

All of `tax_rate`, `subtotal`, `valid_until`, and `notes` now have inputs in
the Create/Edit Quote form — see below.

### Currency

All amounts display as Malaysian Ringgit (`RM 1,000.00`), via a single
[`formatCurrency`](lib/quoteUtils.js) helper used everywhere money is shown
(dashboard, quote list, quote form, public quote page, PDF).

### Tax: SST + Service Charge

Create/Edit Quote now has **Service Charge %** and **SST %** fields
(defaulting to Malaysia's standard 10% and 6%), with a live breakdown —
Subtotal → Service Charge → SST → Grand Total — shown on the form, the
customer's public quote page, and the PDF. Both rates are editable per
quote (e.g. set either to 0 for tax-exempt work).

The math follows the standard Malaysian invoicing order: service charge is
applied to the subtotal first, then SST is applied on top of
`(subtotal + service charge)` — this lives in one place,
[`computeQuoteTotals`](lib/quoteUtils.js), so the form's live preview and
the API's saved total can never drift apart. `service_charge_rate` is a new
column (migration
[`20260808040000_service_charge.sql`](supabase/migrations/20260808040000_service_charge.sql));
`tax_rate` already existed.

### Valid Until & Notes

Create/Edit Quote also has **Valid Until** (an optional expiry date) and
**Notes** (an optional free-text box — payment terms, scope assumptions,
etc.). Both were pre-existing columns with no UI before; now they show on
the form, the customer's public quote page (right under the quote number,
and above the action buttons), and the PDF.

### Invoices

A real Invoice concept, separate from Quotes:

- From an Accepted quote's edit page, **Create Invoice** snapshots that
  quote's customer, line items, and total into a new invoice with its own
  auto-generated number (`INV-2026-0XX`). Editing the original quote
  afterwards never changes an invoice that's already been issued — see
  [`lib/invoiceQueries.js`](lib/invoiceQueries.js).
- `/invoices` lists them, filterable by status (**Unpaid** / **Paid** /
  **Overdue** / **Cancelled**, changed inline — this app doesn't detect
  "overdue" automatically, you set it).
- `/invoices/[id]` lets you set a **Due Date** and **Notes**, download the
  PDF, email it to the customer, copy their public view link, or delete it
  (boss-only). Line items themselves are frozen — to bill something
  different, create a fresh invoice from an updated quote.
- `/inv/[id]` is the customer's public, no-login view — same pattern as
  `/q/[id]`, but view-only (no accept/reject; a customer doesn't self-report
  payment) and it shows **Payment Details** instead of quote actions.

**Payment Details**, shown on the invoice PDF and both invoice pages,
covers every method you specified — Online Transfer, DuitNow QR,
Debit/Credit Card, an in-house Installment/PayLater plan (tenure computed
per-invoice: <RM3,000 → 3 months, RM3,000–RM5,000 → 6 months,
RM5,000–RM20,000 → 12 months, not offered above that), Atome/GrabPayLater/
SPayLater, and Auto-Debit. All defined once in
[`paymentMethodDetails()`](lib/quoteUtils.js) so the PDF and both pages can
never say something different.

**⚠️ Bank details are placeholders.** `BANK_DETAILS` in
[`lib/quoteUtils.js`](lib/quoteUtils.js) has obvious placeholder text
(`[Add your bank name]`, etc.) — nothing fabricated to look real. Fill in
your actual bank name, account holder name, account number, and
DuitNow-registered phone number/ID there before sending a real invoice to
a customer.

## Pages

- `/` — Dashboard: quotes this month, closed, pending, status breakdown,
  recent quotes
- `/customers` — Customer list with search, Add/Edit (modal); Delete is
  boss-only
- `/quotes` — All quotes, filterable by status (including **Amendment
  Requested**), with inline status changes, View, Edit, and boss-only Delete
- `/quotes/new` — Pick a customer, add line items (qty × unit price), see
  the grand total update live, save as Draft or Sent
- `/quotes/[id]/edit` — Edit a quote's customer/items/status, download its
  PDF, email it to the customer, copy the customer's view link, or delete it
  (boss-only)
- `/invoices` — All invoices, filterable by status, with inline status
  changes, View, Edit, and boss-only Delete
- `/invoices/[id]` — Set due date/notes, download PDF, email it, copy the
  customer's view link, or delete it (boss-only)
- `/login` — Sign in (see **Authentication**)
- `/q/[id]` — **Public, no login required.** The page a customer actually
  sees when you send them a quote: view details, download the PDF, and
  Accept / Reject / Request Changes
- `/inv/[id]` — **Public, no login required.** The page a customer sees
  when you send them an invoice: view details, payment methods, and
  download the PDF

Deleting a customer that has existing quotes is allowed — the database sets
those quotes' `customer_id` to null (`ON DELETE SET NULL`), so they stay on
record but show a blank customer.

## Customer amendment requests

A customer can ask for changes instead of just accepting or rejecting:

1. You send a quote (via **Email to Customer** on the edit page, or by
   copying its `/q/[id]` link).
2. The customer opens that link — no account needed — and can **Accept**,
   **Reject**, or **Request Changes** (a required text box asking what
   they'd like different and why).
3. Requesting changes sets the quote's status to **Amendment Requested**,
   stores their reason in the database, and emails your team.
4. Back in `/quotes` or the quote's edit page, you'll see the reason (hover
   the "why?" link, or the full callout on the edit page), make your
   changes, and move the status forward again once it's resent.

This is fully real now — a customer's action on `/q/[id]` is visible to
everyone on your team immediately, from any device, because it's a real
database write, not browser-local state.

## Authentication

Two demo accounts, since this is for you and your sales team:

| Username | Password          | Role  |
| -------- | ------------------ | ----- |
| `boss`   | `boss-demo-2026`   | boss  |
| `sales`  | `sales-demo-2026`  | sales |

Override either password via `BOSS_PASSWORD` / `SALES_PASSWORD` in
`.env.local`. Sessions are signed cookies (7-day expiry) — this part
intentionally still doesn't use a database; see **Next steps**.

**Role difference:** only the `boss` role can delete customers or quotes.
Both roles can view, create, and edit everything.

`/login`, `/q/[id]`, `/inv/[id]`, `/api/login`, `/api/notify-amendment`, and
`/api/public/*` are the only routes that don't require a session — enforced
in [`proxy.js`](proxy.js).

## Database (Supabase)

- **Project:** "michelle@gintell.com's Project" (ref `aaxcvrxblpfokltmkqbr`)
- **Tables:** `customers`, `quotes`, `quote_items`, `invoices`,
  `invoice_items` — see [`supabase/migrations/`](supabase/migrations) for
  the exact changes made (the base schema already existed for the first
  three; migrations here are additive: widening the status check constraint
  to include "Amendment Requested", adding
  `amendment_reason`/`amendment_requested_at` columns, giving `quote_number`
  a sequence-backed default, granting `service_role` table access it was
  missing, adding `service_charge_rate`, and creating `invoices`/
  `invoice_items` from scratch with their own `invoice_number_seq`)
- **Access pattern:** the browser never talks to Supabase directly. Every
  table has Row Level Security enabled; the app's own API routes (protected
  by the session-cookie auth above) use the `service_role` key server-side
  ([`lib/supabaseAdmin.js`](lib/supabaseAdmin.js)), which bypasses RLS by
  design. The public `/q/[id]` and `/inv/[id]` pages hit narrow
  `/api/public/quotes/[id]` and `/api/public/invoices/[id]` endpoints that
  can only read (and, for quotes, respond to) one record at a time — no way
  to list customers or other quotes/invoices.
- **Local CLI access:** `SUPABASE_ACCESS_TOKEN` (a personal access token,
  not committed anywhere) plus `npx supabase db query --linked "<sql>"` —
  this project's Supabase CLI login uses the Management API rather than a
  direct Postgres connection, so no database password was ever needed.

### Env vars

```
SUPABASE_URL=https://aaxcvrxblpfokltmkqbr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role JWT — server-only, never exposed to the browser>
```

Both are already in `.env.local` (gitignored) and set as Vercel Production
Environment Variables.

## PDF export & emailing quotes/invoices

- **Download PDF** (on the edit page, and on the customer's public page)
  generates a real PDF client-side via `@react-pdf/renderer` — company
  info, customer info, line items, grand total, and (for quotes) the
  customer's amendment reason, or (for invoices) due date and payment
  details.
- **Email to Customer** (edit page) generates that same PDF, then sends it
  as an attachment via [Resend](https://resend.com), along with a link to
  the customer's `/q/[id]` or `/inv/[id]` page. Without `RESEND_API_KEY`
  set, it just logs to the server console instead — same fallback pattern
  as the marketing site's contact form.

To turn on real delivery: sign up at [resend.com](https://resend.com) with
`michelle@gintell.com`, grab an API key from
[resend.com/api-keys](https://resend.com/api-keys), and add it to
`.env.local` as `RESEND_API_KEY=re_...` (restart `npm run dev` after). Add
the same key to Vercel's Environment Variables if/when you want this live.

## Next steps

1. **Fill in real bank/DuitNow details** in `BANK_DETAILS`
   ([`lib/quoteUtils.js`](lib/quoteUtils.js)) — the invoice payment section
   currently shows obvious placeholders, by design, until you do.
2. **Real user accounts** — replace the two hardcoded demo logins with a
   real accounts table (now easy — the database is already here), so each
   sales rep has their own login instead of a shared "sales" account.
3. **Finer permissions** — e.g. sales reps only seeing customers/quotes
   they own.
4. **Turn on Resend** for real email delivery (see above) — currently
   console-log-only until you add an API key.
5. **Automatic "Overdue" status** — right now an invoice past its due date
   doesn't flip to Overdue on its own; you'd set it manually, or a small
   scheduled job could do it.
6. **Actual card/BNPL payment links** — Debit/Credit Card and
   Atome/GrabPayLater/SPayLater are currently informational text ("contact
   us…"); wiring up a real payment gateway would let a customer pay
   directly from `/inv/[id]` instead.

## Tech

- Next.js 16 (App Router), with an `(app)` route group for the
  authenticated dashboard and standalone `/login` + `/q/[id]` pages outside it
- Tailwind CSS v4, Inter font
- Supabase (Postgres) via `@supabase/supabase-js`, server-only
- `@react-pdf/renderer` for PDF generation (works entirely client-side)
- [Resend](https://resend.com) for email delivery
- Signed-cookie auth (same pattern as the marketing site's CMS)
