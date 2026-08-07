"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api";
import { MOCK_PRODUCT_KNOWLEDGE } from "@/lib/mock";
import type { CompanyProfile, KnowledgeSourceStatus, ProductKnowledge } from "@/lib/types";

const SECTIONS: { key: keyof ProductKnowledge; label: string }[] = [
  { key: "products", label: "Products" },
  { key: "services", label: "Services" },
  { key: "features", label: "Features" },
  { key: "benefits", label: "Benefits" },
  { key: "pain_points", label: "Customer pain points" },
  { key: "industries", label: "Industries served" },
  { key: "company_sizes", label: "Company sizes served" },
  { key: "differentiators", label: "Differentiators" },
  { key: "competitors", label: "Competitors" },
  { key: "use_cases", label: "Use cases" },
  { key: "value_props", label: "Value propositions" },
];

const SOURCE_TONE: Record<KnowledgeSourceStatus, string> = {
  pending: "text-muted-foreground",
  parsing: "text-blue-700 dark:text-blue-300",
  ready: "text-emerald-700 dark:text-emerald-300",
  failed: "text-red-700 dark:text-red-300",
};

export default function KnowledgePage() {
  const {
    data: profile,
    isPending,
    error,
  } = useQuery({
    queryKey: ["company", "current"],
    queryFn: () => api<CompanyProfile>("/companies/current"),
    retry: false,
  });

  if (isPending) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-sm">No company profile yet.</p>
        <Link href="/onboarding" className={buttonVariants()}>
          Teach the AI about your business
        </Link>
      </div>
    );
  }

  // The agent has not run yet, so show the shape it will produce rather than a
  // blank page. Clearly labelled — this is not their data.
  const extracted = Object.keys(profile.product_knowledge).length > 0;
  const knowledge = extracted ? profile.product_knowledge : MOCK_PRODUCT_KNOWLEDGE;

  return (
    <>
      <PageHeader
        title="Company Knowledge"
        description="What the AI understands about your business. Every outreach claim traces back here."
        action={
          <Badge variant={profile.status === "ready" ? "default" : "secondary"}>
            {profile.status}
          </Badge>
        }
      />

      <div className="space-y-8 p-8">
        <section className="rounded-lg border p-5">
          <h2 className="font-medium">{profile.name}</h2>
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-2"
            >
              {profile.website}
            </a>
          )}
          {profile.description && <p className="mt-3 text-sm">{profile.description}</p>}
          {profile.icp_description && (
            <>
              <p className="text-muted-foreground mt-4 text-xs font-medium tracking-wide uppercase">
                Ideal customer
              </p>
              <p className="mt-1 text-sm">{profile.icp_description}</p>
            </>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-medium">
            Sources{" "}
            <span className="text-muted-foreground font-normal">
              ({profile.sources?.length ?? 0})
            </span>
          </h2>
          {profile.sources && profile.sources.length > 0 ? (
            <ul className="divide-y rounded-lg border">
              {profile.sources.map((source) => (
                <li key={source.id} className="flex items-center gap-3 p-4">
                  <FileText className="text-muted-foreground size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{source.original_filename}</p>
                    <p className="text-muted-foreground text-xs capitalize">
                      {source.kind.replace("_", " ")} ·{" "}
                      {source.size_bytes ? `${Math.round(source.size_bytes / 1024)} KB` : "—"}
                    </p>
                  </div>
                  <span className={`text-xs ${SOURCE_TONE[source.status]}`}>{source.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground rounded-lg border p-8 text-center text-sm">
              No documents uploaded yet.
            </p>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center gap-3">
            <h2 className="font-medium">Extracted knowledge</h2>
            {!extracted && (
              <Badge variant="outline" className="font-normal">
                preview — the Knowledge Agent runs in Phase 3
              </Badge>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {SECTIONS.map(({ key, label }) => {
              const values = knowledge[key] as string[] | undefined;
              if (!values?.length) return null;
              return (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {label}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {values.map((value) => (
                      <li key={value} className="text-sm">
                        {value}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {knowledge.success_stories?.length ? (
              <div className="rounded-lg border p-4 md:col-span-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Customer success stories
                </p>
                <ul className="mt-2 space-y-1">
                  {knowledge.success_stories.map((story) => (
                    <li key={story.customer} className="text-sm">
                      <span className="font-medium">{story.customer}</span> — {story.outcome}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </>
  );
}
