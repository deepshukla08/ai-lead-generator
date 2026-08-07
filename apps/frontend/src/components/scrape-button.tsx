"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { CompanyProfile } from "@/lib/types";

interface ScrapeAccepted {
  job_id: string;
  url: string;
  max_pages: number;
}

export function ScrapeButton({ profile }: { profile: CompanyProfile }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(profile.website ?? "");
  const [maxPages, setMaxPages] = useState(15);

  const scrape = useMutation({
    mutationFn: () =>
      api<ScrapeAccepted>(`/companies/${profile.id}/scrape`, {
        method: "POST",
        body: JSON.stringify({ url: url || null, max_pages: maxPages }),
      }),
    onSuccess: async (job) => {
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Scrape started", {
        description: `Reading up to ${job.max_pages} pages of ${job.url}. They appear below as they are found.`,
      });
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Globe className="size-4" /> Scrape website
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Read your website</DialogTitle>
            <DialogDescription>
              Crawls your own site and files each page as a source you can edit or remove.
              robots.txt is respected and the crawl stays on your domain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scrape-url">Starting URL</Label>
              <Input
                id="scrape-url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://acme.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scrape-pages">Maximum pages</Label>
              <Input
                id="scrape-pages"
                type="number"
                min={1}
                max={50}
                value={maxPages}
                onChange={(event) => setMaxPages(Number(event.target.value))}
              />
              <p className="text-muted-foreground text-xs">
                About-, product-, pricing- and customer-style pages are read first. Blog, news and
                careers pages are skipped.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={scrape.isPending}>
              Cancel
            </Button>
            <Button onClick={() => scrape.mutate()} disabled={scrape.isPending || !url}>
              {scrape.isPending && <Loader2 className="size-4 animate-spin" />}
              Start reading
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
