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
      <header className="glass-nav sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
          <Link href="/dashboard">
            <Logo size="sm" />
          </Link>

          <nav className="flex items-center gap-0.5">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                    active
                      ? "bg-ink text-white"
                      : "text-ink-muted hover:text-ink hover:bg-black/[0.04]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <div className="text-[13px] font-medium text-ink">
                {userName ?? "DPO"}
              </div>
              <div className="text-[11px] text-ink-subtle">{userEmail}</div>
            </div>
            <a
              href="/api/auth/logout"
              className="pill-ghost text-[13px]"
            >
              Sign out
            </a>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-8 py-10">{children}</main>
    </div>
  );
}
