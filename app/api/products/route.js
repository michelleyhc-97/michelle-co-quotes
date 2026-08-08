import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { productFromRow, productToRow } from "@/lib/dataMappers";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin().from("products").select("*").order("name");
    if (error) throw error;
    return Response.json({ ok: true, products: data.map(productFromRow) });
  } catch (err) {
    console.error("GET /api/products failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body?.name?.trim()) {
    return Response.json({ ok: false, error: "Product name is required." }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("products")
      .insert(productToRow(body))
      .select()
      .single();
    if (error) throw error;
    return Response.json({ ok: true, product: productFromRow(data) });
  } catch (err) {
    console.error("POST /api/products failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
