import { Bot } from "lucide-react";
import Link from "next/link";

import { AppNav } from "@/components/app-nav";
import { Badge } from "@/components/ui/badge";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen">
      <aside className="bg-muted/30 hidden w-60 shrink-0 flex-col border-r md:flex">
        <Link href="/" className="flex items-center gap-2 px-5 py-4">
          <Bot className="size-5" />
          <span className="font-semibold tracking-tight">AgentSDR</span>
        </Link>
        <AppNav />
        <div className="mt-auto p-3">
          <Badge variant="outline" className="w-full justify-center font-normal">
            Preview — mock data
          </Badge>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
