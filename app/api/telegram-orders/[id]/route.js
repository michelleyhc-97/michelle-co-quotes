import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { telegramOrderFromRow } from "@/lib/dataMappers";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.status) {
    return Response.json({ ok: false, error: "Status is required." }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("telegram_orders")
      .update({ status: body.status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return Response.json({ ok: true, telegramOrder: telegramOrderFromRow(data) });
  } catch (err) {
    console.error("PATCH /api/telegram-orders/[id] failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const { error } = await supabaseAdmin().from("telegram_orders").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/telegram-orders/[id] failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
