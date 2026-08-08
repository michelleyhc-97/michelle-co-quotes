"use client";

import { useState } from "react";
import { useAppData } from "@/lib/store";
import { useIsBoss } from "@/lib/UserContext";
import { formatCurrency } from "@/lib/quoteUtils";

const EMPTY_FORM = { name: "", unitPrice: "" };

/** The price list the Telegram bot looks up against — see
 * app/api/telegram/webhook/route.js. A product's `name` must match what a
 * customer types (case-insensitive), so keep names short and simple. */
export default function ProductsPage() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useAppData();
  const isBoss = useIsBoss();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setOpen(true);
  }

  function openEdit(product) {
    setEditingId(product.id);
    setForm({ name: product.name, unitPrice: String(product.unitPrice) });
    setFormError("");
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setFormError("");
    try {
      const payload = { name: form.name.trim(), unitPrice: Number(form.unitPrice) || 0 };
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await addProduct(payload);
      }
      setForm(EMPTY_FORM);
      setOpen(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    if (!confirm(`Delete ${product.name}? The bot won't be able to quote it anymore.`)) return;
    try {
      await deleteProduct(product.id);
    } catch (err) {
      alert(`Couldn't delete: ${err.message}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Products</h1>
          <p className="mt-1 text-sm text-muted">
            {products.length} products on file — this is the price list the Telegram bot quotes from.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent/90"
        >
          + Add Product
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-faint">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Unit Price</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-5 py-3.5 font-medium text-ink">{p.name}</td>
                <td className="px-5 py-3.5 text-muted">{formatCurrency(p.unitPrice)}</td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="text-xs font-medium text-muted hover:text-accent"
                    >
                      Edit
                    </button>
                    {isBoss && (
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="text-xs font-medium text-muted hover:text-status-rejected"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-muted">
                  {loading ? "Loading…" : "No products yet — add one so the bot can quote it."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6"
          >
            <h2 className="text-lg font-semibold text-ink">
              {editingId ? "Edit Product" : "Add Product"}
            </h2>
            <div className="mt-4 space-y-3">
              <Field label="Name">
                <Input value={form.name} onChange={set("name")} required autoFocus />
              </Field>
              <Field label="Unit Price (RM)">
                <Input type="number" min="0" step="0.01" value={form.unitPrice} onChange={set("unitPrice")} />
              </Field>
            </div>

            {formError && (
              <p className="mt-3 text-sm font-medium text-status-rejected">{formError}</p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-accent/90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
    />
  );
}
