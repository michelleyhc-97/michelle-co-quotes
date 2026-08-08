"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard", icon: IconGrid },
  { href: "/customers", label: "Customers", icon: IconUsers },
  { href: "/quotes", label: "Quotes", icon: IconDoc },
  { href: "/invoices", label: "Invoices", icon: IconReceipt },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-ink">
          M
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-ink">Michelle & Co.</p>
          <p className="text-xs text-faint">Quotes</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-surface-2 text-ink"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/quotes/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent/90"
        >
          <IconPlus className="h-4 w-4" />
          New Quote
        </Link>
      </div>
    </aside>
  );
}

function IconGrid(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.2" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.2" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.2" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.2" />
    </svg>
  );
}

function IconUsers(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="7" cy="6.5" r="2.5" />
      <path d="M2.5 16c0-2.8 2-4.5 4.5-4.5s4.5 1.7 4.5 4.5" strokeLinecap="round" />
      <circle cx="14.5" cy="7" r="2" />
      <path d="M12.8 11.7c1.9.3 3.7 1.7 3.7 4.3" strokeLinecap="round" />
    </svg>
  );
}

function IconDoc(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M5 2.5h7l3 3v12H5z" strokeLinejoin="round" />
      <path d="M12 2.5v3h3" strokeLinejoin="round" />
      <path d="M7 10h6M7 13h6M7 7h3" strokeLinecap="round" />
    </svg>
  );
}

function IconReceipt(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M5 2.5h10v15l-2-1.3-1.5 1.3-1.5-1.3-1.5 1.3-1.5-1.3-2 1.3z" strokeLinejoin="round" />
      <path d="M7.5 6.5h5M7.5 9.5h5M7.5 12.5h3" strokeLinecap="round" />
    </svg>
  );
}

function IconPlus(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M10 4v12M4 10h12" strokeLinecap="round" />
    </svg>
  );
}
