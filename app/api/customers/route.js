import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { customerFromRow, customerToRow } from "@/lib/dataMappers";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin()
      .from("customers")
      .select("*")
      .order("created_at");
    if (error) throw error;
    return Response.json({ ok: true, customers: data.map(customerFromRow) });
  } catch (err) {
    console.error("GET /api/customers failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body?.company?.trim()) {
    return Response.json({ ok: false, error: "Company name is required." }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("customers")
      .insert(customerToRow(body))
      .select()
      .single();
    if (error) throw error;
    return Response.json({ ok: true, customer: customerFromRow(data) });
  } catch (err) {
    console.error("POST /api/customers failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
