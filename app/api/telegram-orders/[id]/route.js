import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
