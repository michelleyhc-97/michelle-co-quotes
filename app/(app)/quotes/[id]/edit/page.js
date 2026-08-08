"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAppData } from "@/lib/store";
import { useIsBoss } from "@/lib/UserContext";
import QuoteForm from "@/components/QuoteForm";
import SendQuoteModal from "@/components/SendQuoteModal";
import { buildQuotePdfBlob, downloadBlob } from "@/lib/pdf";

export default function EditQuotePage() {
  const { id } = useParams();
  const router = useRouter();
  const { customers, getCustomer, getQuote, updateQuote, deleteQuote } = useAppData();
  const isBoss = useIsBoss();
  const quote = getQuote(id);

  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!quote) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-ink">Quote not found</h1>
        <p className="text-sm text-muted">
          It may have been deleted, or this is a fresh page load — remember, nothing
          persists yet, so a reload resets the mock data.
        </p>
        <Link href="/quotes" className="text-sm font-medium text-accent hover:underline">
          ← Back to Quote Records
        </Link>
      </div>
    );
  }

  const customer = getCustomer(quote.customerId);
  const customerLink = typeof window !== "undefined" ? `${window.location.origin}/q/${quote.id}` : "";

  function handleDelete() {
    if (!confirm(`Delete ${quote.number}? This can't be undone.`)) return;
    deleteQuote(quote.id);
    router.push("/quotes");
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

  function handleCopyLink() {
    navigator.clipboard?.writeText(customerLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleSave(payload) {
    updateQuote(quote.id, {
      ...payload,
      // Resolving the quote (changing it away from "Amendment Requested")
      // clears the old reason so it doesn't linger as stale context.
      amendmentReason: payload.status === "Amendment Requested" ? quote.amendmentReason : null,
      amendmentRequestedAt: payload.status === "Amendment Requested" ? quote.amendmentRequestedAt : null,
    });
    router.push("/quotes");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Edit {quote.number}</h1>
          <p className="mt-1 text-sm text-muted">Update the customer, items, or status.</p>
        </div>
        {isBoss && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-status-rejected/30 px-4 py-2 text-sm font-semibold text-status-rejected hover:bg-status-rejected/10"
          >
            Delete Quote
          </button>
        )}
      </div>

      {quote.status === "Amendment Requested" && quote.amendmentReason && (
        <div className="rounded-xl border border-status-amendment/30 bg-status-amendment/10 p-4">
          <p className="text-sm font-semibold text-status-amendment">
            Customer requested changes on {quote.amendmentRequestedAt}
          </p>
          <p className="mt-1 text-sm text-ink/80">&ldquo;{quote.amendmentReason}&rdquo;</p>
          <p className="mt-2 text-xs text-muted">
            Update the quote below, then change its status away from &ldquo;Amendment
            Requested&rdquo; and resend it once you&apos;re ready.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-surface-2 disabled:opacity-50"
        >
          {downloading ? "Preparing…" : "Download PDF"}
        </button>
        <button
          type="button"
          onClick={() => setSendModalOpen(true)}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-surface-2"
        >
          Email to Customer
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-surface-2"
        >
          {copied ? "Link copied!" : "Copy Customer Link"}
        </button>
        <span className="text-xs text-faint">
          The customer link lets them view the quote and accept, reject, or request changes
          — no login needed.
        </span>
      </div>

      <QuoteForm
        customers={customers}
        mode="edit"
        initialCustomerId={quote.customerId}
        initialItems={quote.items}
        initialStatus={quote.status}
        onSave={handleSave}
      />

      {sendModalOpen && (
        <SendQuoteModal quote={quote} customer={customer} onClose={() => setSendModalOpen(false)} />
      )}
    </div>
  );
}
