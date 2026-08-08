import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { productFromRow, productToRow } from "@/lib/dataMappers";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.name?.trim()) {
    return Response.json({ ok: false, error: "Product name is required." }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("products")
      .update(productToRow(body))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return Response.json({ ok: true, product: productFromRow(data) });
  } catch (err) {
    console.error("PATCH /api/products/[id] failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const { error } = await supabaseAdmin().from("products").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/products/[id] failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
