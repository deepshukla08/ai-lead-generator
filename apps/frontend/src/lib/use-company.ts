"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, uploadFile } from "@/lib/api";
import { useSession } from "@/lib/store";
import type { CompanyProfile, KnowledgeSource, KnowledgeSourceKind } from "@/lib/types";

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: () => api<CompanyProfile[]>("/companies"),
    // Scraped pages arrive one at a time from the worker, so the source list
    // has to refresh without the user reloading.
    // ponytail: dumb polling. Swap for SSE when there is more live state than
    // a source list.
    refetchInterval: 10_000,
  });
}

/**
 * The company every screen renders against.
 *
 * Falls back to the first profile when nothing is selected, so a fresh browser
 * is never staring at an empty app. When real auth arrives this resolves from
 * the session claim instead of local state, and callers do not change.
 */
export function useActiveCompany() {
  const activeCompanyId = useSession((s) => s.activeCompanyId);
  const { data: companies, ...query } = useCompanies();

  const company = companies?.find((c) => c.id === activeCompanyId) ?? companies?.[0] ?? null;

  return { company, companies: companies ?? [], ...query };
}

/**
 * Shared by the upload button and the drop target, so both report success the
 * same way and neither can drift from the other.
 */
export function useUploadKnowledgeSource(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, kind }: { file: File; kind: KnowledgeSourceKind }) =>
      uploadFile<KnowledgeSource>(`/companies/${companyId}/knowledge-sources`, file, kind),
    onSuccess: async (source) => {
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success(`${source.original_filename} uploaded — queued for parsing`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
