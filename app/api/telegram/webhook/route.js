import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatCurrency } from "@/lib/quoteUtils";
import {
  sendTelegramMessage,
  answerCallbackQuery,
  parseOrderMessage,
  findProduct,
  buildUsageMessage,
  buildCategoryKeyboard,
  buildItemKeyboard,
  buildQuantityKeyboard,
  categoryLabel,
  NOT_FOUND_MESSAGE,
  OTHERS_MESSAGE,
} from "@/lib/telegram";

// Telegram calls this on every message AND every button tap sent to the
// bot. Registered once via Telegram's setWebhook API (see README) with a
// secret token that Telegram echoes back on every request, so we can tell
// real Telegram traffic apart from a random POST to this URL.
export async function POST(request) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (!secret || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const update = await request.json().catch(() => null);

  try {
    if (update?.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return Response.json({ ok: true });
    }

    const message = update?.message;
    const chatId = message?.chat?.id;
    const text = message?.text;
    // Always 200 back to Telegram even on "nothing to do" — a non-200
    // makes Telegram retry the same update repeatedly.
    if (!chatId || !text) {
      return Response.json({ ok: true });
    }

    await handleMessage(chatId, text, message);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook failed:", err);
    // Still 200 so Telegram doesn't hammer retries over a transient error.
    return Response.json({ ok: true });
  }
}

// Free-text path: "ProductName, 2" style messages, plus /start and
// anything unparseable falling back to the category buttons.
async function handleMessage(chatId, text, message) {
  const supabase = supabaseAdmin();

  if (text.trim().startsWith("/")) {
    await sendTelegramMessage(chatId, "Hi! What would you like to order?", buildCategoryKeyboard());
    return;
  }

  const parsed = parseOrderMessage(text);
  if (!parsed) {
    const { data: products, error } = await supabase.from("products").select("*");
    if (error) throw error;
    await sendTelegramMessage(chatId, buildUsageMessage(products));
    await sendTelegramMessage(chatId, "Or tap a category:", buildCategoryKeyboard());
    return;
  }

  const product = await findProduct(supabase, parsed.productName);
  if (!product) {
    await sendTelegramMessage(chatId, NOT_FOUND_MESSAGE);
    return;
  }

  const username = message.from?.username || message.from?.first_name || null;
  await createOrderAndReply(supabase, chatId, product, parsed.quantity, username);
}

// Button path: category -> item -> quantity. Each callback_data carries
// everything needed for the next step (the product id), so no
// server-side session state is required between taps.
async function handleCallbackQuery(callbackQuery) {
  await answerCallbackQuery(callbackQuery.id);

  const chatId = callbackQuery.message?.chat?.id;
  const data = callbackQuery.data || "";
  if (!chatId) return;

  const supabase = supabaseAdmin();

  if (data === "cat:service" || data === "cat:rights") {
    const categoryKey = data.split(":")[1];
    const { data: products, error } = await supabase.from("products").select("*");
    if (error) throw error;
    await sendTelegramMessage(
      chatId,
      `${categoryLabel(categoryKey)} — pick one:`,
      buildItemKeyboard(products, categoryKey)
    );
    return;
  }

  if (data === "cat:others") {
    await sendTelegramMessage(chatId, OTHERS_MESSAGE);
    return;
  }

  if (data === "cat:back") {
    await sendTelegramMessage(chatId, "What would you like to order?", buildCategoryKeyboard());
    return;
  }

  if (data.startsWith("item:")) {
    const productId = data.slice("item:".length);
    const product = await getProductById(supabase, productId);
    if (!product) {
      await sendTelegramMessage(chatId, NOT_FOUND_MESSAGE);
      return;
    }
    await sendTelegramMessage(
      chatId,
      `How many "${product.name}" would you like?`,
      buildQuantityKeyboard(product.id)
    );
    return;
  }

  if (data.startsWith("qty:")) {
    const [, productId, qtyStr] = data.split(":");
    const quantity = Number(qtyStr);
    const product = await getProductById(supabase, productId);
    if (!product || !(quantity > 0)) {
      await sendTelegramMessage(chatId, NOT_FOUND_MESSAGE);
      return;
    }
    const username = callbackQuery.from?.username || callbackQuery.from?.first_name || null;
    await createOrderAndReply(supabase, chatId, product, quantity, username);
  }
}

async function getProductById(supabase, id) {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

async function createOrderAndReply(supabase, chatId, product, quantity, username) {
  const unitPrice = Number(product.unit_price);
  const total = Math.round(quantity * unitPrice * 100) / 100;

  const { error: insertError } = await supabase.from("telegram_orders").insert({
    telegram_chat_id: chatId,
    telegram_username: username,
    product_name: product.name,
    quantity,
    unit_price: unitPrice,
    total,
  });
  if (insertError) throw insertError;

  const reply = [
    "Here's your quote:",
    "",
    `Product: ${product.name}`,
    `Quantity: ${quantity}`,
    `Unit Price: ${formatCurrency(unitPrice)}`,
    `Total: ${formatCurrency(total)}`,
  ].join("\n");
  await sendTelegramMessage(chatId, reply);
}
