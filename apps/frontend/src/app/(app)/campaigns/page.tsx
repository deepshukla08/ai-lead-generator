"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { CampaignStatusBadge } from "@/components/badges";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MOCK_CAMPAIGNS } from "@/lib/mock";

export default function CampaignsPage() {
  return (
    <>
      <PageHeader
        title="Campaigns"
        description="A campaign is a goal plus the leads judged against it."
        action={
          <Button size="sm">
            <Plus className="size-4" /> New campaign
          </Button>
        }
      />

      <div className="grid gap-4 p-8 lg:grid-cols-2">
        {MOCK_CAMPAIGNS.map((campaign) => {
          const progress =
            campaign.lead_count === 0
              ? 0
              : Math.round((campaign.qualified_count / campaign.lead_count) * 100);
          return (
            <article key={campaign.id} className="rounded-lg border p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-medium">{campaign.name}</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {campaign.goal ?? "No goal set yet."}
                  </p>
                </div>
                <CampaignStatusBadge status={campaign.status} />
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-4">
                <div>
                  <dt className="text-muted-foreground text-xs">Leads</dt>
                  <dd className="mt-0.5 text-xl font-semibold tabular-nums">
                    {campaign.lead_count}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Qualified</dt>
                  <dd className="mt-0.5 text-xl font-semibold tabular-nums">
                    {campaign.qualified_count}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Sent</dt>
                  <dd className="mt-0.5 text-xl font-semibold tabular-nums">
                    {campaign.sent_count}
                  </dd>
                </div>
              </dl>

              <div className="mt-4">
                <div className="text-muted-foreground mb-1.5 flex justify-between text-xs">
                  <span>Qualification rate</span>
                  <span className="tabular-nums">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>

              <div className="mt-5 flex items-center justify-between">
                <p className="text-muted-foreground text-xs">
                  Created {new Date(campaign.created_at).toLocaleDateString()}
                </p>
                <Link href="/leads" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  View leads
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
