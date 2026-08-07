import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CampaignStatus, DraftStatus, EmailStatus, LeadStatus } from "@/lib/types";

/** Score colour carries meaning: green is actionable, amber needs a look, grey is not worth time. */
export function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-muted-foreground text-sm tabular-nums">—</span>;
  }
  const tone =
    score >= 85
      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
      : score >= 70
        ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-9 items-center justify-center rounded-md px-1.5 text-sm font-medium tabular-nums",
        tone,
      )}
    >
      {score}
    </span>
  );
}

/** Confidence is separate from score on purpose: a confident 40 and a shaky 90 are different problems. */
export function ConfidenceMeter({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted h-1.5 w-14 overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full", value >= 0.75 ? "bg-foreground" : "bg-amber-500")}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="text-muted-foreground text-xs tabular-nums">{value.toFixed(2)}</span>
    </div>
  );
}

const LEAD_TONE: Record<LeadStatus, string> = {
  discovered: "text-muted-foreground",
  researching: "text-blue-700 dark:text-blue-300",
  qualified: "text-emerald-700 dark:text-emerald-300",
  rejected: "text-muted-foreground line-through",
  outreach_ready: "text-violet-700 dark:text-violet-300",
  approved: "text-emerald-700 dark:text-emerald-300",
  sent: "text-foreground",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant="outline" className={cn("font-normal capitalize", LEAD_TONE[status])}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const live = status === "running" || status === "prospecting" || status === "researching";
  return (
    <Badge variant={live ? "default" : "secondary"} className="font-normal capitalize">
      {status}
    </Badge>
  );
}

/**
 * The product's most important badge. `not_found` is a legitimate outcome —
 * the system refuses to invent an address — so it must read as a decision,
 * not a failure.
 */
export function EmailStatusBadge({ status }: { status: EmailStatus }) {
  const label: Record<EmailStatus, string> = {
    verified: "verified",
    guessed: "guessed",
    unknown: "unknown",
    not_found: "none found",
  };
  const tone: Record<EmailStatus, string> = {
    verified: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
    guessed: "border-amber-500/40 text-amber-700 dark:text-amber-300",
    unknown: "text-muted-foreground",
    not_found: "border-dashed text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={cn("font-normal", tone[status])}>
      {label[status]}
    </Badge>
  );
}

export function DraftStatusBadge({ status }: { status: DraftStatus }) {
  const tone: Record<DraftStatus, string> = {
    pending: "border-amber-500/40 text-amber-700 dark:text-amber-300",
    approved: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
    rejected: "text-muted-foreground",
    edited: "border-blue-500/40 text-blue-700 dark:text-blue-300",
    skipped: "text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={cn("font-normal capitalize", tone[status])}>
      {status}
    </Badge>
  );
}
