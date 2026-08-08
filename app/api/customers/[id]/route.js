import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { customerFromRow, customerToRow } from "@/lib/dataMappers";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.company?.trim()) {
    return Response.json({ ok: false, error: "Company name is required." }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("customers")
      .update(customerToRow(body))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return Response.json({ ok: true, customer: customerFromRow(data) });
  } catch (err) {
    console.error("PATCH /api/customers/[id] failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const { error } = await supabaseAdmin().from("customers").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/customers/[id] failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
