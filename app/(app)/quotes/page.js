"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppData, quoteTotal, STATUSES } from "@/lib/store";
import { useIsBoss } from "@/lib/UserContext";
import StatusBadge from "@/components/StatusBadge";

const currency = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function QuotesPage() {
  const { quotes, loading, getCustomer, updateQuoteStatus, deleteQuote } = useAppData();
  const isBoss = useIsBoss();
  const [filter, setFilter] = useState("All");
  const [busyId, setBusyId] = useState(null);

  const filtered = useMemo(() => {
    const sorted = [...quotes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return filter === "All" ? sorted : sorted.filter((q) => q.status === filter);
  }, [quotes, filter]);

  const pendingAmendments = quotes.filter((q) => q.status === "Amendment Requested").length;

  async function handleStatusChange(quote, status) {
    setBusyId(quote.id);
    try {
      await updateQuoteStatus(quote.id, status);
    } catch (err) {
      alert(`Couldn't update status: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(quote) {
    if (!confirm(`Delete ${quote.number}? This can't be undone.`)) return;
    try {
      await deleteQuote(quote.id);
    } catch (err) {
      alert(`Couldn't delete: ${err.message}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Quote Records</h1>
          <p className="mt-1 text-sm text-muted">
            {quotes.length} quotes total.
            {pendingAmendments > 0 && (
              <span className="ml-2 font-medium text-status-amendment">
                {pendingAmendments} awaiting a response to a customer amendment request.
              </span>
            )}
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent/90"
        >
          + New Quote
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {["All", ...STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === s
                ? "bg-surface-2 text-ink"
                : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-faint">
              <th className="px-5 py-3 font-medium">Quote #</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((q) => (
              <tr key={q.id} className="border-t border-border">
                <td className="px-5 py-3.5 font-medium text-ink">{q.number}</td>
                <td className="px-5 py-3.5 text-muted">{getCustomer(q.customerId)?.company ?? "—"}</td>
                <td className="px-5 py-3.5 text-muted">{q.createdAt}</td>
                <td className="px-5 py-3.5 text-muted">
                  {q.items.length} item{q.items.length === 1 ? "" : "s"}
                </td>
                <td className="px-5 py-3.5 text-ink">{currency(quoteTotal(q))}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={q.status} />
                    {q.amendmentReason && q.status === "Amendment Requested" && (
                      <span
                        title={q.amendmentReason}
                        className="cursor-help text-xs text-status-amendment underline decoration-dotted"
                      >
                        why?
                      </span>
                    )}
                    <select
                      value={q.status}
                      onChange={(e) => handleStatusChange(q, e.target.value)}
                      disabled={busyId === q.id}
                      className="rounded-md border border-border bg-surface-2 px-1.5 py-1 text-xs text-muted outline-none focus:border-accent disabled:opacity-50"
                      aria-label={`Change status for ${q.number}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <a
                      href={`/q/${q.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-muted hover:text-accent"
                    >
                      View
                    </a>
                    <Link
                      href={`/quotes/${q.id}/edit`}
                      className="text-xs font-medium text-muted hover:text-accent"
                    >
                      Edit
                    </Link>
                    {isBoss && (
                      <button
                        type="button"
                        onClick={() => handleDelete(q)}
                        className="text-xs font-medium text-muted hover:text-status-rejected"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted">
                  {loading ? "Loading…" : "No quotes match this filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
