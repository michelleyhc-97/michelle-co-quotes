"use client";

import { useState } from "react";
import { useAppData } from "@/lib/store";
import { useIsBoss } from "@/lib/UserContext";

const EMPTY_FORM = { company: "", contact: "", email: "", phone: "" };

export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, quoteCountForCustomer } =
    useAppData();
  const isBoss = useIsBoss();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(customer) {
    setEditingId(customer.id);
    setForm({
      company: customer.company,
      contact: customer.contact,
      email: customer.email,
      phone: customer.phone,
    });
    setOpen(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.company.trim()) return;
    if (editingId) {
      updateCustomer(editingId, form);
    } else {
      addCustomer(form);
    }
    setForm(EMPTY_FORM);
    setOpen(false);
  }

  function handleDelete(customer) {
    const count = quoteCountForCustomer(customer.id);
    const warning =
      count > 0
        ? ` This customer has ${count} quote${count === 1 ? "" : "s"} on file — they'll stay, just without a linked customer.`
        : "";
    if (!confirm(`Delete ${customer.company}?${warning}`)) return;
    deleteCustomer(customer.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Customers</h1>
          <p className="mt-1 text-sm text-muted">{customers.length} companies on file.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent/90"
        >
          + Add Customer
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-faint">
              <th className="px-5 py-3 font-medium">Company</th>
              <th className="px-5 py-3 font-medium">Contact Person</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-5 py-3.5 font-medium text-ink">{c.company}</td>
                <td className="px-5 py-3.5 text-muted">{c.contact}</td>
                <td className="px-5 py-3.5 text-muted">
                  <a href={`mailto:${c.email}`} className="hover:text-accent">
                    {c.email}
                  </a>
                </td>
                <td className="px-5 py-3.5 text-muted">{c.phone}</td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="text-xs font-medium text-muted hover:text-accent"
                    >
                      Edit
                    </button>
                    {isBoss && (
                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        className="text-xs font-medium text-muted hover:text-status-rejected"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted">
                  No customers yet.
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
              {editingId ? "Edit Customer" : "Add Customer"}
            </h2>
            <div className="mt-4 space-y-3">
              <Field label="Company name">
                <Input value={form.company} onChange={set("company")} required autoFocus />
              </Field>
              <Field label="Contact person">
                <Input value={form.contact} onChange={set("contact")} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={set("email")} />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={set("phone")} />
              </Field>
            </div>
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
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-accent/90"
              >
                Save
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
