import { pdf } from "@react-pdf/renderer";
import QuotePDFDocument from "@/components/QuotePDFDocument";
import InvoicePDFDocument from "@/components/InvoicePDFDocument";
import { IDENTITY } from "@/lib/quoteUtils";

/** Renders a quote to a PDF Blob, entirely client-side (no server call). */
export async function buildQuotePdfBlob(quote, customer) {
  const doc = <QuotePDFDocument quote={quote} customer={customer} identity={IDENTITY} />;
  return pdf(doc).toBlob();
}

/** Renders an invoice to a PDF Blob, entirely client-side. */
export async function buildInvoicePdfBlob(invoice, customer) {
  const doc = <InvoicePDFDocument invoice={invoice} customer={customer} identity={IDENTITY} />;
  return pdf(doc).toBlob();
}

/** Triggers a browser download of the given blob. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Converts a Blob to a base64 string (no data: prefix) for sending to an
 * API route as JSON. */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      const base64 = typeof result === "string" ? result.split(",")[1] : "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
