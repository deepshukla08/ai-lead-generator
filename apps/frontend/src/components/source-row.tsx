"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, FileText, Globe, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SourceContentDialog } from "@/components/source-content-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { del } from "@/lib/api";
import type { KnowledgeSource, KnowledgeSourceStatus } from "@/lib/types";

const STATUS_TONE: Record<KnowledgeSourceStatus, string> = {
  pending: "text-muted-foreground",
  parsing: "text-blue-700 dark:text-blue-300",
  ready: "text-emerald-700 dark:text-emerald-300",
  failed: "text-red-700 dark:text-red-300",
};

const STATUS_LABEL: Record<KnowledgeSourceStatus, string> = {
  pending: "queued",
  parsing: "parsing",
  ready: "in knowledge base",
  failed: "failed",
};

export function SourceRow({ source, companyId }: { source: KnowledgeSource; companyId: string }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [viewing, setViewing] = useState(false);

  const remove = useMutation({
    mutationFn: () => del(`/companies/${companyId}/knowledge-sources/${source.id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success(`${source.original_filename} removed`);
      setConfirming(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <li className="group flex items-center gap-3 p-4">
      {source.source_url ? (
        <Globe className="text-muted-foreground size-4 shrink-0" />
      ) : (
        <FileText className="text-muted-foreground size-4 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{source.original_filename ?? source.source_url}</p>
        <p className="text-muted-foreground truncate text-xs">
          <span className="capitalize">{source.kind.replace("_", " ")}</span> ·{" "}
          {source.size_bytes ? `${Math.round(source.size_bytes / 1024)} KB` : "—"} ·{" "}
          {source.source_url ?? new Date(source.created_at).toLocaleDateString()}
        </p>
      </div>

      <span className={`text-xs ${STATUS_TONE[source.status]}`}>{STATUS_LABEL[source.status]}</span>

      {/* Only text sources are readable until Phase 3 parses PDFs and decks. */}
      {source.mime_type?.startsWith("text/") && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewing(true)}
          className="text-muted-foreground hover:text-foreground gap-1.5"
        >
          <Eye className="size-3.5" /> View
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Remove ${source.original_filename}`}
        onClick={() => setConfirming(true)}
        className="text-muted-foreground hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </Button>

      <SourceContentDialog
        source={source}
        companyId={companyId}
        open={viewing}
        onOpenChange={setViewing}
      />

      {/* Deleting a source drops its chunks too, so it is worth a confirmation. */}
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove this document?</DialogTitle>
            <DialogDescription>
              {source.original_filename} and everything the AI learned from it will be deleted. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirming(false)}
              disabled={remove.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
            >
              {remove.isPending && <Loader2 className="size-4 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
