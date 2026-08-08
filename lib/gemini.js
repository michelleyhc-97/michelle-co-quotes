import { GoogleGenAI } from "@google/genai";

// Server-only — GEMINI_API_KEY must never reach the browser. Route handlers
// call this; there is no client-side Gemini usage anywhere in this app.

// gemini-3.6-flash: the current stable "Flash" tier (Aug 2026) — balances
// speed and reasoning quality for exactly this kind of job (synthesize a
// short business narrative + recommendations from a compact stats object),
// at a fraction of Pro-tier cost. This panel is called on demand from a
// button, not on every page load, so a few cents per click is a non-issue;
// what matters is turnaround time and giving sensible business advice, not
// squeezing out the absolute cheapest per-token rate.
const MODEL = "gemini-3.6-flash";

let client = null;
function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

const INSIGHTS_SCHEMA = {
  type: "OBJECT",
  properties: {
    headline: {
      type: "STRING",
      description: "One sentence summing up the current state of the business, for a boss glancing at a dashboard.",
    },
    highlights: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "3-5 positive or neutral observations worth knowing, each a short standalone sentence.",
    },
    risks: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "0-5 concerns worth attention (e.g. overdue invoices, stalled quotes, concentration risk). Empty array if genuinely none.",
    },
    recommendations: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "2-4 concrete, specific next actions the boss could take this week.",
    },
  },
  required: ["headline", "highlights", "risks", "recommendations"],
};

/** Asks Gemini to turn a compact stats object (see lib/analyticsQueries.js)
 * into a short narrative + recommendations. All the numbers themselves are
 * computed deterministically before this is ever called — the model's job
 * is synthesis and business judgment, not arithmetic, so nothing here can
 * misreport a total. Returns null if GEMINI_API_KEY isn't configured. */
export async function generateInsights(stats) {
  const ai = getClient();
  if (!ai) return null;

  const prompt = `You are a business analyst reviewing the current state of a small creative agency's sales pipeline, based on the JSON snapshot below. All figures are in Malaysian Ringgit (RM). Be specific and reference actual numbers/names from the data — no generic advice. Keep every string concise (one sentence each).

DATA:
${JSON.stringify(stats)}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: INSIGHTS_SCHEMA,
    },
  });

  return JSON.parse(response.text);
}
