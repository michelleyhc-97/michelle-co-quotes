"use client";

import { useMemo, useState } from "react";
import { useAppData, TELEGRAM_ORDER_STATUSES } from "@/lib/store";
import { useIsBoss } from "@/lib/UserContext";
import { formatCurrency } from "@/lib/quoteUtils";
import StatusBadge from "@/components/StatusBadge";

/** Orders the Telegram bot has taken — created by
 * app/api/telegram/webhook/route.js, not from this page. Every order
 * starts as "Pending Review"; move it through the rest of the statuses
 * as you work it. */
export default function TelegramOrdersPage() {
  const { telegramOrders, loading, updateTelegramOrderStatus, deleteTelegramOrder } = useAppData();
  const isBoss = useIsBoss();
  const [filter, setFilter] = useState("All");
  const [busyId, setBusyId] = useState(null);

  const filtered = useMemo(() => {
    const sorted = [...telegramOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return filter === "All" ? sorted : sorted.filter((o) => o.status === filter);
  }, [telegramOrders, filter]);

  async function handleStatusChange(order, status) {
    setBusyId(order.id);
    try {
      await updateTelegramOrderStatus(order.id, status);
    } catch (err) {
      alert(`Couldn't update status: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(order) {
    if (!confirm(`Delete this order (${order.productName} × ${order.quantity})?`)) return;
    try {
      await deleteTelegramOrder(order.id);
    } catch (err) {
      alert(`Couldn't delete: ${err.message}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Telegram Orders</h1>
        <p className="mt-1 text-sm text-muted">{telegramOrders.length} orders taken by the bot so far.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["All", ...TELEGRAM_ORDER_STATUSES].map((s) => (
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
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Telegram User</th>
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Qty</th>
              <th className="px-5 py-3 font-medium">Unit Price</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-5 py-3.5 text-muted">{o.createdAt}</td>
                <td className="px-5 py-3.5 text-muted">{o.telegramUsername ?? "—"}</td>
                <td className="px-5 py-3.5 font-medium text-ink">{o.productName}</td>
                <td className="px-5 py-3.5 text-muted">{o.quantity}</td>
                <td className="px-5 py-3.5 text-muted">{formatCurrency(o.unitPrice)}</td>
                <td className="px-5 py-3.5 text-ink">{formatCurrency(o.total)}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={o.status} />
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o, e.target.value)}
                      disabled={busyId === o.id}
                      className="rounded-md border border-border bg-surface-2 px-1.5 py-1 text-xs text-muted outline-none focus:border-accent disabled:opacity-50"
                      aria-label={`Change status for ${o.productName} order`}
                    >
                      {TELEGRAM_ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  {isBoss && (
                    <button
                      type="button"
                      onClick={() => handleDelete(o)}
                      className="text-xs font-medium text-muted hover:text-status-rejected"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-muted">
                  {loading
                    ? "Loading…"
                    : telegramOrders.length === 0
                    ? "No orders yet — they'll show up here as customers message the bot."
                    : "No orders match this filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
