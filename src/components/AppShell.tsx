"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  ClipboardList,
  FileText,
  Building2,
  LogOut,
} from "lucide-react";
import { Logo } from "./Logo";

interface AppShellProps {
  userEmail?: string;
  userName?: string;
  children: React.ReactNode;
}

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/queue", label: "Queue", icon: ClipboardList },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/departments", label: "Departments", icon: Building2 },
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
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                    active
                      ? "bg-ink text-white"
                      : "text-ink-muted hover:text-ink hover:bg-black/[0.04]"
                  }`}
                >
                  <Icon size={14} strokeWidth={2} />
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
              className="pill-ghost flex items-center gap-1.5 text-[13px]"
            >
              <LogOut size={13} strokeWidth={2} />
              Sign out
            </a>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-8 py-10">{children}</main>
    </div>
  );
}
