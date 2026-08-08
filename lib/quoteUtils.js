// Plain (non-"use client") utilities safe to import from anywhere —
// Server Components, Route Handlers, or client components.

export const IDENTITY = {
  companyName: "Michelle & Co. Creatives",
  tagline: "Creative Content & Copywriting Studio",
  email: "michelle@gintell.com",
};

/** Formats an amount as Malaysian Ringgit (e.g. "RM 1,000.00"). Built by
 * hand rather than Intl's `style: "currency"` so the "RM" prefix is
 * guaranteed regardless of which locale currency data a browser/runtime
 * ships — `decimals: 0` for whole-ringgit summaries (dashboard, lists). */
export function formatCurrency(amount, { decimals = 2 } = {}) {
  return `RM ${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

// Prefers the database's stored `total` (authoritative — some pre-existing
// quotes have tax applied, which a naive item sum would under-report).
// Falls back to summing items for any quote object that doesn't have a
// `total` yet.
export function quoteTotal(quote) {
  if (typeof quote.total === "number") return quote.total;
  return quote.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
}

/** Standard Malaysian invoicing convention: the service charge is applied to
 * the subtotal first, then SST is applied on top of (subtotal + service
 * charge) — matching how restaurant/hospitality bills are usually laid out.
 * Shared by the API routes (source of truth, saved to the database) and the
 * quote form's live preview, so the two never drift apart. */
export function computeQuoteTotals(subtotal, taxRatePercent = 0, serviceChargeRatePercent = 0) {
  const round2 = (n) => Math.round(n * 100) / 100;
  const serviceChargeAmount = round2(subtotal * (Number(serviceChargeRatePercent) || 0) / 100);
  const taxableBase = subtotal + serviceChargeAmount;
  const taxAmount = round2(taxableBase * (Number(taxRatePercent) || 0) / 100);
  const total = round2(taxableBase + taxAmount);
  return { subtotal: round2(subtotal), serviceChargeAmount, taxAmount, total };
}
