"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { NAVIGATION, type NavigationItem } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/auth/session-provider";

type AppShellProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const queryClient = useQueryClient();

  const { user, loading, fetching } = useSession();
  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading workspace...
      </div>
    );
  }

  const sections = NAVIGATION.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.requiresAdmin && user?.role !== "ADMIN") {
        return false;
      }
      return true;
    }),
  })).filter((section) => section.items.length > 0);

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 z-20 w-64 border-r border-border bg-card/60 backdrop-blur-sm transition-transform duration-200 ease-in-out md:static md:translate-x-0",
          isMobileNavOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            IGT
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight">
              IPWAN Global Telcomm
            </p>
          </div>
        </div>
        <nav className="space-y-6 px-4 py-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.title}
              </p>
              <div className="mt-3 space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    isActive={pathname === item.href}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-background/70 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex flex-1 items-center gap-4">
              <div className="flex flex-1 items-center gap-2 rounded-md border border-transparent bg-muted/70 px-3 py-2 transition hover:border-border">
                <Search className="size-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search people, shifts, or requests"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                  queryClient.setQueryData(["session-user"], null);
                  await queryClient.invalidateQueries({ queryKey: ["session-user"] });
                  router.push("/login");
                  router.refresh();
                }}
              >
                Logout
              </Button>
            </div>
          </div>
          <div className="border-t border-border px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                ) : null}
              </div>
              {actions ? (
                <div className="flex items-center gap-2">{actions}</div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="flex-1 bg-muted/30 px-4 py-6 sm:px-6">
          <div className="mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

type NavLinkProps = {
  item: NavigationItem;
  isActive: boolean;
};

function NavLink({ item, isActive }: NavLinkProps) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition hover:bg-muted hover:text-foreground",
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="size-4" />
      {item.label}
    </Link>
  );
}
