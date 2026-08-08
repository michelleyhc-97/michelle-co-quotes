import { listInvoicesWithItems, createInvoiceFromQuote } from "@/lib/invoiceQueries";

export async function GET() {
  try {
    const invoices = await listInvoicesWithItems();
    return Response.json({ ok: true, invoices });
  } catch (err) {
    console.error("GET /api/invoices failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// Creates an invoice from an existing quote (normally an Accepted one, but
// not enforced here — some businesses invoice a deposit on Sent, too).
export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body?.quoteId) {
    return Response.json({ ok: false, error: "A quote is required." }, { status: 400 });
  }

  try {
    const invoice = await createInvoiceFromQuote(body.quoteId, {
      dueDate: body.dueDate,
      notes: body.notes,
    });
    return Response.json({ ok: true, invoice });
  } catch (err) {
    console.error("POST /api/invoices failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
