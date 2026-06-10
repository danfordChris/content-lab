"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./wordmark";
import { SignOutButton } from "./sign-out-button";

const NAV = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/ideas", label: "Idea Vault", icon: "✦" },
  { href: "/drafts", label: "Drafts", icon: "✎" },
  { href: "/calendar", label: "Calendar", icon: "▤" },
  { href: "/inbox", label: "Inbox", icon: "↺" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppSidebar({ user, showSignOut }: { user?: { email?: string } | null; showSignOut?: boolean }) {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <aside className="hidden md:flex w-60 flex-col gap-1 border-r border-[var(--border)] p-4 sticky top-0 h-screen">
      <Link href="/" className="px-2 pb-5 pt-1">
        <Wordmark size={17} />
        <div className="text-[11px] text-zinc-500 mt-0.5">Content Lab</div>
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
    <nav className="md:hidden flex items-center gap-1 overflow-x-auto border-b border-[var(--border)] px-3 py-2 sticky top-0 bg-[var(--bg)] z-20">
      <Link href="/" className="mr-2 whitespace-nowrap">
        <Wordmark size={13} />
      </Link>
      {NAV.map((n) => {
        const active = isActive(pathname, n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`rounded-md px-2.5 py-1 text-xs whitespace-nowrap transition ${
              active ? "bg-[var(--accent-soft)] text-white" : "text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
