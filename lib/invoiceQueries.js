import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { invoiceFromRow } from "@/lib/dataMappers";
import { getQuoteWithItems } from "@/lib/quoteQueries";

/** Fetches every invoice with its line items attached (same two-query,
 * grouped-in-memory approach as listQuotesWithItems). */
export async function listInvoicesWithItems() {
  const supabase = supabaseAdmin();

  const { data: invoiceRows, error: invoicesError } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });
  if (invoicesError) throw invoicesError;

  const ids = invoiceRows.map((i) => i.id);
  const { data: itemRows, error: itemsError } = ids.length
    ? await supabase.from("invoice_items").select("*").in("invoice_id", ids).order("position")
    : { data: [], error: null };
  if (itemsError) throw itemsError;

  const itemsByInvoice = new Map();
  for (const item of itemRows) {
    if (!itemsByInvoice.has(item.invoice_id)) itemsByInvoice.set(item.invoice_id, []);
    itemsByInvoice.get(item.invoice_id).push(item);
  }

  return invoiceRows.map((row) => invoiceFromRow(row, itemsByInvoice.get(row.id) ?? []));
}

export async function getInvoiceWithItems(id) {
  const supabase = supabaseAdmin();

  const { data: row, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (invoiceError) throw invoiceError;
  if (!row) return null;

  const { data: itemRows, error: itemsError } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("position");
  if (itemsError) throw itemsError;

  return invoiceFromRow(row, itemRows);
}

/** Creates an invoice by snapshotting a quote's customer, line items, and
 * totals at this moment — editing the quote afterwards won't change an
 * invoice that's already been issued. */
export async function createInvoiceFromQuote(quoteId, { dueDate, notes } = {}) {
  const quote = await getQuoteWithItems(quoteId);
  if (!quote) throw new Error("That quote no longer exists.");
  if (!quote.items.length) throw new Error("That quote has no line items to invoice.");

  const supabase = supabaseAdmin();

  const { data: invoiceRow, error: insertError } = await supabase
    .from("invoices")
    .insert({
      quote_id: quote.id,
      customer_id: quote.customerId,
      subtotal: quote.subtotal,
      tax_rate: quote.taxRate,
      service_charge_rate: quote.serviceChargeRate,
      total: quote.total,
      due_date: dueDate || null,
      notes: notes?.trim() || null,
    })
    .select()
    .single();
  if (insertError) throw insertError;

  const rows = quote.items.map((item, index) => ({
    invoice_id: invoiceRow.id,
    description: item.description,
    quantity: item.qty,
    unit_price: item.unitPrice,
    position: index,
  }));
  const { error: itemsError } = await supabase.from("invoice_items").insert(rows);
  if (itemsError) throw itemsError;

  return getInvoiceWithItems(invoiceRow.id);
}
