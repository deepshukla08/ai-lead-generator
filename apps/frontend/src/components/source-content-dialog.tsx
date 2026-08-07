"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type { KnowledgeSource } from "@/lib/types";

/**
 * Split out so the draft can be seeded from props on mount. Syncing it from the
 * query with an effect would be setState-in-effect — an extra render and a
 * subtle way to clobber what the user just typed.
 */
function ContentEditor({
  path,
  sourceId,
  initialContent,
  onSaved,
}: {
  path: string;
  sourceId: string;
  initialContent: string;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(initialContent);
  const dirty = draft !== initialContent;

  const save = useMutation({
    mutationFn: () => api(path, { method: "PUT", body: JSON.stringify({ content: draft }) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      await queryClient.invalidateQueries({ queryKey: ["source-content", sourceId] });
      toast.success("Content saved — queued for re-processing");
      onSaved();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="h-96 font-mono text-xs leading-relaxed"
      />
      <DialogFooter className="items-center">
        <span className="text-muted-foreground mr-auto text-xs">
          {draft.length.toLocaleString()} characters
          {dirty && " · unsaved changes"}
        </span>
        <Button variant="outline" onClick={onSaved}>
          Close
        </Button>
        <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Scraped pages carry noise no extractor catches — cookie notices, "enable
 * JavaScript" fallbacks, stray navigation. Fixing it here is far cheaper than
 * finding it later inside a generated email.
 */
export function SourceContentDialog({
  source,
  companyId,
  open,
  onOpenChange,
}: {
  source: KnowledgeSource;
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const path = `/companies/${companyId}/knowledge-sources/${source.id}/content`;

  const { data, isPending } = useQuery({
    queryKey: ["source-content", source.id],
    queryFn: () => api<{ content: string }>(path),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{source.original_filename}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <span>This is the text the AI will learn from.</span>
            {source.source_url && (
              <a
                href={source.source_url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground inline-flex items-center gap-1 underline underline-offset-2"
              >
                {source.source_url}
                <ExternalLink className="size-3" />
              </a>
            )}
          </DialogDescription>
        </DialogHeader>

        {isPending || !data ? (
          <div className="text-muted-foreground flex h-96 items-center justify-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : (
          <ContentEditor
            path={path}
            sourceId={source.id}
            initialContent={data.content}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
