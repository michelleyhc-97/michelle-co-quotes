"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/store";
import QuoteForm from "@/components/QuoteForm";

export default function NewQuotePage() {
  const router = useRouter();
  const { customers, addQuote } = useAppData();
  const [error, setError] = useState("");

  async function handleSave(payload) {
    setError("");
    try {
      await addQuote(payload);
      router.push("/quotes");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Create Quote</h1>
        <p className="mt-1 text-sm text-muted">Pick a customer, add line items, and save.</p>
      </div>

      {error && (
        <p className="rounded-lg bg-status-rejected/10 px-4 py-2.5 text-sm font-medium text-status-rejected">
          {error}
        </p>
      )}

      <QuoteForm customers={customers} mode="create" onSave={handleSave} />
    </div>
  );
}
