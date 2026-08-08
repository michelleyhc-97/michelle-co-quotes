import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { quoteFromRow } from "@/lib/dataMappers";

export function computeSubtotal(items) {
  return items.reduce((sum, i) => sum + Number(i.qty) * Number(i.unitPrice), 0);
}

/** Fetches every quote with its line items attached (two queries total,
 * grouped in memory — simplest correct approach at this table size). */
export async function listQuotesWithItems() {
  const supabase = supabaseAdmin();

  const { data: quoteRows, error: quotesError } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false });
  if (quotesError) throw quotesError;

  const ids = quoteRows.map((q) => q.id);
  const { data: itemRows, error: itemsError } = ids.length
    ? await supabase.from("quote_items").select("*").in("quote_id", ids).order("position")
    : { data: [], error: null };
  if (itemsError) throw itemsError;

  const itemsByQuote = new Map();
  for (const item of itemRows) {
    if (!itemsByQuote.has(item.quote_id)) itemsByQuote.set(item.quote_id, []);
    itemsByQuote.get(item.quote_id).push(item);
  }

  return quoteRows.map((row) => quoteFromRow(row, itemsByQuote.get(row.id) ?? []));
}

export async function getQuoteWithItems(id) {
  const supabase = supabaseAdmin();

  const { data: row, error: quoteError } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (quoteError) throw quoteError;
  if (!row) return null;

  const { data: itemRows, error: itemsError } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", id)
    .order("position");
  if (itemsError) throw itemsError;

  return quoteFromRow(row, itemRows);
}

/** Deletes all existing line items for a quote and inserts the given set,
 * preserving order via `position`. */
export async function replaceQuoteItems(quoteId, items) {
  const supabase = supabaseAdmin();

  const { error: deleteError } = await supabase.from("quote_items").delete().eq("quote_id", quoteId);
  if (deleteError) throw deleteError;

  if (items.length === 0) return;

  const rows = items.map((item, index) => ({
    quote_id: quoteId,
    description: item.description,
    quantity: item.qty,
    unit_price: item.unitPrice,
    position: index,
  }));
  const { error: insertError } = await supabase.from("quote_items").insert(rows);
  if (insertError) throw insertError;
}
