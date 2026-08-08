// Plain (non-"use client") utilities safe to import from anywhere —
// Server Components, Route Handlers, or client components.

export const IDENTITY = {
  companyName: "Michelle & Co. Creatives",
  tagline: "Creative Content & Copywriting Studio",
  email: "michelle@gintell.com",
};

export function quoteTotal(quote) {
  return quote.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
}
