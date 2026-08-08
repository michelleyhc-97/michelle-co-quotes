import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getQuoteWithItems, replaceQuoteItems, computeSubtotal } from "@/lib/quoteQueries";
import { computeQuoteTotals } from "@/lib/quoteUtils";

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const quote = await getQuoteWithItems(id);
    if (!quote) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
    return Response.json({ ok: true, quote });
  } catch (err) {
    console.error("GET /api/quotes/[id] failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  try {
    const supabase = supabaseAdmin();
    const update = {};

    if (body.customerId !== undefined) update.customer_id = body.customerId;
    if (body.status !== undefined) update.status = body.status;

    // Editing a quote that had a pending amendment request clears it, unless
    // the caller is explicitly keeping the status as "Amendment Requested".
    if (body.status !== undefined) {
      update.amendment_reason = body.status === "Amendment Requested" ? body.amendmentReason : null;
      update.amendment_requested_at =
        body.status === "Amendment Requested" ? body.amendmentRequestedAt : null;
    }

    if (Array.isArray(body.items) || body.taxRate !== undefined || body.serviceChargeRate !== undefined) {
      // Fall back to whatever this quote already had for whichever of
      // items/taxRate/serviceChargeRate the caller didn't send, so an
      // items-only save doesn't silently reset the tax setup (and vice
      // versa).
      const { data: existing, error: fetchError } = await supabase
        .from("quotes")
        .select("subtotal, tax_rate, service_charge_rate")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;

      const rawSubtotal = Array.isArray(body.items)
        ? computeSubtotal(body.items)
        : Number(existing.subtotal);
      const taxRate = body.taxRate !== undefined ? Number(body.taxRate) || 0 : Number(existing.tax_rate) || 0;
      const serviceChargeRate =
        body.serviceChargeRate !== undefined
          ? Number(body.serviceChargeRate) || 0
          : Number(existing.service_charge_rate) || 0;
      const { subtotal, total } = computeQuoteTotals(rawSubtotal, taxRate, serviceChargeRate);

      update.subtotal = subtotal;
      update.tax_rate = taxRate;
      update.service_charge_rate = serviceChargeRate;
      update.total = total;

      if (Array.isArray(body.items)) {
        await replaceQuoteItems(id, body.items);
      }
    }

    if (Object.keys(update).length > 0) {
      const { error: updateError } = await supabase.from("quotes").update(update).eq("id", id);
      if (updateError) throw updateError;
    }

    const quote = await getQuoteWithItems(id);
    return Response.json({ ok: true, quote });
  } catch (err) {
    console.error("PATCH /api/quotes/[id] failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const { error } = await supabaseAdmin().from("quotes").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/quotes/[id] failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
