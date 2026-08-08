"use client";

import { useState } from "react";
import { STATUSES } from "@/lib/store";

const emptyItem = () => ({ id: crypto.randomUUID(), description: "", qty: 1, unitPrice: 0 });

const currency = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

/**
 * Shared line-item form used by both "Create Quote" and "Edit Quote".
 *
 * mode="create" shows Draft/Sent save buttons.
 * mode="edit" shows a status selector + a single Save Changes button.
 */
export default function QuoteForm({
  customers,
  initialCustomerId = "",
  initialItems,
  initialStatus = "Draft",
  mode = "create",
  onSave,
}) {
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [items, setItems] = useState(() =>
    initialItems && initialItems.length > 0
      ? initialItems.map((i) => ({ ...i }))
      : [emptyItem()]
  );
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState("");

  const grandTotal = items.reduce(
    (sum, i) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0),
    0
  );

  function updateItem(id, patch) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(id) {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
  }

  function validate() {
    if (!customerId) return "Please select a customer.";
    if (items.some((i) => !i.description.trim())) return "Every line item needs a description.";
    if (items.some((i) => Number(i.qty) <= 0)) return "Quantity must be at least 1.";
    return "";
  }

  function handleSave(explicitStatus) {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave({
      customerId,
      status: explicitStatus ?? status,
      items: items.map(({ id, description, qty, unitPrice }) => ({
        id,
        description: description.trim(),
        qty: Number(qty),
        unitPrice: Number(unitPrice),
      })),
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-5">
        <label className="block max-w-sm">
          <span className="text-xs font-medium text-muted">Customer</span>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company} — {c.contact}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Line Items</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-faint">
              <th className="px-5 py-2.5 font-medium">Description</th>
              <th className="w-24 px-3 py-2.5 font-medium">Qty</th>
              <th className="w-36 px-3 py-2.5 font-medium">Unit Price</th>
              <th className="w-36 px-3 py-2.5 font-medium">Line Total</th>
              <th className="w-10 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="px-5 py-2.5">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    placeholder="e.g. Creative Strategy & Content Ideation"
                    className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-ink outline-none focus:border-accent focus:bg-surface-2"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateItem(item.id, { qty: e.target.value })}
                    className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-ink outline-none focus:border-accent focus:bg-surface-2"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1 rounded-md border border-transparent px-2 focus-within:border-accent focus-within:bg-surface-2">
                    <span className="text-faint">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, { unitPrice: e.target.value })}
                      className="w-full bg-transparent py-1.5 text-ink outline-none"
                    />
                  </div>
                </td>
                <td className="px-3 py-2.5 text-ink">
                  {currency((Number(item.qty) || 0) * (Number(item.unitPrice) || 0))}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="text-faint hover:text-status-rejected disabled:opacity-30"
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={addItem}
            className="text-sm font-medium text-accent hover:underline"
          >
            + Add item
          </button>
          <div className="text-right">
            <span className="mr-3 text-sm text-muted">Grand Total</span>
            <span className="text-lg font-semibold text-ink">{currency(grandTotal)}</span>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-status-rejected/10 px-4 py-2.5 text-sm font-medium text-status-rejected">
          {error}
        </p>
      )}

      {mode === "create" ? (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => handleSave("Draft")}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-2"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave("Sent")}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink hover:bg-accent/90"
          >
            Save & Mark as Sent
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => handleSave()}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink hover:bg-accent/90"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
