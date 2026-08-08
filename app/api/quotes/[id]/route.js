import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getQuoteWithItems, replaceQuoteItems, computeSubtotal } from "@/lib/quoteQueries";

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

    if (Array.isArray(body.items)) {
      // Preserve whatever tax_rate this quote already had (there's no UI
      // for editing tax yet) rather than silently dropping it on save.
      const { data: existing, error: fetchError } = await supabase
        .from("quotes")
        .select("tax_rate")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;

      const subtotal = computeSubtotal(body.items);
      const taxRate = Number(existing.tax_rate) || 0;
      update.subtotal = subtotal;
      update.total = Math.round(subtotal * (1 + taxRate / 100) * 100) / 100;

      await replaceQuoteItems(id, body.items);
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
