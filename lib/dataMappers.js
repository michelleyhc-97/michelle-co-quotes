// Translates between the database's existing column names (snake_case,
// with a couple of invoicing fields the app doesn't have UI for yet —
// tax_rate, valid_until, notes) and the app's existing JS shape (camelCase)
// that every page component already expects. Keeping this mapping in one
// place meant zero changes were needed to the page components when the
// data layer moved from in-memory mock state to Supabase.

export function customerFromRow(row) {
  return {
    id: row.id,
    company: row.company_name,
    contact: row.contact_person,
    email: row.email,
    phone: row.phone,
  };
}

export function customerToRow(customer) {
  return {
    company_name: customer.company,
    contact_person: customer.contact,
    email: customer.email,
    phone: customer.phone,
  };
}

export function itemFromRow(row) {
  return {
    id: row.id,
    description: row.description,
    qty: Number(row.quantity),
    unitPrice: Number(row.unit_price),
  };
}

export function quoteFromRow(row, itemRows = []) {
  return {
    id: row.id,
    number: row.quote_number,
    customerId: row.customer_id,
    status: row.status,
    subtotal: Number(row.subtotal),
    taxRate: Number(row.tax_rate) || 0,
    serviceChargeRate: Number(row.service_charge_rate) || 0,
    total: Number(row.total),
    createdAt: String(row.created_at).slice(0, 10),
    amendmentReason: row.amendment_reason ?? null,
    amendmentRequestedAt: row.amendment_requested_at ?? null,
    items: itemRows.map(itemFromRow),
  };
}
