// Plain (non-"use client") utilities safe to import from anywhere —
// Server Components, Route Handlers, or client components.

export const IDENTITY = {
  companyName: "Michelle & Co. Creatives",
  tagline: "Creative Content & Copywriting Studio",
  email: "michelle@gintell.com",
};

// Prefers the database's stored `total` (authoritative — some pre-existing
// quotes have tax applied, which a naive item sum would under-report).
// Falls back to summing items for any quote object that doesn't have a
// `total` yet.
export function quoteTotal(quote) {
  if (typeof quote.total === "number") return quote.total;
  return quote.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
}
