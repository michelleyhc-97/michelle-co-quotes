import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { quoteTotal } from "@/lib/quoteUtils";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, color: "#16181d", fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  tagline: { fontSize: 10, color: "#6b7280", marginTop: 2 },
  quoteTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "right" },
  quoteMeta: { fontSize: 10, color: "#6b7280", textAlign: "right", marginTop: 4 },
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
  amendmentBox: {
    marginTop: 24,
    padding: 12,
    backgroundColor: "#fdf3e0",
    borderWidth: 1,
    borderColor: "#e8c778",
    borderRadius: 4,
  },
  footer: { position: "absolute", bottom: 40, left: 48, right: 48, fontSize: 9, color: "#9ca3af", textAlign: "center" },
});

const currency = (n) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function QuotePDFDocument({ quote, customer, identity }) {
  const total = quoteTotal(quote);

  return (
    <Document title={`${quote.number} — ${customer?.company ?? "Quote"}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>{identity.companyName}</Text>
            <Text style={styles.tagline}>{identity.tagline}</Text>
          </View>
          <View>
            <Text style={styles.quoteTitle}>QUOTE</Text>
            <Text style={styles.quoteMeta}>{quote.number}</Text>
            <Text style={styles.quoteMeta}>{quote.createdAt}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Prepared for</Text>
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
          {quote.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.qty}</Text>
              <Text style={styles.colPrice}>{currency(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{currency(item.qty * item.unitPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.grandTotalRow}>
            <Text style={styles.bold}>Grand Total</Text>
            <Text style={styles.bold}>{currency(total)}</Text>
          </View>
        </View>

        {quote.status === "Amendment Requested" && quote.amendmentReason && (
          <View style={styles.amendmentBox}>
            <Text style={[styles.bold, { marginBottom: 4 }]}>
              Customer requested changes ({quote.amendmentRequestedAt})
            </Text>
            <Text>{quote.amendmentReason}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          {identity.companyName} · Questions about this quote? Just reply to the email it came with.
        </Text>
      </Page>
    </Document>
  );
}
