// Server-only — TELEGRAM_BOT_TOKEN must never reach the browser. Used only
// by the webhook route (app/api/telegram/webhook/route.js).

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

export const USAGE_MESSAGE =
  "Hi! To order, send me a product name and quantity, like:\n\nBracelet, 2\n\nI'll reply with the price and total.";

export const NOT_FOUND_MESSAGE = "Product not found, please contact customer service";
