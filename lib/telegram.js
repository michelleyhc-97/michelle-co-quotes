// Server-only — TELEGRAM_BOT_TOKEN must never reach the browser. Used only
// by the webhook route (app/api/telegram/webhook/route.js).

import { formatCurrency } from "@/lib/quoteUtils";

/** Sends a plain-text message to a Telegram chat via the Bot API. */
export async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is not set — can't reply to Telegram.");
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    console.error("Telegram sendMessage failed:", await res.text().catch(() => res.statusText));
  }
}

/** Parses "ProductName, 2" / "ProductName x2" / "ProductName 2" into
 * { productName, quantity }, or null if the message doesn't end in a
 * number. Deliberately simple — one expected shape (name, then a
 * quantity), not a general-purpose order parser. */
export function parseOrderMessage(text) {
  const trimmed = (text || "").trim();
  // Lazy name capture (not greedy) so multi-digit/decimal quantities are
  // matched whole, rather than a greedy backtrack peeling one character
  // at a time off the end and splitting the number itself.
  const match = trimmed.match(/^(.+?)[\s,]*[x×*]?\s*(\d+(?:\.\d+)?)\s*$/i);
  if (!match) return null;

  const [, rawName, rawQuantity] = match;
  const productName = rawName.trim();
  const quantity = Number(rawQuantity);

  if (!productName || !(quantity > 0)) return null;
  return { productName, quantity };
}

/** Finds a product by name: an exact (case-insensitive) match first, then
 * falls back to a "starts with" match if that's unambiguous (exactly one
 * candidate). Real service names tend to carry a qualifier — "Livestream
 * Hosting (per session)" — that a customer typing from memory won't
 * include, so "Livestream Hosting" should still resolve to it as long as
 * no other product shares that prefix. Two+ matches or zero matches both
 * count as not-found, rather than guessing. */
export async function findProduct(supabase, name) {
  const escaped = name.replace(/[%_]/g, "\\$&");

  const { data: exact, error: exactError } = await supabase
    .from("products")
    .select("*")
    .ilike("name", escaped)
    .maybeSingle();
  if (exactError) throw exactError;
  if (exact) return exact;

  const { data: candidates, error: prefixError } = await supabase
    .from("products")
    .select("*")
    .ilike("name", `${escaped}%`);
  if (prefixError) throw prefixError;
  return candidates.length === 1 ? candidates[0] : null;
}

/** Lists the current catalog, cheapest first, so a customer knows the
 * exact names to type. Built fresh from the products table every time
 * rather than hardcoded, so it never goes stale. */
export function buildUsageMessage(products) {
  const intro = "Hi! To order, send me a service name and quantity, like:\n\nPaid Social Boost Management, 2";
  if (!products || products.length === 0) return `${intro}\n\nI'll reply with the price and total.`;

  const catalog = [...products]
    .sort((a, b) => a.unit_price - b.unit_price)
    .map((p) => `• ${p.name} — ${formatCurrency(Number(p.unit_price))}`)
    .join("\n");
  return `${intro}\n\nHere's what we offer:\n${catalog}`;
}

export const NOT_FOUND_MESSAGE = "Product not found, please contact customer service";
