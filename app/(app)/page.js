"use client";

import Link from "next/link";
import { useAppData, quoteTotal, STATUSES } from "@/lib/store";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";

const CLOSED = new Set(["Accepted", "Rejected"]);
const PENDING = new Set(["Draft", "Sent", "Amendment Requested"]);

function isThisMonth(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

const currency = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function DashboardPage() {
  const { quotes, loading, getCustomer } = useAppData();

  const thisMonth = quotes.filter((q) => isThisMonth(q.createdAt));
  const closed = quotes.filter((q) => CLOSED.has(q.status));
  const pending = quotes.filter((q) => PENDING.has(q.status));

  const statusCounts = STATUSES.map((status) => ({
    status,
    count: quotes.filter((q) => q.status === status).length,
  }));

  const recent = [...quotes]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            {loading ? "Loading…" : "An overview of this month's quoting activity."}
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent/90"
        >
          + New Quote
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Quotes this month" value={thisMonth.length} hint="Created in the current calendar month" />
        <StatCard label="Closed" value={closed.length} hint="Accepted or Rejected" />
        <StatCard label="Pending" value={pending.length} hint="Draft, Sent, or awaiting an amendment response" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Recent Quotes</h2>
            <Link href="/quotes" className="text-xs font-medium text-accent hover:underline">
              View all
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-faint">
                <th className="px-5 py-2.5 font-medium">Quote #</th>
                <th className="px-5 py-2.5 font-medium">Customer</th>
                <th className="px-5 py-2.5 font-medium">Date</th>
                <th className="px-5 py-2.5 font-medium">Total</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((q) => (
                <tr key={q.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium text-ink">{q.number}</td>
                  <td className="px-5 py-3 text-muted">{getCustomer(q.customerId)?.company ?? "—"}</td>
                  <td className="px-5 py-3 text-muted">{q.createdAt}</td>
                  <td className="px-5 py-3 text-ink">{currency(quoteTotal(q))}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={q.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">By Status</h2>
          <div className="mt-4 space-y-3">
            {statusCounts.map(({ status, count }) => (
              <div key={status} className="flex items-center justify-between">
                <StatusBadge status={status} />
                <span className="text-sm font-medium text-ink">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
