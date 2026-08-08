"use client";

import { useAppData } from "@/lib/store";
import { useIsBoss } from "@/lib/UserContext";
import { formatCurrency } from "@/lib/quoteUtils";

/** Read-only list of orders the Telegram bot has taken — created by
 * app/api/telegram/webhook/route.js, not from this page. */
export default function TelegramOrdersPage() {
  const { telegramOrders, loading, deleteTelegramOrder } = useAppData();
  const isBoss = useIsBoss();

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
        <p className="mt-1 text-sm text-muted">
          {telegramOrders.length} orders taken by the bot so far.
        </p>
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
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {telegramOrders.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-5 py-3.5 text-muted">{o.createdAt}</td>
                <td className="px-5 py-3.5 text-muted">{o.telegramUsername ?? "—"}</td>
                <td className="px-5 py-3.5 font-medium text-ink">{o.productName}</td>
                <td className="px-5 py-3.5 text-muted">{o.quantity}</td>
                <td className="px-5 py-3.5 text-muted">{formatCurrency(o.unitPrice)}</td>
                <td className="px-5 py-3.5 text-ink">{formatCurrency(o.total)}</td>
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
            {telegramOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted">
                  {loading ? "Loading…" : "No orders yet — they'll show up here as customers message the bot."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
