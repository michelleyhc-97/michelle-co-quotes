import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getInvoiceWithItems } from "@/lib/invoiceQueries";

// Public (see proxy.js) — a customer can view one invoice by its id, with
// no login, and nothing else: no listing, no access to any other
// customer's data, no way to mark it paid (that's an admin action once
// payment is confirmed, not something the payer self-reports).
export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const invoice = await getInvoiceWithItems(id);
    if (!invoice) return Response.json({ ok: false, error: "Not found" }, { status: 404 });

    let customer = null;
    if (invoice.customerId) {
      const { data, error } = await supabaseAdmin()
        .from("customers")
        .select("company_name, contact_person")
        .eq("id", invoice.customerId)
        .maybeSingle();
      if (error) throw error;
      customer = data ? { company: data.company_name, contact: data.contact_person } : null;
    }

    return Response.json({ ok: true, invoice, customer });
  } catch (err) {
    console.error("GET /api/public/invoices/[id] failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
