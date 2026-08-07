"use client";

import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KnowledgeSourceKind } from "@/lib/types";
import { useUploadKnowledgeSource } from "@/lib/use-company";
import { cn } from "@/lib/utils";

const KINDS: { value: KnowledgeSourceKind; label: string }[] = [
  { value: "brochure", label: "Product brochure" },
  { value: "pitch_deck", label: "Pitch deck" },
  { value: "case_study", label: "Case study" },
  { value: "documentation", label: "Documentation" },
  { value: "other", label: "Other" },
];

/**
 * Teaching the AI is not a one-off. A new case study or a rewritten deck has to
 * be addable long after onboarding, so this lives on the knowledge page rather
 * than only in the setup flow.
 */
export function KnowledgeUploader({ companyId }: { companyId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<KnowledgeSourceKind>("case_study");
  const upload = useUploadKnowledgeSource(companyId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={kind} onValueChange={(v) => setKind((v as KnowledgeSourceKind) ?? "other")}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {KINDS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
        className="gap-1.5"
      >
        {upload.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
        {upload.isPending ? "Uploading…" : "Add document"}
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.pptx,.txt,.md,.csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload.mutate({ file, kind });
          // Clear it so re-picking the same file fires onChange again.
          event.target.value = "";
        }}
      />
    </div>
  );
}

/**
 * Drop target around the source list. Dropped files are filed as "other" —
 * guessing the kind from a filename would be wrong often enough to matter, and
 * the kind is editable later.
 */
export function KnowledgeDropZone({
  companyId,
  children,
}: {
  companyId: string;
  children: React.ReactNode;
}) {
  const [dragging, setDragging] = useState(false);
  const upload = useUploadKnowledgeSource(companyId);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        for (const file of Array.from(event.dataTransfer.files)) {
          upload.mutate({ file, kind: "other" });
        }
      }}
      className={cn(
        "rounded-lg border transition-colors",
        dragging && "border-foreground bg-accent/40 border-dashed",
      )}
    >
      {dragging ? (
        <p className="text-muted-foreground p-8 text-center text-sm">Drop to add documents</p>
      ) : (
        children
      )}
    </div>
  );
}
