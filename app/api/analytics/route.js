import { computeBusinessStats } from "@/lib/analyticsQueries";
import { generateInsights } from "@/lib/gemini";

// Requires a session (not in proxy.js's public-path list) — this exposes
// aggregated business figures, so it gets the same auth as /api/quotes etc.
export async function GET() {
  try {
    const stats = await computeBusinessStats();

    let insights = null;
    let insightsError = null;
    try {
      insights = await generateInsights(stats);
      if (!insights) insightsError = "GEMINI_API_KEY isn't set — showing the numbers without AI commentary.";
    } catch (err) {
      console.error("Gemini insights failed:", err);
      insightsError = "Couldn't reach Gemini for commentary — showing the numbers on their own.";
    }

    return Response.json({ ok: true, stats, insights, insightsError });
  } catch (err) {
    console.error("GET /api/analytics failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
