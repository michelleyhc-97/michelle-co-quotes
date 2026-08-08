// Server-only — TELEGRAM_BOT_TOKEN must never reach the browser. Used only
// by the webhook route (app/api/telegram/webhook/route.js).

import { formatCurrency } from "@/lib/quoteUtils";

const CATEGORY_LABELS = { service: "Part 1 — Services", rights: "Part 2 — Usage Rights" };
const QUANTITY_OPTIONS = [1, 2, 3, 5, 10];

async function callTelegram(method, body) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error(`TELEGRAM_BOT_TOKEN is not set — can't call ${method}.`);
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`Telegram ${method} failed:`, await res.text().catch(() => res.statusText));
  }
}

/** Sends a plain-text message to a Telegram chat, optionally with an
 * inline keyboard attached (see the build*Keyboard helpers below). */
export async function sendTelegramMessage(chatId, text, keyboard) {
  await callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
  });
}

/** Clears the "loading" spinner Telegram shows on a tapped inline button.
 * Cosmetic, but should be called on every callback_query. */
export async function answerCallbackQuery(callbackQueryId) {
  await callTelegram("answerCallbackQuery", { callback_query_id: callbackQueryId });
}

/** Parses "ProductName, 2" / "ProductName x2" / "ProductName 2" into
 * { productName, quantity }, or null if the message doesn't end in a
 * number. Deliberately simple — one expected shape (name, then a
 * quantity), not a general-purpose order parser. This free-text path
 * stays available alongside the button flow for anyone who already knows
 * the format. */
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

/** Lists the current catalog, cheapest first, for the free-text fallback
 * path — built fresh from the products table every time rather than
 * hardcoded, so it never goes stale. */
export function buildUsageMessage(products) {
  const intro = "Hi! To order, tap a category below, or type a service name and quantity, like:\n\nPaid Social Boost Management, 2";
  if (!products || products.length === 0) return `${intro}\n\nI'll reply with the price and total.`;

  const catalog = [...products]
    .sort((a, b) => a.unit_price - b.unit_price)
    .map((p) => `• ${p.name} — ${formatCurrency(Number(p.unit_price))}`)
    .join("\n");
  return `${intro}\n\nHere's what we offer:\n${catalog}`;
}

/** Step 1 of the button flow: Services / Usage Rights / Others. */
export function buildCategoryKeyboard() {
  return [
    [{ text: `🎨 ${CATEGORY_LABELS.service}`, callback_data: "cat:service" }],
    [{ text: `📄 ${CATEGORY_LABELS.rights}`, callback_data: "cat:rights" }],
    [{ text: "❓ Others", callback_data: "cat:others" }],
  ];
}

/** Step 2: every product in the chosen category, one per row, plus a way
 * back to the category picker. */
export function buildItemKeyboard(products, categoryKey) {
  const rows = products
    .filter((p) => (p.category || "service") === categoryKey)
    .sort((a, b) => a.unit_price - b.unit_price)
    .map((p) => [{ text: `${p.name} — ${formatCurrency(Number(p.unit_price))}`, callback_data: `item:${p.id}` }]);
  rows.push([{ text: "◀️ Back", callback_data: "cat:back" }]);
  return rows;
}

/** Step 3: quick quantity picks for the chosen product. Encodes the
 * product id right in callback_data, so no server-side session/state is
 * needed to remember what was selected between steps. */
export function buildQuantityKeyboard(productId) {
  return [QUANTITY_OPTIONS.map((n) => ({ text: String(n), callback_data: `qty:${productId}:${n}` }))];
}

export function categoryLabel(categoryKey) {
  return CATEGORY_LABELS[categoryKey] || categoryKey;
}

export const NOT_FOUND_MESSAGE = "Product not found, please contact customer service";
export const OTHERS_MESSAGE =
  "For anything not listed here, please contact our customer service team directly and we'll be happy to help.";
