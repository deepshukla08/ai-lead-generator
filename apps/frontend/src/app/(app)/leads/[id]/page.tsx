"use client";

import { ArrowLeft, ExternalLink, UserRound } from "lucide-react";
import Link from "next/link";

import {
  ConfidenceMeter,
  DraftStatusBadge,
  EmailStatusBadge,
  LeadStatusBadge,
  ScoreBadge,
} from "@/components/badges";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_LEAD_DETAIL } from "@/lib/mock";
import { cn } from "@/lib/utils";
import type { Evidence } from "@/lib/types";

/**
 * Evidence is rendered as a list of claim → source, never as prose. The whole
 * no-hallucination rule is only credible if the user can click the source.
 */
function EvidenceList({ items }: { items: Evidence[] }) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm italic">
        No evidence stored — the agent reported insufficient information.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.source + item.claim} className="text-sm">
          <span>{item.claim}</span>
          <a
            href={`https://${item.source.replace(/^https?:\/\//, "")}`}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground ml-2 inline-flex items-center gap-1 text-xs underline underline-offset-2"
          >
            {item.source}
            <ExternalLink className="size-3" />
          </a>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function ProspectDetailPage() {
  // Mock: one fixed lead regardless of the id, until the leads API exists.
  const lead = MOCK_LEAD_DETAIL;
  const company = lead.prospect_company;

  return (
    <div className="mx-auto max-w-5xl p-8">
      <Link
        href="/leads"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-4 -ml-2")}
      >
        <ArrowLeft className="size-4" /> All leads
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
            <LeadStatusBadge status={lead.status} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {company.domain} · {company.industry} · {company.employee_range} · {company.country}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-muted-foreground text-xs">Fit</p>
            <div className="mt-1">
              <ScoreBadge score={lead.fit_score} />
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Confidence</p>
            <div className="mt-1">
              <ConfidenceMeter value={lead.confidence} />
            </div>
          </div>
        </div>
      </header>

      <p className="mt-4 text-sm">{company.description}</p>

      <Tabs defaultValue="opportunity" className="mt-8">
        <TabsList>
          <TabsTrigger value="opportunity">Opportunity</TabsTrigger>
          <TabsTrigger value="qualification">Qualification</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
          <TabsTrigger value="contacts">Decision makers</TabsTrigger>
          <TabsTrigger value="outreach">Outreach</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunity" className="mt-6 space-y-6">
          <Section title="How our product helps this company">
            <p className="text-sm leading-relaxed">
              {lead.opportunity_summary ?? "Not yet analysed."}
            </p>
          </Section>
          <Separator />
          <Section title="Evidence">
            <EvidenceList items={lead.opportunity_evidence} />
          </Section>
        </TabsContent>

        <TabsContent value="qualification" className="mt-6 space-y-6">
          <Section title="Should we contact them?">
            <p className="text-sm leading-relaxed">{lead.qualification_reason}</p>
          </Section>
          <Separator />
          <Section title="Evidence">
            <EvidenceList items={lead.qualification_evidence} />
          </Section>
        </TabsContent>

        <TabsContent value="research" className="mt-6 space-y-6">
          <Section title="Summary">
            <p className="text-sm leading-relaxed">{lead.research?.summary}</p>
          </Section>
          <Separator />
          <Section title="Signals">
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(lead.research?.signals ?? {}).map(([category, values]) => (
                <div key={category}>
                  <p className="mb-1.5 text-sm font-medium capitalize">{category}</p>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    {values.map((v) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
          <Separator />
          <Section title={`Sources read (${lead.research?.sources.length ?? 0})`}>
            <ul className="space-y-1">
              {lead.research?.sources.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm underline underline-offset-2"
                  >
                    {url}
                    <ExternalLink className="size-3" />
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <div className="divide-y rounded-lg border">
            {lead.contacts.map((contact) => (
              <div key={contact.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-48 flex-1">
                  <p className="text-sm font-medium">{contact.full_name}</p>
                  <p className="text-muted-foreground text-xs">{contact.title}</p>
                </div>
                <Badge variant="secondary" className="font-normal capitalize">
                  {contact.role_category}
                </Badge>
                <div className="min-w-56">
                  {contact.email ? (
                    <p className="font-mono text-xs">{contact.email}</p>
                  ) : (
                    <p className="text-muted-foreground text-xs italic">
                      no address found — not guessed
                    </p>
                  )}
                </div>
                <EmailStatusBadge status={contact.email_status} />
                {contact.linkedin_url && (
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
                    title="LinkedIn profile"
                  >
                    <UserRound className="size-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="outreach" className="mt-6 space-y-4">
          {lead.drafts.map((draft) => (
            <div key={draft.id} className="rounded-lg border">
              <div className="flex items-center justify-between gap-4 border-b px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{draft.subject}</p>
                  <p className="text-muted-foreground text-xs">
                    to {draft.contact?.full_name} · revision {draft.revision}
                  </p>
                </div>
                <DraftStatusBadge status={draft.status} />
              </div>
              <pre className="px-5 py-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">
                {draft.body}
              </pre>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <ol className="border-l">
            {lead.timeline.map((event) => (
              <li key={event.id} className="relative py-3 pl-6">
                <span className="bg-border absolute top-5 -left-[4.5px] size-2 rounded-full" />
                <p className="text-sm">{event.message}</p>
                <p className="text-muted-foreground text-xs">
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ol>
        </TabsContent>
      </Tabs>
    </div>
  );
}
