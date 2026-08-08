"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { IDENTITY, quoteTotal } from "./quoteUtils";

export const STATUSES = ["Draft", "Sent", "Accepted", "Rejected", "Amendment Requested"];
export { IDENTITY, quoteTotal };

const SEED_CUSTOMERS = [
  { id: "c1", company: "Nova Retail Co.", contact: "Jamie Reyes", email: "jamie@novaretail.com", phone: "+1 (555) 010-0101" },
  { id: "c2", company: "Skincare by Wren", contact: "Priya Kapoor", email: "priya@wrenskincare.com", phone: "+1 (555) 010-0148" },
  { id: "c3", company: "Andre's Coffee House", contact: "Andre Tan", email: "andre@coffeehouse.io", phone: "+1 (555) 010-0172" },
  { id: "c4", company: "Lumen Video Studio", contact: "Sofia Liang", email: "sofia@lumenstudio.com", phone: "+1 (555) 010-0199" },
  { id: "c5", company: "BrightPath Marketing", contact: "Owen Clarke", email: "owen@brightpathmkt.com", phone: "+1 (555) 010-0133" },
  { id: "c6", company: "Trailhead Outdoors", contact: "Maya Chen", email: "maya@trailheadoutdoors.com", phone: "+1 (555) 010-0187" },
];

function items(...rows) {
  return rows.map((r, i) => ({ id: `i${i}`, description: r[0], qty: r[1], unitPrice: r[2] }));
}

const SEED_QUOTES = [
  { id: "q1", number: "Q-2026-0001", customerId: "c1", status: "Accepted", createdAt: "2026-06-12",
    items: items(["Creative Strategy & Content Ideation", 1, 1200], ["Social Media Content Package", 3, 450]),
    amendmentReason: null, amendmentRequestedAt: null },
  { id: "q2", number: "Q-2026-0002", customerId: "c2", status: "Sent", createdAt: "2026-07-02",
    items: items(["Scriptwriting & Visual Storytelling", 2, 600]),
    amendmentReason: null, amendmentRequestedAt: null },
  { id: "q3", number: "Q-2026-0003", customerId: "c3", status: "Rejected", createdAt: "2026-07-15",
    items: items(["Brand Voice & Messaging Guide", 1, 900]),
    amendmentReason: null, amendmentRequestedAt: null },
  { id: "q4", number: "Q-2026-0004", customerId: "c4", status: "Accepted", createdAt: "2026-07-20",
    items: items(["Creative Production & Digital Content Creation", 1, 3200]),
    amendmentReason: null, amendmentRequestedAt: null },
  { id: "q5", number: "Q-2026-0005", customerId: "c5", status: "Draft", createdAt: "2026-08-01",
    items: items(["Creative Strategy & Content Ideation", 1, 1200], ["Scriptwriting & Visual Storytelling", 1, 600]),
    amendmentReason: null, amendmentRequestedAt: null },
  { id: "q6", number: "Q-2026-0006", customerId: "c6", status: "Amendment Requested", createdAt: "2026-08-03",
    items: items(["Social Media Content Package", 6, 450]),
    amendmentReason: "Can we swap the social package for fewer, higher-production videos instead? Budget's the same but we'd rather have quality over quantity.",
    amendmentRequestedAt: "2026-08-05" },
  { id: "q7", number: "Q-2026-0007", customerId: "c1", status: "Draft", createdAt: "2026-08-06",
    items: items(["Creative Production & Digital Content Creation", 1, 2800]),
    amendmentReason: null, amendmentRequestedAt: null },
  { id: "q8", number: "Q-2026-0008", customerId: "c2", status: "Accepted", createdAt: "2026-08-07",
    items: items(["Brand Voice & Messaging Guide", 1, 900], ["Scriptwriting & Visual Storytelling", 1, 600]),
    amendmentReason: null, amendmentRequestedAt: null },
];

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [customers, setCustomers] = useState(SEED_CUSTOMERS);
  const [quotes, setQuotes] = useState(SEED_QUOTES);

  const getCustomer = useCallback(
    (id) => customers.find((c) => c.id === id) ?? null,
    [customers]
  );

  const addCustomer = useCallback((customer) => {
    const id = `c${Date.now()}`;
    setCustomers((prev) => [...prev, { id, ...customer }]);
    return id;
  }, []);

  const updateCustomer = useCallback((id, patch) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const deleteCustomer = useCallback((id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const quoteCountForCustomer = useCallback(
    (id) => quotes.filter((q) => q.customerId === id).length,
    [quotes]
  );

  const addQuote = useCallback((quote) => {
    setQuotes((prev) => {
      const number = `Q-2026-${String(prev.length + 1).padStart(4, "0")}`;
      const id = `q${Date.now()}`;
      return [...prev, { id, number, amendmentReason: null, amendmentRequestedAt: null, ...quote }];
    });
  }, []);

  const updateQuote = useCallback((id, patch) => {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }, []);

  const updateQuoteStatus = useCallback((id, status) => {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
  }, []);

  const deleteQuote = useCallback((id) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const getQuote = useCallback(
    (id) => quotes.find((q) => q.id === id) ?? null,
    [quotes]
  );

  // Customer-facing actions — called from the public /q/[id] quote view,
  // which has no login. Still just mutating the same in-memory store.
  const requestAmendment = useCallback((id, reason) => {
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              status: "Amendment Requested",
              amendmentReason: reason,
              amendmentRequestedAt: new Date().toISOString().slice(0, 10),
            }
          : q
      )
    );
  }, []);

  const respondToQuote = useCallback((id, decision) => {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status: decision } : q)));
  }, []);

  const value = useMemo(
    () => ({
      customers,
      quotes,
      getCustomer,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      quoteCountForCustomer,
      getQuote,
      addQuote,
      updateQuote,
      updateQuoteStatus,
      deleteQuote,
      requestAmendment,
      respondToQuote,
    }),
    [
      customers,
      quotes,
      getCustomer,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      quoteCountForCustomer,
      getQuote,
      addQuote,
      updateQuote,
      updateQuoteStatus,
      deleteQuote,
      requestAmendment,
      respondToQuote,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
