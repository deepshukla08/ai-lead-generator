"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, uploadFile } from "@/lib/api";
import { useSession } from "@/lib/store";
import type { CompanyProfile, KnowledgeSourceKind } from "@/lib/types";

const UPLOAD_SLOTS: { kind: KnowledgeSourceKind; label: string; hint: string }[] = [
  { kind: "brochure", label: "Product brochure", hint: "What you sell, in your own words" },
  { kind: "pitch_deck", label: "Pitch deck", hint: "Positioning and differentiators" },
  {
    kind: "case_study",
    label: "Case studies",
    hint: "Proof — the AI cites these, never invents them",
  },
  { kind: "documentation", label: "Product documentation", hint: "Capabilities and limits" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setActiveCompany = useSession((s) => s.setActiveCompany);
  const [files, setFiles] = useState<Partial<Record<KnowledgeSourceKind, File>>>({});

  const submit = useMutation({
    mutationFn: async (form: FormData) => {
      const profile = await api<CompanyProfile>("/companies", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          website: form.get("website") || null,
          description: form.get("description") || null,
          icp_description: form.get("icp_description") || null,
        }),
      });

      // Uploads are sequential on purpose: a partial failure should leave a
      // clear picture of which documents made it, not a race.
      for (const [kind, file] of Object.entries(files)) {
        if (file) await uploadFile(`/companies/${profile.id}/knowledge-sources`, file, kind);
      }
      return profile;
    },
    onSuccess: async (profile) => {
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      // Switch to what you just created; landing on someone else's company
      // after onboarding would be baffling.
      setActiveCompany(profile.id);
      toast.success(`${profile.name} saved`);
      router.push("/knowledge");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-10 flex items-center gap-3">
        <Bot className="size-6" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teach the AI your business</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Everything after this depends on it. The AI only ever claims what these documents
            support.
          </p>
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit.mutate(new FormData(event.currentTarget));
        }}
        className="space-y-6"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Company name</Label>
          <Input id="name" name="name" required placeholder="Acme Robotics" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" type="url" placeholder="https://acme.com" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">What does your company do?</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            placeholder="We build autonomous warehouse robots that retrofit into existing racking."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="icp_description">
            Ideal customer <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="icp_description"
            name="icp_description"
            rows={2}
            placeholder="Mid-market 3PLs in the EU running two or more warehouses."
          />
          <p className="text-muted-foreground text-xs">
            Leave blank and the AI infers it from your documents.
          </p>
        </div>

        <fieldset className="space-y-3">
          <legend className="mb-3 text-sm font-medium">Documents</legend>
          {UPLOAD_SLOTS.map(({ kind, label, hint }) => (
            <label
              key={kind}
              className="hover:bg-accent/40 flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors"
            >
              <Upload className="text-muted-foreground size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {files[kind]?.name ?? hint}
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,.docx,.pptx,.txt,.md,.csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setFiles((prev) => ({ ...prev, [kind]: file }));
                }}
              />
            </label>
          ))}
          <p className="text-muted-foreground text-xs">
            PDF, DOCX, PPTX, TXT, MD or CSV. 25 MB each.
          </p>
        </fieldset>

        <Button type="submit" disabled={submit.isPending} className="w-full">
          {submit.isPending && <Loader2 className="size-4 animate-spin" />}
          {submit.isPending ? "Saving…" : "Build the knowledge base"}
        </Button>
      </form>
    </div>
  );
}
