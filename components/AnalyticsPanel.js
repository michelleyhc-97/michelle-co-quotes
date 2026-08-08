"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/quoteUtils";

const currency = (n) => formatCurrency(n, { decimals: 0 });

function monthLabel(month) {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

/** Dashboard's "AI Insights" section — click Generate, get a deterministic
 * stats snapshot (computed server-side from real customer/quote/invoice
 * rows) plus a short narrative from Gemini synthesizing what it means.
 * Nothing auto-runs on page load, so this only costs an API call when you
 * actually ask for one. */
export default function AnalyticsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState(null);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analytics");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Analysis failed.");
      setData(json);
      setGeneratedAt(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const stats = data?.stats;
  const insights = data?.insights;
  const maxMonthly = stats ? Math.max(1, ...stats.monthlyRevenue.map((m) => m.total)) : 1;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">AI Insights</h2>
          <p className="mt-0.5 text-xs text-faint">
            {generatedAt
              ? `Generated ${generatedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
              : "Analyzes your real customer, quote, and invoice data — nothing runs until you ask."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? "Analyzing…" : data ? "Refresh Analysis" : "Generate Insights"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-status-rejected/10 px-4 py-2.5 text-sm font-medium text-status-rejected">
          {error}
        </p>
      )}

      {stats && (
        <div className="mt-5 space-y-6">
          {insights ? (
            <div className="space-y-4">
              <p className="text-base font-medium text-ink">{insights.headline}</p>

              <div className="grid gap-4 sm:grid-cols-3">
                <InsightList title="Highlights" items={insights.highlights} tone="accepted" />
                <InsightList title="Risks" items={insights.risks} tone="rejected" />
                <InsightList title="Recommendations" items={insights.recommendations} tone="sent" />
              </div>
            </div>
          ) : (
            data.insightsError && (
              <p className="rounded-lg bg-status-amendment/10 px-4 py-2.5 text-sm font-medium text-status-amendment">
                {data.insightsError}
              </p>
            )
          )}

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-3 lg:grid-cols-6">
            <MiniStat label="Quote Pipeline" value={currency(stats.quotes.totalValue)} />
            <MiniStat label="Accepted Value" value={currency(stats.quotes.acceptedValue)} />
            <MiniStat
              label="Conversion"
              value={stats.quotes.conversionRatePercent != null ? `${stats.quotes.conversionRatePercent}%` : "—"}
            />
            <MiniStat label="Total Billed" value={currency(stats.invoices.totalBilled)} />
            <MiniStat label="Outstanding" value={currency(stats.invoices.totalOutstanding)} />
            <MiniStat
              label="Overdue"
              value={currency(stats.invoices.overdueAmount)}
              warn={stats.invoices.overdueAmount > 0}
            />
          </div>

          <div className="grid gap-6 border-t border-border pt-5 lg:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-faint">Top Customers</h3>
              <div className="mt-3 space-y-2">
                {stats.topCustomers.length === 0 && <p className="text-sm text-muted">No quotes yet.</p>}
                {stats.topCustomers.map((c) => (
                  <div key={c.company} className="flex items-center justify-between text-sm">
                    <span className="text-ink">
                      {c.company}
                      <span className="ml-1.5 text-xs text-faint">
                        ({c.quoteCount} quote{c.quoteCount === 1 ? "" : "s"})
                      </span>
                    </span>
                    <span className="font-medium text-ink">{currency(c.totalValue)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-faint">
                Accepted Revenue — Last 6 Months
              </h3>
              <div className="mt-4 flex items-end gap-3">
                {stats.monthlyRevenue.map((m) => (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-xs text-muted">{m.total > 0 ? currency(m.total) : ""}</span>
                    <div
                      className="w-full rounded-t bg-accent/70"
                      style={{ height: `${Math.max(4, (m.total / maxMonthly) * 80)}px` }}
                    />
                    <span className="text-xs text-faint">{monthLabel(m.month)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, warn }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3">
      <p className="text-xs text-faint">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${warn ? "text-status-rejected" : "text-ink"}`}>{value}</p>
    </div>
  );
}

const TONE_COLORS = {
  accepted: "text-status-accepted",
  rejected: "text-status-rejected",
  sent: "text-status-sent",
};

function InsightList({ title, items, tone }) {
  if (!items || items.length === 0) {
    if (title === "Risks") {
      return (
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-wide ${TONE_COLORS[tone]}`}>{title}</h3>
          <p className="mt-2 text-sm text-muted">None flagged.</p>
        </div>
      );
    }
    return null;
  }
  return (
    <div>
      <h3 className={`text-xs font-semibold uppercase tracking-wide ${TONE_COLORS[tone]}`}>{title}</h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-ink/90">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
