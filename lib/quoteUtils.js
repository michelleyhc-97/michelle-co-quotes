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

// ---------------------------------------------------------------------------
// Invoice payment details
//
// PLACEHOLDER VALUES — fill these in with the real bank/DuitNow details
// before sending an invoice to an actual customer. Nothing here is
// fabricated to look real; every field below is an obvious placeholder on
// purpose.
// ---------------------------------------------------------------------------
export const BANK_DETAILS = {
  bankName: "[Add your bank name]",
  accountName: "[Add the account holder name]",
  accountNumber: "[Add the account number]",
  duitNowId: "[Add the DuitNow-registered phone number or ID]",
};

/** In-house installment plan tenure, tiered by invoice total (as specified):
 * under RM3,000 → up to 3 months; RM3,000–RM5,000 → up to 6 months;
 * RM5,000–RM20,000 → up to 12 months. Not offered above the RM20,000 cap. */
export function installmentPlanFor(total) {
  if (!(total > 0) || total > 20000) return null;
  if (total < 3000) return { months: 3 };
  if (total < 5000) return { months: 6 };
  return { months: 12 };
}

/** The full list of ways a customer can pay an invoice, with per-invoice
 * detail (e.g. the installment tenure they actually qualify for). Shared by
 * the invoice PDF and both the internal and public invoice pages, so the
 * wording can never drift between them. */
export function paymentMethodDetails(total) {
  const plan = installmentPlanFor(total);
  return [
    {
      label: "Online Transfer",
      detail: `${BANK_DETAILS.bankName} · ${BANK_DETAILS.accountName} · ${BANK_DETAILS.accountNumber}`,
    },
    {
      label: "DuitNow QR",
      detail: `Scan via your banking app, or transfer to DuitNow ID ${BANK_DETAILS.duitNowId}.`,
    },
    {
      label: "Debit / Credit Card",
      detail: "Contact us for a card payment link or in-person terminal.",
    },
    {
      label: "Installment / PayLater Plan",
      detail: plan
        ? `This invoice qualifies for up to ${plan.months} months (under RM3,000 → 3 months, RM3,000–RM5,000 → 6 months, RM5,000–RM20,000 → 12 months).`
        : "Not offered above RM20,000 — contact us to arrange a payment schedule.",
    },
    {
      label: "Atome / GrabPayLater / SPayLater",
      detail: "Pay via any of these apps at checkout, subject to their own limits.",
    },
    {
      label: "Auto-Debit",
      detail: "Available for recurring or retainer arrangements — contact us to set this up.",
    },
  ];
}
