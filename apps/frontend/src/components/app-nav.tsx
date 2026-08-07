"use client";

import { BookOpen, CheckSquare, LayoutDashboard, MessageSquare, Rocket, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/campaigns", label: "Campaigns", icon: Rocket },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/approvals", label: "Approvals", icon: CheckSquare },
  { href: "/knowledge", label: "Company Knowledge", icon: BookOpen },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
