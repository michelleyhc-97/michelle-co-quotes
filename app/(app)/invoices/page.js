"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppData, INVOICE_STATUSES } from "@/lib/store";
import { useIsBoss } from "@/lib/UserContext";
import { formatCurrency } from "@/lib/quoteUtils";
import StatusBadge from "@/components/StatusBadge";

const currency = (n) => formatCurrency(n, { decimals: 0 });

export default function InvoicesPage() {
  const { invoices, loading, getCustomer, updateInvoice, deleteInvoice } = useAppData();
  const isBoss = useIsBoss();
  const [filter, setFilter] = useState("All");
  const [busyId, setBusyId] = useState(null);

  const filtered = useMemo(() => {
    const sorted = [...invoices].sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
    return filter === "All" ? sorted : sorted.filter((i) => i.status === filter);
  }, [invoices, filter]);

  async function handleStatusChange(invoice, status) {
    setBusyId(invoice.id);
    try {
      await updateInvoice(invoice.id, { status });
    } catch (err) {
      alert(`Couldn't update status: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(invoice) {
    if (!confirm(`Delete ${invoice.number}? This can't be undone.`)) return;
    try {
      await deleteInvoice(invoice.id);
    } catch (err) {
      alert(`Couldn't delete: ${err.message}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Invoices</h1>
          <p className="mt-1 text-sm text-muted">{invoices.length} invoices total.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["All", ...INVOICE_STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === s ? "bg-surface-2 text-ink" : "text-muted hover:bg-surface-2 hover:text-ink"
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
              <th className="px-5 py-3 font-medium">Invoice #</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Issued</th>
              <th className="px-5 py-3 font-medium">Due</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-t border-border">
                <td className="px-5 py-3.5 font-medium text-ink">{inv.number}</td>
                <td className="px-5 py-3.5 text-muted">{getCustomer(inv.customerId)?.company ?? "—"}</td>
                <td className="px-5 py-3.5 text-muted">{inv.issueDate}</td>
                <td className="px-5 py-3.5 text-muted">{inv.dueDate ?? "—"}</td>
                <td className="px-5 py-3.5 text-ink">{currency(inv.total)}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={inv.status} />
                    <select
                      value={inv.status}
                      onChange={(e) => handleStatusChange(inv, e.target.value)}
                      disabled={busyId === inv.id}
                      className="rounded-md border border-border bg-surface-2 px-1.5 py-1 text-xs text-muted outline-none focus:border-accent disabled:opacity-50"
                      aria-label={`Change status for ${inv.number}`}
                    >
                      {INVOICE_STATUSES.map((s) => (
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
                      href={`/inv/${inv.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-muted hover:text-accent"
                    >
                      View
                    </a>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="text-xs font-medium text-muted hover:text-accent"
                    >
                      Edit
                    </Link>
                    {isBoss && (
                      <button
                        type="button"
                        onClick={() => handleDelete(inv)}
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
                  {loading
                    ? "Loading…"
                    : "No invoices yet — create one from an Accepted quote's edit page."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
