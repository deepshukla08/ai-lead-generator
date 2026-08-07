"use client";

import { AlertTriangle, Check, Pencil, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DraftStatusBadge, EmailStatusBadge } from "@/components/badges";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_DRAFTS } from "@/lib/mock";
import type { EmailDraft } from "@/lib/types";

function CriticVerdict({ verdict }: { verdict: EmailDraft["critic_verdict"] }) {
  if (!verdict) return null;
  const Icon = verdict.passed ? ShieldCheck : AlertTriangle;
  return (
    <div
      className={
        verdict.passed
          ? "rounded-md border border-emerald-500/30 bg-emerald-50/60 p-3 dark:bg-emerald-950/20"
          : "rounded-md border border-amber-500/40 bg-amber-50/60 p-3 dark:bg-amber-950/20"
      }
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4" />
        Critic {verdict.passed ? "passed" : "flagged this draft"}
      </p>
      <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
        {verdict.notes.map((note) => (
          <li key={note}>· {note}</li>
        ))}
      </ul>
    </div>
  );
}

function DraftCard({ draft }: { draft: EmailDraft }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(draft.body ?? "");
  const sendable = draft.contact?.email != null;

  return (
    <article className="rounded-lg border">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b p-5">
        <div className="min-w-0">
          <p className="font-medium">{draft.company_name}</p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {draft.contact?.full_name} · {draft.contact?.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs">{draft.contact?.email ?? "no address found"}</span>
            <EmailStatusBadge status={draft.contact?.email_status ?? "unknown"} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">rev {draft.revision}</span>
          <DraftStatusBadge status={draft.status} />
        </div>
      </header>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-muted-foreground text-xs">Subject</p>
          <p className="mt-0.5 text-sm font-medium">{draft.subject}</p>
        </div>

        {editing ? (
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-64 font-sans text-sm leading-relaxed"
          />
        ) : (
          <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{body}</pre>
        )}

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs">LinkedIn message</p>
            <p className="mt-1 text-sm">{draft.linkedin_message}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Follow-up</p>
            <p className="mt-1 text-sm">{draft.follow_up}</p>
          </div>
        </div>

        <CriticVerdict verdict={draft.critic_verdict} />

        {!sendable && (
          <p className="text-muted-foreground text-sm italic">
            No verified address, so this cannot be sent. The Contact Agent reported none rather than
            guessing one.
          </p>
        )}
      </div>

      <footer className="bg-muted/30 flex flex-wrap items-center gap-2 border-t p-4">
        <Button
          size="sm"
          disabled={!sendable}
          onClick={() => toast.success(`Approved — ${draft.company_name}`)}
        >
          <Check className="size-4" /> Approve
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
          <Pencil className="size-4" /> {editing ? "Done editing" : "Edit"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => toast("Regenerating — a new revision will appear")}
        >
          <RefreshCw className="size-4" /> Regenerate
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => toast(`Rejected — ${draft.company_name}`)}
        >
          <X className="size-4" /> Reject
        </Button>
        <span className="text-muted-foreground ml-auto text-xs">Nothing sends without you</span>
      </footer>
    </article>
  );
}

export default function ApprovalsPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const pending = MOCK_DRAFTS.filter((d) => d.status === "pending");
  const allSelected = selected.length === pending.length && pending.length > 0;

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Every draft waits here. The AI never sends on its own."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={selected.length === 0}
              onClick={() => toast.success(`Approved ${selected.length} drafts`)}
            >
              Approve selected ({selected.length})
            </Button>
            <Button
              size="sm"
              disabled={selected.length === 0}
              onClick={() => toast.success(`Sending ${selected.length} approved emails`)}
            >
              Send approved
            </Button>
          </div>
        }
      />

      <div className="space-y-4 p-8">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => setSelected(checked ? pending.map((d) => d.id) : [])}
          />
          Select all {pending.length} pending
        </label>

        {pending.map((draft) => (
          <div key={draft.id} className="flex gap-3">
            <Checkbox
              className="mt-6"
              checked={selected.includes(draft.id)}
              onCheckedChange={(checked) =>
                setSelected((prev) =>
                  checked ? [...prev, draft.id] : prev.filter((id) => id !== draft.id),
                )
              }
            />
            <div className="min-w-0 flex-1">
              <DraftCard draft={draft} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
