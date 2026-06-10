import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { adminConfigured } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth";
import { AppSidebar, AppMobileNav } from "@/components/app-nav";
import { CommandPalette } from "@/components/command-palette";

export const metadata: Metadata = {
  title: "<DanfordChris/> Content Lab",
  description: "Capture → Multiply → Recycle. Never run out of content again.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = adminConfigured ? await getCurrentUser() : null;
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <AppSidebar user={user} showSignOut={adminConfigured && !!user} />
          <main className="flex-1 min-w-0">
            <AppMobileNav />
            <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">{children}</div>
          </main>
        </div>
        <CommandPalette />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#131317",
              border: "1px solid #1f1f23",
              color: "#f4f4f5",
            },
          }}
        />
      </body>
    </html>
  );
}
