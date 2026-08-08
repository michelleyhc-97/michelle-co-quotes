import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getInvoiceWithItems } from "@/lib/invoiceQueries";

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const invoice = await getInvoiceWithItems(id);
    if (!invoice) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
    return Response.json({ ok: true, invoice });
  } catch (err) {
    console.error("GET /api/invoices/[id] failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// Invoices are a frozen record of what was billed — line items aren't
// editable here. Only its status, due date, and notes can change; to
// change what's owed, create a fresh invoice from an updated quote.
export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  try {
    const update = {};
    if (body.status !== undefined) update.status = body.status;
    if (body.dueDate !== undefined) update.due_date = body.dueDate || null;
    if (body.notes !== undefined) update.notes = body.notes?.trim() || null;

    if (Object.keys(update).length > 0) {
      const { error: updateError } = await supabaseAdmin().from("invoices").update(update).eq("id", id);
      if (updateError) throw updateError;
    }

    const invoice = await getInvoiceWithItems(id);
    return Response.json({ ok: true, invoice });
  } catch (err) {
    console.error("PATCH /api/invoices/[id] failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const { error } = await supabaseAdmin().from("invoices").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/invoices/[id] failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
