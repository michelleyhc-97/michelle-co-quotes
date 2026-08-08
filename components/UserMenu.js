"use client";

export default function UserMenu({ user }) {
  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    // A full reload (not router.push) is intentional here: the root layout
    // reads the session cookie server-side to populate UserProvider, and a
    // soft client-side navigation wouldn't force that to re-run — we'd risk
    // showing stale "logged in" state until the next hard refresh.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }

  return (
    <div className="flex items-center gap-3">
      <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
        {user.name} · {user.role === "boss" ? "Boss" : "Sales"}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        className="text-xs font-medium text-muted hover:text-ink"
      >
        Log out
      </button>
    </div>
  );
}
