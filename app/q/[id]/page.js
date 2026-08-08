"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { quoteTotal, computeQuoteTotals, IDENTITY } from "@/lib/quoteUtils";
import StatusBadge from "@/components/StatusBadge";
import { buildQuotePdfBlob, downloadBlob } from "@/lib/pdf";

const currency = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const ACTIONABLE_STATUSES = new Set(["Sent", "Amendment Requested"]);

export default function PublicQuotePage() {
  const { id } = useParams();

  const [quote, setQuote] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showReasonBox, setShowReasonBox] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/quotes/${id}`);
      const data = await res.json();
      if (!data.ok) {
        setNotFound(true);
        return;
      }
      setQuote(data.quote);
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

  async function notify(action, extraReason) {
    try {
      await fetch("/api/notify-amendment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteNumber: quote.number,
          customerName: customer?.company,
          action,
          reason: extraReason,
        }),
      });
    } catch {
      // Non-fatal — the status change itself already succeeded.
    }
  }

  async function respond(action) {
    setSubmitting(true);
    setActionError("");
    try {
      const res = await fetch(`/api/public/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setQuote(data.quote);
      await notify(action === "accept" ? "accept" : "reject");
      setNotice(action === "accept" ? "Thanks — marked as accepted!" : "Got it — marked as rejected.");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestAmendment(e) {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    setActionError("");
    try {
      const res = await fetch(`/api/public/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "amend", reason: reason.trim() }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setQuote(data.quote);
      await notify("amendment", reason.trim());
      setNotice("Sent! We'll be in touch about your requested changes.");
      setShowReasonBox(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await buildQuotePdfBlob(quote, customer);
      downloadBlob(blob, `${quote.number}.pdf`);
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

  if (notFound || !quote) {
    return (
      <Centered>
        <p className="text-lg font-semibold text-ink">Quote not found</p>
        <p className="mt-2 text-sm text-muted">This link may be out of date — please check with us.</p>
      </Centered>
    );
  }

  if (quote.status === "Draft") {
    return (
      <Centered>
        <p className="text-lg font-semibold text-ink">This quote isn&apos;t ready yet</p>
        <p className="mt-2 text-sm text-muted">Check back soon, or reach out if you were expecting this.</p>
      </Centered>
    );
  }

  const total = quoteTotal(quote);
  const totals = computeQuoteTotals(quote.subtotal ?? total, quote.taxRate, quote.serviceChargeRate);
  const canAct = ACTIONABLE_STATUSES.has(quote.status);

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
              <p className="text-xs text-faint">Quote</p>
              <h1 className="text-xl font-semibold text-ink">{quote.number}</h1>
              <p className="mt-1 text-xs text-muted">{quote.createdAt}</p>
            </div>
            <StatusBadge status={quote.status} />
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <p className="text-xs text-faint">Prepared for</p>
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
                {quote.items.map((item) => (
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
            {quote.serviceChargeRate > 0 && (
              <div className="flex justify-end gap-3 text-sm">
                <span className="w-40 text-right text-muted">
                  Service Charge ({quote.serviceChargeRate}%)
                </span>
                <span className="w-28 text-right text-ink">{currency(totals.serviceChargeAmount)}</span>
              </div>
            )}
            {quote.taxRate > 0 && (
              <div className="flex justify-end gap-3 text-sm">
                <span className="w-40 text-right text-muted">SST ({quote.taxRate}%)</span>
                <span className="w-28 text-right text-ink">{currency(totals.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-end gap-3 border-t border-border pt-2">
              <span className="w-40 text-right text-sm font-normal text-muted">Grand Total</span>
              <span className="w-28 text-right text-lg font-semibold text-ink">{currency(total)}</span>
            </div>
          </div>

          {quote.status === "Amendment Requested" && quote.amendmentReason && (
            <div className="mt-6 rounded-lg border border-status-amendment/30 bg-status-amendment/10 p-4">
              <p className="text-sm font-semibold text-status-amendment">
                You requested changes on {quote.amendmentRequestedAt}
              </p>
              <p className="mt-1 text-sm text-ink/80">{quote.amendmentReason}</p>
              <p className="mt-2 text-xs text-muted">We&apos;ll follow up with an updated quote soon.</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-6">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-surface-2 disabled:opacity-50"
            >
              {downloading ? "Preparing…" : "Download PDF"}
            </button>

            {canAct && (
              <>
                <button
                  type="button"
                  onClick={() => respond("accept")}
                  disabled={submitting}
                  className="rounded-lg bg-status-accepted px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  Accept Quote
                </button>
                <button
                  type="button"
                  onClick={() => respond("reject")}
                  disabled={submitting}
                  className="rounded-lg border border-status-rejected/40 px-4 py-2 text-sm font-semibold text-status-rejected hover:bg-status-rejected/10 disabled:opacity-50"
                >
                  Reject Quote
                </button>
                <button
                  type="button"
                  onClick={() => setShowReasonBox((v) => !v)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-surface-2"
                >
                  Request Changes
                </button>
              </>
            )}
          </div>

          {notice && <p className="mt-4 text-sm font-medium text-status-accepted">{notice}</p>}
          {actionError && <p className="mt-4 text-sm font-medium text-status-rejected">{actionError}</p>}

          {showReasonBox && (
            <form onSubmit={handleRequestAmendment} className="mt-4 space-y-3 rounded-lg border border-border bg-surface-2 p-4">
              <label className="block">
                <span className="text-xs font-medium text-muted">
                  What would you like changed, and why?
                </span>
                <textarea
                  autoFocus
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder="e.g. Could we adjust the timeline, or swap one of the deliverables?"
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReasonBox(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reason.trim()}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-accent/90 disabled:opacity-50"
                >
                  Send Request
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-faint">
          Questions? Reply to the email this quote came with, or reach us at{" "}
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
