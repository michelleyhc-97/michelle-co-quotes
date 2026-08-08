import { Resend } from "resend";
import { IDENTITY } from "@/lib/quoteUtils";

// Public endpoint (see proxy.js) — called from the customer-facing /q/[id]
// page when a customer accepts, rejects, or requests an amendment. Emails
// the internal team so they actually find out, even though the status
// change itself only lives in that browser's in-memory store for now.
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const { quoteNumber, customerName, action, reason } = body ?? {};

  if (!quoteNumber || !action) {
    return Response.json({ ok: false, error: "Missing quote number or action." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const subject =
    action === "amendment"
      ? `Amendment requested on ${quoteNumber}`
      : `${customerName || "A customer"} ${action === "accept" ? "accepted" : "rejected"} ${quoteNumber}`;

  if (!apiKey) {
    console.log(`[notify-amendment] ${subject}${reason ? ` — reason: ${reason}` : ""} (RESEND_API_KEY not set — logging only).`);
    return Response.json({ ok: true, sent: false });
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Michelle & Co. Quotes <onboarding@resend.dev>",
      to: IDENTITY.email,
      subject,
      html: `
        <p><strong>${escapeHtml(customerName || "A customer")}</strong> ${describeAction(action)} <strong>${escapeHtml(quoteNumber)}</strong>.</p>
        ${reason ? `<p><strong>Reason given:</strong><br />${escapeHtml(reason)}</p>` : ""}
      `,
    });
    if (error) throw new Error(error.message || "Resend API error");
    return Response.json({ ok: true, sent: true });
  } catch (err) {
    console.error("Failed to send amendment notification:", err);
    // Don't fail the customer's action just because the notification email
    // didn't go out — the status change itself already succeeded client-side.
    return Response.json({ ok: true, sent: false, error: err.message });
  }
}

function describeAction(action) {
  if (action === "accept") return "accepted";
  if (action === "reject") return "rejected";
  return "requested changes to";
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
