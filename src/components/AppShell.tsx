"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

interface AppShellProps {
  userEmail?: string;
  userName?: string;
  children: React.ReactNode;
}

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/inbox", label: "Inbox" },
  { href: "/queue", label: "Queue" },
  { href: "/templates", label: "Templates" },
];

export function AppShell({ userEmail, userName, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen text-ink">
      {/* Decorative azure glows */}
      <div
        aria-hidden
        className="pointer-events-none fixed -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-azure-200/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -bottom-40 left-[-10%] h-[480px] w-[480px] rounded-full bg-azure-100/40 blur-3xl"
      />

      <header className="glass-nav sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <Link href="/dashboard" className="flex items-center">
            <Logo size="md" />
          </Link>

          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-azure-500 text-white shadow-azure-glow"
                      : "text-ink-muted hover:bg-white/60 hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-xs font-medium text-ink">
                {userName ?? "DPO"}
              </div>
              <div className="text-[10px] text-ink-subtle">{userEmail}</div>
            </div>
            <a
              href="/api/auth/logout"
              className="text-xs text-ink-subtle hover:text-ink"
            >
              Sign out
            </a>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-8 py-10">{children}</main>
    </div>
  );
}
