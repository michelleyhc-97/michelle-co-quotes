import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { customerFromRow } from "@/lib/dataMappers";
import { listQuotesWithItems } from "@/lib/quoteQueries";
import { listInvoicesWithItems } from "@/lib/invoiceQueries";

const OUTSTANDING_INVOICE_STATUSES = new Set(["Unpaid", "Overdue"]);

const round2 = (n) => Math.round(n * 100) / 100;

function lastNMonths(n) {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

/** Computes a compact, deterministic snapshot of the business's current
 * customers/quotes/invoices — every number here is plain arithmetic over
 * real rows, nothing inferred. This is what gets shown directly on the
 * dashboard AND handed to Gemini for narrative synthesis (see
 * lib/gemini.js), so the numbers a boss sees can never disagree with what
 * the AI commentary is reasoning about. */
export async function computeBusinessStats() {
  const supabase = supabaseAdmin();
  const [customersResult, quotes, invoices] = await Promise.all([
    supabase.from("customers").select("*"),
    listQuotesWithItems(),
    listInvoicesWithItems(),
  ]);
  if (customersResult.error) throw customersResult.error;

  const customers = customersResult.data.map(customerFromRow);
  const customerById = new Map(customers.map((c) => [c.id, c]));

  const quotesByStatus = {};
  for (const q of quotes) quotesByStatus[q.status] = (quotesByStatus[q.status] || 0) + 1;

  const acceptedQuotes = quotes.filter((q) => q.status === "Accepted");
  const rejectedQuotes = quotes.filter((q) => q.status === "Rejected");
  const closedCount = acceptedQuotes.length + rejectedQuotes.length;
  const conversionRatePercent =
    closedCount > 0 ? Math.round((acceptedQuotes.length / closedCount) * 1000) / 10 : null;

  const totalQuoteValue = round2(quotes.reduce((s, q) => s + q.total, 0));
  const acceptedValue = round2(acceptedQuotes.reduce((s, q) => s + q.total, 0));
  const averageQuoteValue = quotes.length ? round2(totalQuoteValue / quotes.length) : 0;

  const invoicesByStatus = {};
  for (const i of invoices) invoicesByStatus[i.status] = (invoicesByStatus[i.status] || 0) + 1;

  const paidInvoices = invoices.filter((i) => i.status === "Paid");
  const outstandingInvoices = invoices.filter((i) => OUTSTANDING_INVOICE_STATUSES.has(i.status));
  const overdueInvoices = invoices.filter((i) => i.status === "Overdue");

  const totalBilled = round2(invoices.reduce((s, i) => s + i.total, 0));
  const totalPaid = round2(paidInvoices.reduce((s, i) => s + i.total, 0));
  const totalOutstanding = round2(outstandingInvoices.reduce((s, i) => s + i.total, 0));
  const overdueAmount = round2(overdueInvoices.reduce((s, i) => s + i.total, 0));

  const byCustomer = new Map();
  for (const q of quotes) {
    if (!q.customerId) continue;
    const entry = byCustomer.get(q.customerId) ?? { quoteCount: 0, totalValue: 0 };
    entry.quoteCount += 1;
    entry.totalValue += q.total;
    byCustomer.set(q.customerId, entry);
  }
  const topCustomers = Array.from(byCustomer.entries())
    .map(([customerId, v]) => ({
      company: customerById.get(customerId)?.company ?? "Unknown",
      quoteCount: v.quoteCount,
      totalValue: round2(v.totalValue),
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);

  const monthlyRevenue = lastNMonths(6).map((month) => ({
    month,
    total: round2(
      acceptedQuotes.filter((q) => q.createdAt.slice(0, 7) === month).reduce((s, q) => s + q.total, 0)
    ),
  }));

  return {
    generatedAt: new Date().toISOString(),
    customers: { total: customers.length },
    quotes: {
      total: quotes.length,
      byStatus: quotesByStatus,
      totalValue: totalQuoteValue,
      acceptedValue,
      averageValue: averageQuoteValue,
      conversionRatePercent,
    },
    invoices: {
      total: invoices.length,
      byStatus: invoicesByStatus,
      totalBilled,
      totalPaid,
      totalOutstanding,
      overdueCount: overdueInvoices.length,
      overdueAmount,
    },
    topCustomers,
    monthlyRevenue,
  };
}
