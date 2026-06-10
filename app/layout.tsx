import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { adminConfigured } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata: Metadata = {
  title: "<danfordchris/> Content Lab",
  description: "Capture → Multiply → Recycle. Never run out of content again.",
};

const NAV = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/ideas", label: "Idea Vault", icon: "✦" },
  { href: "/drafts", label: "Drafts", icon: "✎" },
  { href: "/calendar", label: "Calendar", icon: "▤" },
  { href: "/inbox", label: "Inbox", icon: "↺" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = adminConfigured ? await getCurrentUser() : null;
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <aside className="hidden md:flex w-60 flex-col gap-1 border-r border-[var(--border)] p-4 sticky top-0 h-screen">
            <Link href="/" className="mono text-lg font-semibold mb-4 px-2">
              &lt;danfordchris/&gt;
              <div className="text-[11px] font-normal text-zinc-500">Content Lab</div>
            </Link>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition"
              >
                <span className="w-4 text-center opacity-70">{n.icon}</span>
                {n.label}
              </Link>
            ))}
            <div className="mt-auto flex flex-col gap-2 px-2">
              {adminConfigured && user && <SignOutButton email={user.email} />}
              <div className="text-[11px] text-zinc-600">Capture · Multiply · Recycle</div>
            </div>
          </aside>

          {/* mobile top nav */}
          <main className="flex-1 min-w-0">
            <nav className="md:hidden flex items-center gap-1 overflow-x-auto border-b border-[var(--border)] px-3 py-2 sticky top-0 bg-[var(--bg)] z-10">
              <Link href="/" className="mono text-sm font-semibold mr-2 whitespace-nowrap">
                &lt;dc/&gt;
              </Link>
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-md px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-900 whitespace-nowrap"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
