import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { computeQuoteTotals, formatCurrency, paymentMethodDetails } from "@/lib/quoteUtils";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, color: "#16181d", fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  tagline: { fontSize: 10, color: "#6b7280", marginTop: 2 },
  invoiceTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "right" },
  invoiceMeta: { fontSize: 10, color: "#6b7280", textAlign: "right", marginTop: 4 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 9, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  bold: { fontFamily: "Helvetica-Bold" },
  table: { borderTopWidth: 1, borderTopColor: "#d1d5db" },
  tableHeaderRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#d1d5db", paddingVertical: 6 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingVertical: 8 },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  headerCell: { fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 },
  totalsBlock: { marginTop: 16, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", width: 200, justifyContent: "space-between", paddingVertical: 4 },
  grandTotalRow: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#16181d",
  },
  notesBlock: { marginTop: 20 },
  paymentBlock: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
  },
  paymentRow: { marginBottom: 6 },
  paymentLabel: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  paymentDetail: { fontSize: 9, color: "#4b5563", marginTop: 1 },
  footer: { position: "absolute", bottom: 40, left: 48, right: 48, fontSize: 9, color: "#9ca3af", textAlign: "center" },
});

const currency = formatCurrency;

export default function InvoicePDFDocument({ invoice, customer, identity }) {
  const totals = computeQuoteTotals(invoice.subtotal, invoice.taxRate, invoice.serviceChargeRate);
  const methods = paymentMethodDetails(invoice.total);

  return (
    <Document title={`${invoice.number} — ${customer?.company ?? "Invoice"}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>{identity.companyName}</Text>
            <Text style={styles.tagline}>{identity.tagline}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceMeta}>{invoice.number}</Text>
            <Text style={styles.invoiceMeta}>Issued {invoice.issueDate}</Text>
            {invoice.dueDate && <Text style={styles.invoiceMeta}>Due {invoice.dueDate}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Bill to</Text>
          <Text style={styles.bold}>{customer?.company ?? "—"}</Text>
          {customer?.contact && <Text>{customer.contact}</Text>}
          {customer?.email && <Text>{customer.email}</Text>}
          {customer?.phone && <Text>{customer.phone}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDescription, styles.headerCell]}>Description</Text>
            <Text style={[styles.colQty, styles.headerCell]}>Qty</Text>
            <Text style={[styles.colPrice, styles.headerCell]}>Unit Price</Text>
            <Text style={[styles.colTotal, styles.headerCell]}>Total</Text>
          </View>
          {invoice.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.qty}</Text>
              <Text style={styles.colPrice}>{currency(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{currency(item.qty * item.unitPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{currency(totals.subtotal)}</Text>
          </View>
          {invoice.serviceChargeRate > 0 && (
            <View style={styles.totalRow}>
              <Text>Service Charge ({invoice.serviceChargeRate}%)</Text>
              <Text>{currency(totals.serviceChargeAmount)}</Text>
            </View>
          )}
          {invoice.taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text>SST ({invoice.taxRate}%)</Text>
              <Text>{currency(totals.taxAmount)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.bold}>Amount Due</Text>
            <Text style={styles.bold}>{currency(invoice.total)}</Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={styles.notesBlock}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        <View style={styles.paymentBlock}>
          <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>Payment Details</Text>
          {methods.map((m) => (
            <View key={m.label} style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{m.label}</Text>
              <Text style={styles.paymentDetail}>{m.detail}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          {identity.companyName} · Questions about this invoice? Just reply to the email it came with.
        </Text>
      </Page>
    </Document>
  );
}
