import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { telegramOrderFromRow } from "@/lib/dataMappers";

// Read-only from the app's side — orders are created by the bot webhook
// (app/api/telegram/webhook/route.js), not from this UI.
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin()
      .from("telegram_orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({ ok: true, telegramOrders: data.map(telegramOrderFromRow) });
  } catch (err) {
    console.error("GET /api/telegram-orders failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
