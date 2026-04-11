"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <div className="min-h-screen bg-black text-white">
      <header className="glass hairline-b sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-white" />
            <span className="text-sm font-semibold tracking-tight">
              ClearSAR
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-white text-black"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-xs font-medium">{userName ?? "DPO"}</div>
              <div className="text-[10px] text-white/40">{userEmail}</div>
            </div>
            <a
              href="/api/auth/logout"
              className="text-xs text-white/40 hover:text-white"
            >
              Sign out
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10">{children}</main>
    </div>
  );
}
