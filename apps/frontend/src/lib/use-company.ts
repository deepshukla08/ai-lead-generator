"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useSession } from "@/lib/store";
import type { CompanyProfile } from "@/lib/types";

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: () => api<CompanyProfile[]>("/companies"),
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
