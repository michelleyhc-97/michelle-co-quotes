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

## Current status: mock data, but real auth + real PDF/email delivery

Customers and quotes are still seed data in [`lib/store.js`](lib/store.js),
held in memory via React Context (`AppDataProvider`) — nothing is saved to a
database yet, by design. Adding/editing/deleting updates every page live
within your session, but a full page reload resets everything back to the
seed data.

**Login, PDF generation, and email sending are all real**, though — not
mocked. That's a deliberate split: the parts that don't need a database yet
(auth, PDFs, email) are built properly now; the data layer is the one piece
intentionally left as a placeholder until you're ready for it.

## Pages

- `/` — Dashboard: quotes this month, closed, pending, status breakdown,
  recent quotes
- `/customers` — Customer list with Add/Edit (modal); Delete is boss-only
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

Editing/deleting a customer that has existing quotes is allowed — the quotes
stay, they just show a blank customer if you look them up (there's no real
database relationship to enforce yet).

## Customer amendment requests

This is the main new workflow: a customer can ask for changes instead of
just accepting or rejecting.

1. You send a quote (via **Email to Customer** on the edit page, or by
   copying its `/q/[id]` link).
2. The customer opens that link — no account needed — and can **Accept**,
   **Reject**, or **Request Changes** (a required text box asking what
   they'd like different and why).
3. Requesting changes sets the quote's status to **Amendment Requested**,
   stores their reason, and emails your team so you actually find out.
4. Back in `/quotes` or the quote's edit page, you'll see the reason (hover
   the "why?" link, or the full callout on the edit page), make your
   changes, and move the status forward again once it's resent.

**Honest limitation:** because there's no database yet, a customer's action
only updates the browser session that made it. The **email notification is
real** and will reach you regardless — but the in-app status won't show as
updated in *your* browser until there's a shared database both sides can
read from. Once that's added, this becomes fully real-time.

## Authentication

Two demo accounts, since this is for you and your sales team:

| Username | Password         | Role  |
| -------- | ---------------- | ----- |
| `boss`   | `boss-demo-2026` | boss  |
| `sales`  | `sales-demo-2026`| sales |

Override either password via `BOSS_PASSWORD` / `SALES_PASSWORD` in
`.env.local`. Sessions are signed cookies (7-day expiry) — no database
needed for this part, just like the marketing site's CMS login.

**Role difference:** only the `boss` role can delete customers or quotes.
Both roles can view, create, and edit everything. This is a starting point
— if you want finer-grained permissions later (e.g. sales reps only seeing
their own customers), that's a real-database feature.

`/login`, `/q/[id]`, `/api/login`, and `/api/notify-amendment` are the only
routes that don't require a session — enforced in [`proxy.js`](proxy.js).

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
the same key to Vercel's Environment Variables if/when this gets deployed.

## Next steps (when you're ready to make this real)

1. **A real database** — something like Postgres (via Vercel Postgres,
   Supabase, or Neon) to replace `lib/store.js`'s in-memory arrays. This is
   what makes customer actions on `/q/[id]` visible cross-device/session
   instead of just in the browser that made them.
2. **Real user accounts** — replace the two hardcoded demo logins with a
   real accounts table, so each sales rep has their own login instead of a
   shared "sales" account.
3. **Finer permissions** — e.g. sales reps only seeing customers/quotes
   they own, once there's a database to model that relationship.

## Tech

- Next.js 16 (App Router), with an `(app)` route group for the
  authenticated dashboard and standalone `/login` + `/q/[id]` pages outside it
- Tailwind CSS v4, Inter font
- `@react-pdf/renderer` for PDF generation (works entirely client-side)
- [Resend](https://resend.com) for email delivery
- Signed-cookie auth (same pattern as the marketing site's CMS), no
  database or third-party auth provider
