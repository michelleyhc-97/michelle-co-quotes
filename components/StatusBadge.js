const STYLES = {
  Draft: { color: "var(--status-draft)", bg: "rgba(139,146,163,0.12)" },
  Sent: { color: "var(--status-sent)", bg: "rgba(91,155,213,0.12)" },
  Accepted: { color: "var(--status-accepted)", bg: "rgba(76,175,125,0.12)" },
  Rejected: { color: "var(--status-rejected)", bg: "rgba(224,105,122,0.12)" },
  "Amendment Requested": { color: "var(--status-amendment)", bg: "rgba(217,164,65,0.12)" },
  // Invoice statuses
  Unpaid: { color: "var(--status-sent)", bg: "rgba(91,155,213,0.12)" },
  Paid: { color: "var(--status-accepted)", bg: "rgba(76,175,125,0.12)" },
  Overdue: { color: "var(--status-rejected)", bg: "rgba(224,105,122,0.12)" },
  Cancelled: { color: "var(--status-draft)", bg: "rgba(139,146,163,0.12)" },
  // Telegram order statuses
  "Pending Review": { color: "var(--status-amendment)", bg: "rgba(217,164,65,0.12)" },
  "Pending Approval": { color: "var(--status-sent)", bg: "rgba(91,155,213,0.12)" },
  "Pending Payment": { color: "var(--status-sent)", bg: "rgba(91,155,213,0.12)" },
  "Pending Content Creation": { color: "var(--status-amendment)", bg: "rgba(217,164,65,0.12)" },
  Processed: { color: "var(--status-accepted)", bg: "rgba(76,175,125,0.12)" },
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] ?? STYLES.Draft;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ color: style.color, background: style.bg }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: style.color }}
      />
      {status}
    </span>
  );
}
