"use client";

import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/store";
import QuoteForm from "@/components/QuoteForm";

export default function NewQuotePage() {
  const router = useRouter();
  const { customers, addQuote } = useAppData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Create Quote</h1>
        <p className="mt-1 text-sm text-muted">Pick a customer, add line items, and save.</p>
      </div>

      <QuoteForm
        customers={customers}
        mode="create"
        onSave={(payload) => {
          addQuote({ ...payload, createdAt: new Date().toISOString().slice(0, 10) });
          router.push("/quotes");
        }}
      />
    </div>
  );
}
