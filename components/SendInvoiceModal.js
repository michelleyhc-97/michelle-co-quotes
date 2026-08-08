"use client";

import { useState } from "react";
import { buildInvoicePdfBlob, blobToBase64 } from "@/lib/pdf";

export default function SendInvoiceModal({ invoice, customer, onClose }) {
  const [to, setTo] = useState(customer?.email ?? "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sentOk, setSentOk] = useState(null); // null | true | false (false = logged only)

  async function handleSend(e) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const blob = await buildInvoicePdfBlob(invoice, customer);
      const pdfBase64 = await blobToBase64(blob);
      const invoiceLink = `${window.location.origin}/inv/${invoice.id}`;

      const res = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          customerName: customer?.contact || customer?.company,
          invoiceNumber: invoice.number,
          invoiceLink,
          message,
          pdfBase64,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to send.");
      setSentOk(data.sent);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-ink">Email Invoice to Customer</h2>
        <p className="mt-1 text-sm text-muted">
          Sends {invoice.number} as a PDF attachment, with a link to view it and see payment details online.
        </p>

        {sentOk === null ? (
          <form onSubmit={handleSend} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-muted">To</span>
              <input
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted">Message (optional)</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="A quick note to include above the invoice details…"
                className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </label>

            {error && <p className="text-sm font-medium text-status-rejected">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-accent/90 disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send Email"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4">
            {sentOk ? (
              <p className="text-sm font-medium text-status-accepted">Sent to {to}.</p>
            ) : (
              <p className="text-sm font-medium text-status-amendment">
                RESEND_API_KEY isn&apos;t set, so this was only logged to the server console
                instead of actually emailed. See the README to turn on real delivery.
              </p>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-accent/90"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
