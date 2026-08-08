"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAppData, INVOICE_STATUSES } from "@/lib/store";
import { useIsBoss } from "@/lib/UserContext";
import { computeQuoteTotals, formatCurrency, paymentMethodDetails } from "@/lib/quoteUtils";
import StatusBadge from "@/components/StatusBadge";
import SendInvoiceModal from "@/components/SendInvoiceModal";
import { buildInvoicePdfBlob, downloadBlob } from "@/lib/pdf";

const currency = formatCurrency;

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { loading, getCustomer, getInvoice, updateInvoice, deleteInvoice } = useAppData();
  const isBoss = useIsBoss();
  const invoice = getInvoice(id);

  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-ink">Invoice not found</h1>
        <p className="text-sm text-muted">It may have been deleted.</p>
        <Link href="/invoices" className="text-sm font-medium text-accent hover:underline">
          ← Back to Invoices
        </Link>
      </div>
    );
  }

  const customer = getCustomer(invoice.customerId);
  const totals = computeQuoteTotals(invoice.subtotal, invoice.taxRate, invoice.serviceChargeRate);
  const methods = paymentMethodDetails(invoice.total);
  const customerLink = typeof window !== "undefined" ? `${window.location.origin}/inv/${invoice.id}` : "";

  async function handleDelete() {
    if (!confirm(`Delete ${invoice.number}? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await deleteInvoice(invoice.id);
      router.push("/invoices");
    } catch (err) {
      alert(`Couldn't delete: ${err.message}`);
      setDeleting(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await buildInvoicePdfBlob(invoice, customer);
      downloadBlob(blob, `${invoice.number}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  function handleCopyLink() {
    navigator.clipboard?.writeText(customerLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleFieldChange(patch) {
    setSaving(true);
    setSaveError("");
    try {
      await updateInvoice(invoice.id, patch);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{invoice.number}</h1>
          <p className="mt-1 text-sm text-muted">
            Issued {invoice.issueDate} from quote{" "}
            {invoice.quoteId ? (
              <Link href={`/quotes/${invoice.quoteId}/edit`} className="text-accent hover:underline">
                view original
              </Link>
            ) : (
              "—"
            )}
            .
          </p>
        </div>
        {isBoss && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-status-rejected/30 px-4 py-2 text-sm font-semibold text-status-rejected hover:bg-status-rejected/10 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete Invoice"}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-surface-2 disabled:opacity-50"
        >
          {downloading ? "Preparing…" : "Download PDF"}
        </button>
        <button
          type="button"
          onClick={() => setSendModalOpen(true)}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-surface-2"
        >
          Email to Customer
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-surface-2"
        >
          {copied ? "Link copied!" : "Copy Customer Link"}
        </button>
        <span className="text-xs text-faint">
          The customer link lets them view the invoice and payment details — no login needed.
        </span>
      </div>

      {saveError && (
        <p className="rounded-lg bg-status-rejected/10 px-4 py-2.5 text-sm font-medium text-status-rejected">
          {saveError}
        </p>
      )}

      <div className="grid gap-5 rounded-xl border border-border bg-surface p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs text-faint">Bill to</p>
          <p className="mt-1 text-sm font-medium text-ink">{customer?.company ?? "—"}</p>
          {customer?.contact && <p className="text-sm text-muted">{customer.contact}</p>}
        </div>

        <label className="block">
          <span className="text-xs font-medium text-muted">Due Date</span>
          <input
            type="date"
            defaultValue={invoice.dueDate ?? ""}
            onBlur={(e) => {
              if (e.target.value !== (invoice.dueDate ?? "")) handleFieldChange({ dueDate: e.target.value || null });
            }}
            disabled={saving}
            className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent disabled:opacity-50"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted">Status</span>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={invoice.status} />
            <select
              value={invoice.status}
              onChange={(e) => handleFieldChange({ status: e.target.value })}
              disabled={saving}
              className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent disabled:opacity-50"
            >
              {INVOICE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="block sm:col-span-3">
          <span className="text-xs font-medium text-muted">Notes (optional)</span>
          <textarea
            defaultValue={invoice.notes ?? ""}
            onBlur={(e) => {
              if (e.target.value !== (invoice.notes ?? "")) handleFieldChange({ notes: e.target.value });
            }}
            disabled={saving}
            rows={2}
            className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent disabled:opacity-50"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Line Items</h2>
          <p className="mt-0.5 text-xs text-faint">
            Frozen at the moment this invoice was created — editing the original quote won&apos;t
            change it. To bill something different, create a new invoice from an updated quote.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-faint">
              <th className="px-5 py-2.5 font-medium">Description</th>
              <th className="w-24 px-3 py-2.5 font-medium">Qty</th>
              <th className="w-36 px-3 py-2.5 font-medium">Unit Price</th>
              <th className="w-36 px-3 py-2.5 font-medium">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="px-5 py-2.5 text-ink">{item.description}</td>
                <td className="px-3 py-2.5 text-muted">{item.qty}</td>
                <td className="px-3 py-2.5 text-muted">{currency(item.unitPrice)}</td>
                <td className="px-3 py-2.5 text-ink">{currency(item.qty * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1.5 border-t border-border px-5 py-4">
          <div className="flex justify-end gap-3 text-sm">
            <span className="w-40 text-right text-muted">Subtotal</span>
            <span className="w-28 text-right text-ink">{currency(totals.subtotal)}</span>
          </div>
          {invoice.serviceChargeRate > 0 && (
            <div className="flex justify-end gap-3 text-sm">
              <span className="w-40 text-right text-muted">
                Service Charge ({invoice.serviceChargeRate}%)
              </span>
              <span className="w-28 text-right text-ink">{currency(totals.serviceChargeAmount)}</span>
            </div>
          )}
          {invoice.taxRate > 0 && (
            <div className="flex justify-end gap-3 text-sm">
              <span className="w-40 text-right text-muted">SST ({invoice.taxRate}%)</span>
              <span className="w-28 text-right text-ink">{currency(totals.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-end gap-3 border-t border-border pt-2 text-base">
            <span className="w-40 text-right font-medium text-muted">Amount Due</span>
            <span className="w-28 text-right text-lg font-semibold text-ink">
              {currency(invoice.total)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Payment Details</h2>
        <p className="mt-0.5 text-xs text-faint">Shown to the customer on the PDF and public link.</p>
        <div className="mt-4 space-y-3">
          {methods.map((m) => (
            <div key={m.label} className="text-sm">
              <p className="font-medium text-ink">{m.label}</p>
              <p className="text-muted">{m.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {sendModalOpen && (
        <SendInvoiceModal invoice={invoice} customer={customer} onClose={() => setSendModalOpen(false)} />
      )}
    </div>
  );
}
