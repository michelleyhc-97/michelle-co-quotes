"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { computeQuoteTotals, formatCurrency as currency, paymentMethodDetails, IDENTITY } from "@/lib/quoteUtils";
import StatusBadge from "@/components/StatusBadge";
import { buildInvoicePdfBlob, downloadBlob } from "@/lib/pdf";

export default function PublicInvoicePage() {
  const { id } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/invoices/${id}`);
      const data = await res.json();
      if (!data.ok) {
        setNotFound(true);
        return;
      }
      setInvoice(data.invoice);
      setCustomer(data.customer);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // load() sets state asynchronously (after its own await), not
    // synchronously within this effect — the standard "fetch on mount"
    // pattern. This rule's static analysis can't tell the two apart.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await buildInvoicePdfBlob(invoice, customer);
      downloadBlob(blob, `${invoice.number}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <Centered>
        <p className="text-sm text-muted">Loading…</p>
      </Centered>
    );
  }

  if (notFound || !invoice) {
    return (
      <Centered>
        <p className="text-lg font-semibold text-ink">Invoice not found</p>
        <p className="mt-2 text-sm text-muted">This link may be out of date — please check with us.</p>
      </Centered>
    );
  }

  const totals = computeQuoteTotals(invoice.subtotal, invoice.taxRate, invoice.serviceChargeRate);
  const methods = paymentMethodDetails(invoice.total);

  return (
    <div className="min-h-screen bg-bg px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-accent-ink">
            M
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">{IDENTITY.companyName}</p>
            <p className="text-xs text-faint">{IDENTITY.tagline}</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-surface p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-faint">Invoice</p>
              <h1 className="text-xl font-semibold text-ink">{invoice.number}</h1>
              <p className="mt-1 text-xs text-muted">Issued {invoice.issueDate}</p>
              {invoice.dueDate && <p className="mt-0.5 text-xs text-muted">Due {invoice.dueDate}</p>}
            </div>
            <StatusBadge status={invoice.status} />
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <p className="text-xs text-faint">Bill to</p>
            <p className="mt-1 text-sm font-medium text-ink">{customer?.company ?? "—"}</p>
            {customer?.contact && <p className="text-sm text-muted">{customer.contact}</p>}
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-faint">
                  <th className="px-4 py-2.5 font-medium">Description</th>
                  <th className="px-4 py-2.5 font-medium">Qty</th>
                  <th className="px-4 py-2.5 font-medium">Unit Price</th>
                  <th className="px-4 py-2.5 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2.5 text-ink">{item.description}</td>
                    <td className="px-4 py-2.5 text-muted">{item.qty}</td>
                    <td className="px-4 py-2.5 text-muted">{currency(item.unitPrice)}</td>
                    <td className="px-4 py-2.5 text-ink">{currency(item.qty * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-1.5">
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
            <div className="flex justify-end gap-3 border-t border-border pt-2">
              <span className="w-40 text-right text-sm font-normal text-muted">Amount Due</span>
              <span className="w-28 text-right text-lg font-semibold text-ink">
                {currency(invoice.total)}
              </span>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-6 border-t border-border pt-6">
              <p className="text-xs text-faint">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink/80">{invoice.notes}</p>
            </div>
          )}

          <div className="mt-6 rounded-lg border border-border bg-surface-2 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-faint">Payment Details</p>
            <div className="mt-3 space-y-3">
              {methods.map((m) => (
                <div key={m.label} className="text-sm">
                  <p className="font-medium text-ink">{m.label}</p>
                  <p className="text-muted">{m.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-6">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-surface-2 disabled:opacity-50"
            >
              {downloading ? "Preparing…" : "Download PDF"}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-faint">
          Questions? Reply to the email this invoice came with, or reach us at{" "}
          <a href={`mailto:${IDENTITY.email}`} className="text-muted hover:text-accent">
            {IDENTITY.email}
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function Centered({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5 text-center">
      <div className="max-w-sm">{children}</div>
    </div>
  );
}
