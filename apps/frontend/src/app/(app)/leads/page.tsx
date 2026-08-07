"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ConfidenceMeter, LeadStatusBadge, ScoreBadge } from "@/components/badges";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOCK_LEADS } from "@/lib/mock";

const MIN_SCORES = ["0", "70", "85", "90"] as const;

export default function LeadExplorerPage() {
  const [query, setQuery] = useState("");
  const [minScore, setMinScore] = useState<string>("0");
  const [status, setStatus] = useState<string>("all");

  const leads = useMemo(() => {
    const min = Number(minScore);
    return MOCK_LEADS.filter((lead) => {
      const company = lead.prospect_company;
      const matchesQuery =
        !query ||
        `${company.name} ${company.domain} ${company.industry ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchesScore = min === 0 || (lead.fit_score ?? -1) >= min;
      const matchesStatus = status === "all" || lead.status === status;
      return matchesQuery && matchesScore && matchesStatus;
    }).sort((a, b) => (b.fit_score ?? -1) - (a.fit_score ?? -1));
  }, [query, minScore, status]);

  return (
    <>
      <PageHeader
        title="Leads"
        description="Every company considered, with the score and the reasoning behind it."
      />

      <div className="p-8">
        {/* Filters in one row above the data, per the interaction spec. */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search company, domain or industry…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={minScore} onValueChange={(v) => setMinScore(v ?? "0")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MIN_SCORES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "0" ? "Any score" : `Score ≥ ${s}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="discovered">Discovered</SelectItem>
              <SelectItem value="researching">Researching</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="outreach_ready">Outreach ready</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-muted-foreground ml-auto text-sm tabular-nums">
            {leads.length} of {MOCK_LEADS.length}
          </span>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Score</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="hidden lg:table-cell">Industry</TableHead>
                <TableHead className="hidden xl:table-cell">Size</TableHead>
                <TableHead className="w-36">Confidence</TableHead>
                <TableHead className="w-36">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id} className="group">
                  <TableCell>
                    <ScoreBadge score={lead.fit_score} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/leads/${lead.id}`} className="block">
                      <p className="font-medium">{lead.prospect_company.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {lead.prospect_company.domain}
                      </p>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-sm lg:table-cell">
                    {lead.prospect_company.industry ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-sm xl:table-cell">
                    {lead.prospect_company.employee_range ?? "—"}
                  </TableCell>
                  <TableCell>
                    <ConfidenceMeter value={lead.confidence} />
                  </TableCell>
                  <TableCell>
                    <LeadStatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArrowRight className="size-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-12 text-center">
                    No leads match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
