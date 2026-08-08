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

Customers and quotes are stored in a real Postgres database (Supabase) —
adding, editing, or deleting something and refreshing the page keeps it.
Auth, PDF generation, and email delivery are all real too. Nothing in this
app is mock data anymore.

### A note on where the schema came from

When connecting Supabase, the project already had `customers`, `quotes`,
and `quote_items` tables — with real seed data (7 customers, 14 quotes) —
that don't quite match the shape this README originally sketched (e.g.
`company_name`/`contact_person` instead of `company`/`contact`,
`quote_number` instead of `number`, plus invoicing fields this app doesn't
have UI for yet: `tax_rate`, `subtotal`, `valid_until`, `notes`). Rather than
drop and recreate those tables, **the app was adapted to the existing
schema** — see [`lib/dataMappers.js`](lib/dataMappers.js), which translates
between the database's column names and the camelCase shape every page
component already expected. No page component needed to change.

Two consequences worth knowing:

- **Tax is preserved, but not editable.** Some existing quotes have a
  `tax_rate` applied (their stored `total` is higher than a plain sum of
  their line items — e.g. Malaysia's 6% SST). Editing such a quote's items
  recomputes the subtotal and re-applies whatever tax_rate it already had,
  so you won't silently lose that. New quotes created in this app default
  to 0% tax, since there's no UI for setting it yet.
- **`valid_until` and `notes`** exist on some rows but aren't shown or
  editable anywhere in the UI yet.

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
- `/login` — Sign in (see **Authentication**)
- `/q/[id]` — **Public, no login required.** The page a customer actually
  sees when you send them a quote: view details, download the PDF, and
  Accept / Reject / Request Changes

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

`/login`, `/q/[id]`, `/api/login`, `/api/notify-amendment`, and
`/api/public/*` are the only routes that don't require a session — enforced
in [`proxy.js`](proxy.js).

## Database (Supabase)

- **Project:** "michelle@gintell.com's Project" (ref `aaxcvrxblpfokltmkqbr`)
- **Tables:** `customers`, `quotes`, `quote_items` — see
  [`supabase/migrations/`](supabase/migrations) for the exact changes made
  (the base schema already existed; migrations here are additive: widening
  the status check constraint to include "Amendment Requested", adding
  `amendment_reason`/`amendment_requested_at` columns, giving `quote_number`
  a sequence-backed default, and granting `service_role` table access it
  was missing)
- **Access pattern:** the browser never talks to Supabase directly. Every
  table has Row Level Security enabled; the app's own API routes (protected
  by the session-cookie auth above) use the `service_role` key server-side
  ([`lib/supabaseAdmin.js`](lib/supabaseAdmin.js)), which bypasses RLS by
  design. The public `/q/[id]` page hits a narrow `/api/public/quotes/[id]`
  endpoint that can only read/act on one quote at a time — it has no way to
  list customers or other quotes.
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

## PDF export & emailing quotes

- **Download PDF** (on the edit page, and on the customer's public page)
  generates a real PDF client-side via `@react-pdf/renderer` — company
  info, customer info, line items, grand total, and (if applicable) the
  customer's amendment reason.
- **Email to Customer** (edit page) generates that same PDF, then sends it
  as an attachment via [Resend](https://resend.com), along with a link to
  the customer's `/q/[id]` page. Without `RESEND_API_KEY` set, it just logs
  to the server console instead — same fallback pattern as the marketing
  site's contact form.

To turn on real delivery: sign up at [resend.com](https://resend.com) with
`michelle@gintell.com`, grab an API key from
[resend.com/api-keys](https://resend.com/api-keys), and add it to
`.env.local` as `RESEND_API_KEY=re_...` (restart `npm run dev` after). Add
the same key to Vercel's Environment Variables if/when you want this live.

## Next steps

1. **Real user accounts** — replace the two hardcoded demo logins with a
   real accounts table (now easy — the database is already here), so each
   sales rep has their own login instead of a shared "sales" account.
2. **Finer permissions** — e.g. sales reps only seeing customers/quotes
   they own.
3. **Tax / valid-until / notes UI** — the database already has columns for
   these (see note above); they just don't have inputs in the Create/Edit
   Quote form yet.
4. **Turn on Resend** for real email delivery (see above) — currently
   console-log-only until you add an API key.

## Tech

- Next.js 16 (App Router), with an `(app)` route group for the
  authenticated dashboard and standalone `/login` + `/q/[id]` pages outside it
- Tailwind CSS v4, Inter font
- Supabase (Postgres) via `@supabase/supabase-js`, server-only
- `@react-pdf/renderer` for PDF generation (works entirely client-side)
- [Resend](https://resend.com) for email delivery
- Signed-cookie auth (same pattern as the marketing site's CMS)
