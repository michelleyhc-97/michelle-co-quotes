import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getQuoteWithItems } from "@/lib/quoteQueries";

// Public (see proxy.js) — the only two things a customer can do with a
// quote, by its id, with no login: view it, or respond to it. No listing,
// no access to any other customer's data, no editing of items/customer.

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const quote = await getQuoteWithItems(id);
    if (!quote) return Response.json({ ok: false, error: "Not found" }, { status: 404 });

    let customer = null;
    if (quote.customerId) {
      const { data, error } = await supabaseAdmin()
        .from("customers")
        .select("company_name, contact_person")
        .eq("id", quote.customerId)
        .maybeSingle();
      if (error) throw error;
      customer = data ? { company: data.company_name, contact: data.contact_person } : null;
    }

    return Response.json({ ok: true, quote, customer });
  } catch (err) {
    console.error("GET /api/public/quotes/[id] failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

const ACTIONS = {
  accept: { status: "Accepted" },
  reject: { status: "Rejected" },
};

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (action !== "accept" && action !== "reject" && action !== "amend") {
    return Response.json({ ok: false, error: "Invalid action." }, { status: 400 });
  }
  if (action === "amend" && !body?.reason?.trim()) {
    return Response.json({ ok: false, error: "A reason is required." }, { status: 400 });
  }

  try {
    const update =
      action === "amend"
        ? {
            status: "Amendment Requested",
            amendment_reason: body.reason.trim(),
            amendment_requested_at: new Date().toISOString().slice(0, 10),
          }
        : ACTIONS[action];

    const { error } = await supabaseAdmin().from("quotes").update(update).eq("id", id);
    if (error) throw error;

    const quote = await getQuoteWithItems(id);
    return Response.json({ ok: true, quote });
  } catch (err) {
    console.error("PATCH /api/public/quotes/[id] failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
