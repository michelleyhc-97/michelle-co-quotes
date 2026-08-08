import { Resend } from "resend";

// Sends an invoice PDF to a customer via Resend. Mirrors /api/send-quote —
// the PDF is generated client-side and passed here as base64; this route's
// only job is delivery.
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const { to, customerName, invoiceNumber, invoiceLink, message, pdfBase64 } = body ?? {};

  if (!to || !invoiceNumber || !pdfBase64) {
    return Response.json(
      { ok: false, error: "Missing recipient, invoice number, or PDF data." },
      { status: 400 }
    );
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(to)) {
    return Response.json({ ok: false, error: "That email address doesn't look valid." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`Would email ${invoiceNumber} to ${to} (RESEND_API_KEY not set — logging only).`);
    return Response.json({ ok: true, sent: false });
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Michelle & Co. Invoices <onboarding@resend.dev>",
      to,
      subject: `Invoice ${invoiceNumber} from Michelle & Co. Creatives`,
      html: `
        <p>Hi ${escapeHtml(customerName || "there")},</p>
        <p>${escapeHtml(message) || `Please find invoice ${escapeHtml(invoiceNumber)} attached.`}</p>
        ${
          invoiceLink
            ? `<p>You can also view it online, see payment details, and download the PDF here: <a href="${escapeHtml(invoiceLink)}">${escapeHtml(invoiceLink)}</a></p>`
            : ""
        }
        <p>Thanks!</p>
      `,
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (error) throw new Error(error.message || "Resend API error");
    return Response.json({ ok: true, sent: true });
  } catch (err) {
    console.error("Failed to send invoice email:", err);
    return Response.json(
      { ok: false, error: "Couldn't send the email. Please try again." },
      { status: 502 }
    );
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
