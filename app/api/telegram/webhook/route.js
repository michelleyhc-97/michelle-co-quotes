import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatCurrency } from "@/lib/quoteUtils";
import {
  sendTelegramMessage,
  parseOrderMessage,
  findProduct,
  buildUsageMessage,
  NOT_FOUND_MESSAGE,
} from "@/lib/telegram";

// Telegram calls this on every message sent to the bot. Registered once via
// Telegram's setWebhook API (see README) with a secret token that Telegram
// echoes back on every request, so we can tell real Telegram traffic apart
// from a random POST to this URL.
export async function POST(request) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (!secret || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const update = await request.json().catch(() => null);
  const message = update?.message;
  const chatId = message?.chat?.id;
  const text = message?.text;

  // Always 200 back to Telegram even on "nothing to do" — a non-200 makes
  // Telegram retry the same update repeatedly.
  if (!chatId || !text) {
    return Response.json({ ok: true });
  }

  try {
    const supabase = supabaseAdmin();

    if (text.trim().startsWith("/")) {
      const { data: products, error } = await supabase.from("products").select("*");
      if (error) throw error;
      await sendTelegramMessage(chatId, buildUsageMessage(products));
      return Response.json({ ok: true });
    }

    const parsed = parseOrderMessage(text);
    if (!parsed) {
      const { data: products, error } = await supabase.from("products").select("*");
      if (error) throw error;
      await sendTelegramMessage(chatId, buildUsageMessage(products));
      return Response.json({ ok: true });
    }

    const product = await findProduct(supabase, parsed.productName);

    if (!product) {
      await sendTelegramMessage(chatId, NOT_FOUND_MESSAGE);
      return Response.json({ ok: true });
    }

    const unitPrice = Number(product.unit_price);
    const total = Math.round(parsed.quantity * unitPrice * 100) / 100;

    const { error: insertError } = await supabase.from("telegram_orders").insert({
      telegram_chat_id: chatId,
      telegram_username: message.from?.username || message.from?.first_name || null,
      product_name: product.name,
      quantity: parsed.quantity,
      unit_price: unitPrice,
      total,
    });
    if (insertError) throw insertError;

    const reply = [
      "Here's your quote:",
      "",
      `Product: ${product.name}`,
      `Quantity: ${parsed.quantity}`,
      `Unit Price: ${formatCurrency(unitPrice)}`,
      `Total: ${formatCurrency(total)}`,
    ].join("\n");
    await sendTelegramMessage(chatId, reply);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook failed:", err);
    // Still 200 so Telegram doesn't hammer retries over a transient error.
    return Response.json({ ok: true });
  }
}
