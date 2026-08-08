import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { listQuotesWithItems, getQuoteWithItems, replaceQuoteItems, computeSubtotal } from "@/lib/quoteQueries";
import { computeQuoteTotals } from "@/lib/quoteUtils";

export async function GET() {
  try {
    const quotes = await listQuotesWithItems();
    return Response.json({ ok: true, quotes });
  } catch (err) {
    console.error("GET /api/quotes failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body?.customerId || !Array.isArray(body?.items) || body.items.length === 0) {
    return Response.json(
      { ok: false, error: "A customer and at least one line item are required." },
      { status: 400 }
    );
  }

  try {
    const rawSubtotal = computeSubtotal(body.items);
    const taxRate = Number(body.taxRate) || 0;
    const serviceChargeRate = Number(body.serviceChargeRate) || 0;
    const { subtotal, total } = computeQuoteTotals(rawSubtotal, taxRate, serviceChargeRate);

    const { data: quoteRow, error } = await supabaseAdmin()
      .from("quotes")
      .insert({
        customer_id: body.customerId,
        status: body.status || "Draft",
        tax_rate: taxRate,
        service_charge_rate: serviceChargeRate,
        subtotal,
        total,
      })
      .select()
      .single();
    if (error) throw error;

    await replaceQuoteItems(quoteRow.id, body.items);
    const quote = await getQuoteWithItems(quoteRow.id);

    return Response.json({ ok: true, quote });
  } catch (err) {
    console.error("POST /api/quotes failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
