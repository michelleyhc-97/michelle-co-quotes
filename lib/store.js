"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { IDENTITY, quoteTotal } from "./quoteUtils";

export const STATUSES = ["Draft", "Sent", "Accepted", "Rejected", "Amendment Requested"];
export const INVOICE_STATUSES = ["Unpaid", "Paid", "Overdue", "Cancelled"];
export const TELEGRAM_ORDER_STATUSES = [
  "Pending Review",
  "Pending Approval",
  "Pending Payment",
  "Pending Content Creation",
  "Processed",
  "Cancelled",
];
export { IDENTITY, quoteTotal };

async function api(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || `Request to ${url} failed (${res.status}).`);
  }
  return data;
}

const AppDataContext = createContext(null);

/** Loads customers and quotes from Supabase (via this app's own API
 * routes — see lib/supabaseAdmin.js for why the browser never talks to
 * Supabase directly) and keeps them in sync as the UI makes changes. */
export function AppDataProvider({ children }) {
  const pathname = usePathname();
  // /login, /q/[id], and /inv/[id] are public pages with no session cookie
  // — fetching here would just be a guaranteed 401. Those pages fetch their
  // own data directly from their public API instead (see app/q/[id]/page.js
  // and app/inv/[id]/page.js).
  const isPublicRoute =
    pathname === "/login" || pathname?.startsWith("/q/") || pathname?.startsWith("/inv/");

  const [customers, setCustomers] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [telegramOrders, setTelegramOrders] = useState([]);
  const [loading, setLoading] = useState(!isPublicRoute);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [customersData, quotesData, invoicesData, productsData, telegramOrdersData] = await Promise.all([
        api("/api/customers"),
        api("/api/quotes"),
        api("/api/invoices"),
        api("/api/products"),
        api("/api/telegram-orders"),
      ]);
      setCustomers(customersData.customers);
      setQuotes(quotesData.quotes);
      setInvoices(invoicesData.invoices);
      setProducts(productsData.products);
      setTelegramOrders(telegramOrdersData.telegramOrders);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // refresh() sets state asynchronously (after its own await), not
    // synchronously within this effect — the standard "fetch on mount"
    // pattern. This rule's static analysis can't tell the two apart.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isPublicRoute) refresh();
  }, [isPublicRoute, refresh]);

  const getCustomer = useCallback(
    (id) => customers.find((c) => c.id === id) ?? null,
    [customers]
  );

  const getQuote = useCallback((id) => quotes.find((q) => q.id === id) ?? null, [quotes]);

  const quoteCountForCustomer = useCallback(
    (id) => quotes.filter((q) => q.customerId === id).length,
    [quotes]
  );

  const addCustomer = useCallback(async (customer) => {
    const { customer: created } = await api("/api/customers", {
      method: "POST",
      body: JSON.stringify(customer),
    });
    setCustomers((prev) => [...prev, created]);
    return created.id;
  }, []);

  const updateCustomer = useCallback(async (id, patch) => {
    const { customer: updated } = await api(`/api/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  const deleteCustomer = useCallback(async (id) => {
    await api(`/api/customers/${id}`, { method: "DELETE" });
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setQuotes((prev) => prev.map((q) => (q.customerId === id ? { ...q, customerId: null } : q)));
  }, []);

  const addQuote = useCallback(async (quote) => {
    const { quote: created } = await api("/api/quotes", {
      method: "POST",
      body: JSON.stringify(quote),
    });
    setQuotes((prev) => [created, ...prev]);
    return created.id;
  }, []);

  const updateQuote = useCallback(async (id, patch) => {
    const { quote: updated } = await api(`/api/quotes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)));
  }, []);

  const updateQuoteStatus = useCallback(async (id, status) => {
    const { quote: updated } = await api(`/api/quotes/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)));
  }, []);

  const deleteQuote = useCallback(async (id) => {
    await api(`/api/quotes/${id}`, { method: "DELETE" });
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const getInvoice = useCallback(
    (id) => invoices.find((i) => i.id === id) ?? null,
    [invoices]
  );

  const invoiceForQuote = useCallback(
    (quoteId) => invoices.find((i) => i.quoteId === quoteId) ?? null,
    [invoices]
  );

  const addInvoiceFromQuote = useCallback(async (quoteId, details) => {
    const { invoice: created } = await api("/api/invoices", {
      method: "POST",
      body: JSON.stringify({ quoteId, ...details }),
    });
    setInvoices((prev) => [created, ...prev]);
    return created.id;
  }, []);

  const updateInvoice = useCallback(async (id, patch) => {
    const { invoice: updated } = await api(`/api/invoices/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setInvoices((prev) => prev.map((i) => (i.id === id ? updated : i)));
  }, []);

  const deleteInvoice = useCallback(async (id) => {
    await api(`/api/invoices/${id}`, { method: "DELETE" });
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addProduct = useCallback(async (product) => {
    const { product: created } = await api("/api/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
    setProducts((prev) => [...prev, created]);
    return created.id;
  }, []);

  const updateProduct = useCallback(async (id, patch) => {
    const { product: updated } = await api(`/api/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }, []);

  const deleteProduct = useCallback(async (id) => {
    await api(`/api/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateTelegramOrderStatus = useCallback(async (id, status) => {
    const { telegramOrder: updated } = await api(`/api/telegram-orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setTelegramOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
  }, []);

  const deleteTelegramOrder = useCallback(async (id) => {
    await api(`/api/telegram-orders/${id}`, { method: "DELETE" });
    setTelegramOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      customers,
      quotes,
      invoices,
      products,
      telegramOrders,
      loading,
      error,
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
      getInvoice,
      invoiceForQuote,
      addInvoiceFromQuote,
      updateInvoice,
      deleteInvoice,
      addProduct,
      updateProduct,
      deleteProduct,
      updateTelegramOrderStatus,
      deleteTelegramOrder,
      refresh,
    }),
    [
      customers,
      quotes,
      invoices,
      products,
      telegramOrders,
      loading,
      error,
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
      getInvoice,
      invoiceForQuote,
      addInvoiceFromQuote,
      updateInvoice,
      deleteInvoice,
      addProduct,
      updateProduct,
      deleteProduct,
      updateTelegramOrderStatus,
      deleteTelegramOrder,
      refresh,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
