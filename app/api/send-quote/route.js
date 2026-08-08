import { Resend } from "resend";

// Sends a quote PDF to a customer via Resend. The PDF is generated
// client-side (the quote data only exists in the browser's in-memory mock
// store) and passed here as base64 — this route's only job is delivery.
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const { to, customerName, quoteNumber, quoteLink, message, pdfBase64 } = body ?? {};

  if (!to || !quoteNumber || !pdfBase64) {
    return Response.json(
      { ok: false, error: "Missing recipient, quote number, or PDF data." },
      { status: 400 }
    );
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(to)) {
    return Response.json({ ok: false, error: "That email address doesn't look valid." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`Would email ${quoteNumber} to ${to} (RESEND_API_KEY not set — logging only).`);
    return Response.json({ ok: true, sent: false });
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Michelle & Co. Quotes <onboarding@resend.dev>",
      to,
      subject: `Your quote ${quoteNumber} from Michelle & Co. Creatives`,
      html: `
        <p>Hi ${escapeHtml(customerName || "there")},</p>
        <p>${escapeHtml(message) || `Please find your quote ${escapeHtml(quoteNumber)} attached.`}</p>
        ${
          quoteLink
            ? `<p>You can also view it online and accept, reject, or request changes here: <a href="${escapeHtml(quoteLink)}">${escapeHtml(quoteLink)}</a></p>`
            : ""
        }
        <p>Thanks!</p>
      `,
      attachments: [
        {
          filename: `${quoteNumber}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (error) throw new Error(error.message || "Resend API error");
    return Response.json({ ok: true, sent: true });
  } catch (err) {
    console.error("Failed to send quote email:", err);
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
