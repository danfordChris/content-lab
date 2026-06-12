"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./wordmark";
import { SignOutButton } from "./sign-out-button";

const NAV = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/ideas", label: "Idea Vault", icon: "✦" },
  { href: "/drafts", label: "Drafts", icon: "✎" },
  { href: "/discuss", label: "Discuss", icon: "✺" },
  { href: "/calendar", label: "Calendar", icon: "▤" },
  { href: "/inbox", label: "Inbox", icon: "↺" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

// Bottom tab bar shows the 5 most-used destinations; Inbox lives in the top bar.
const TABS = [
  { href: "/", label: "Home", icon: "▦" },
  { href: "/ideas", label: "Ideas", icon: "✦" },
  { href: "/drafts", label: "Drafts", icon: "✎" },
  { href: "/calendar", label: "Calendar", icon: "▤" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function openPalette() {
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
}

export function AppSidebar({ user, showSignOut }: { user?: { email?: string } | null; showSignOut?: boolean }) {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <aside className="hidden md:flex w-60 flex-col gap-1 border-r border-[var(--border)] p-4 sticky top-0 h-screen">
      <Link href="/" className="px-2 pb-5 pt-1">
        <Wordmark size={17} />
        <div className="text-[11px] text-zinc-500 mt-0.5">ContentForge</div>
      </Link>
      {NAV.map((n) => {
        const active = isActive(pathname, n.href);
        return (
          <Link key={n.href} href={n.href} className={`nav-item ${active ? "nav-item-active" : ""}`}>
            <span className="nav-icon w-4 text-center opacity-80">{n.icon}</span>
            {n.label}
          </Link>
        );
      })}
      <div className="mt-auto flex flex-col gap-2 px-1">
        {showSignOut && user && <SignOutButton email={user.email} />}
        <div className="text-[11px] text-zinc-600 mono">capture · multiply · recycle</div>
      </div>
    </aside>
  );
}

export function AppMobileNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <>
      {/* slim top bar */}
      <nav className="md:hidden flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5 sticky top-0 bg-[var(--bg)] z-20">
        <Link href="/">
          <Wordmark size={14} />
        </Link>
        <div className="flex items-center gap-1.5">
          <Link
            href="/discuss"
            className={`rounded-lg px-2.5 py-1.5 text-sm ${
              isActive(pathname, "/discuss") ? "bg-[var(--accent-soft)] text-white" : "text-zinc-400"
            }`}
            aria-label="Discuss with AI"
          >
            ✺
          </Link>
          <Link
            href="/inbox"
            className={`rounded-lg px-2.5 py-1.5 text-sm ${
              isActive(pathname, "/inbox") ? "bg-[var(--accent-soft)] text-white" : "text-zinc-400"
            }`}
            aria-label="Inbox"
          >
            ↺
          </Link>
          <button
            onClick={openPalette}
            className="rounded-lg px-2.5 py-1.5 text-sm text-zinc-400"
            aria-label="Search and capture"
          >
            ⌕
          </button>
        </div>
      </nav>

      {/* bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch border-t border-[var(--border)] bg-[#0c0c0f]/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {TABS.map((t) => {
          const active = isActive(pathname, t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5"
              style={{ color: active ? "var(--accent)" : "var(--text-2)" }}
            >
              <span className="text-[17px] leading-none">{t.icon}</span>
              <span className={`text-[10px] ${active ? "text-white" : ""}`}>{t.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* floating quick-capture */}
      <button
        onClick={openPalette}
        aria-label="Capture an idea"
        className="md:hidden fixed right-4 z-30 h-12 w-12 rounded-full text-xl font-medium text-white shadow-lg"
        style={{
          background: "var(--accent)",
          bottom: "calc(76px + env(safe-area-inset-bottom))",
        }}
      >
        +
      </button>
    </>
  );
}
