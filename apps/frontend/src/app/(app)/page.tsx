"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/stat-tile";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api";
import { MOCK_CAMPAIGNS, MOCK_DRAFTS, MOCK_LEADS, MOCK_TIMELINE } from "@/lib/mock";
import { useActiveCompany } from "@/lib/use-company";

type Readiness = { status: string; checks: Record<string, string> };

function SystemStatus() {
  const { data, error, isPending } = useQuery({
    queryKey: ["readiness"],
    queryFn: () => api<Readiness>("/health/ready"),
    refetchInterval: 15_000,
  });

  return (
    <div className="rounded-lg border p-5">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">System</p>
      {isPending && <p className="text-muted-foreground mt-3 text-sm">Checking…</p>}
      {error && <p className="mt-3 text-sm text-red-600">API unreachable</p>}
      {data && (
        <ul className="mt-3 space-y-1.5">
          {Object.entries(data.checks).map(([name, state]) => (
            <li key={name} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-mono text-xs">{name}</span>
              <span className={state === "ok" ? "text-emerald-600" : "text-red-600"}>{state}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DashboardPage() {
  // Real: whichever company the switcher has selected.
  const { company: profile } = useActiveCompany();

  const qualified = MOCK_LEADS.filter((l) => (l.fit_score ?? 0) >= 85).length;
  const pending = MOCK_DRAFTS.filter((d) => d.status === "pending").length;
  const totalLeads = MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.lead_count, 0);
  const sent = MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.sent_count, 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          profile ? `${profile.name} — knowledge base ${profile.status}` : "No company profile yet."
        }
        action={
          !profile && (
            <Link href="/onboarding" className={buttonVariants()}>
              Teach the AI about your business <ArrowRight className="size-4" />
            </Link>
          )
        }
      />

      <div className="space-y-8 p-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatTile label="Leads" value={totalLeads} context="across 3 campaigns" />
          <StatTile label="Above 85" value={qualified} context="ready for outreach" />
          <StatTile
            label="Awaiting approval"
            value={pending}
            context="nothing sends without you"
            emphasis={pending > 0}
          />
          <StatTile label="Sent" value={sent} context="last 30 days" />
          <SystemStatus />
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium">Campaigns</h2>
              <Link href="/campaigns" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                View all
              </Link>
            </div>
            <div className="divide-y rounded-lg border">
              {MOCK_CAMPAIGNS.map((c) => (
                <Link
                  key={c.id}
                  href="/leads"
                  className="hover:bg-accent/50 flex items-center justify-between gap-4 p-4 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {c.lead_count} leads · {c.qualified_count} qualified · {c.sent_count} sent
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-normal capitalize">
                    {c.status}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-medium">Recent activity</h2>
            <ol className="divide-y rounded-lg border">
              {MOCK_TIMELINE.map((event) => (
                <li key={event.id} className="p-4">
                  <p className="text-sm">{event.message}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </>
  );
}
