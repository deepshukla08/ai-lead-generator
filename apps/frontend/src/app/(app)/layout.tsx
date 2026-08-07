import { AppNav } from "@/components/app-nav";
import { CompanySwitcher } from "@/components/company-switcher";
import { SessionGate } from "@/components/session-gate";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/user-menu";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SessionGate>
      <div className="flex min-h-screen">
        <aside className="bg-muted/30 hidden w-64 shrink-0 flex-col border-r md:flex">
          <div className="p-2">
            <CompanySwitcher />
          </div>
          <AppNav />
          <div className="mt-auto space-y-2 p-2">
            <Badge variant="outline" className="w-full justify-center font-normal">
              Preview — mock data
            </Badge>
            <UserMenu />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </SessionGate>
  );
}
