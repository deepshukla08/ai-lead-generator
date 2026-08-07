"use client";

import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/store";
import { useActiveCompany } from "@/lib/use-company";

export function CompanySwitcher() {
  const router = useRouter();
  const setActiveCompany = useSession((s) => s.setActiveCompany);
  const { company, companies, isPending } = useActiveCompany();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-accent/60 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors">
        <div className="bg-foreground text-background flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
          {company ? company.name.slice(0, 2).toUpperCase() : <Building2 className="size-3.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {isPending ? "Loading…" : (company?.name ?? "No company")}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {company ? `knowledge ${company.status}` : "Set one up"}
          </p>
        </div>
        <ChevronsUpDown className="text-muted-foreground size-3.5 shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-muted-foreground text-xs">Companies</DropdownMenuLabel>
        {companies.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => setActiveCompany(option.id)}
            className="gap-2"
          >
            <Check
              className={option.id === company?.id ? "size-3.5 opacity-100" : "size-3.5 opacity-0"}
            />
            <span className="truncate">{option.name}</span>
          </DropdownMenuItem>
        ))}
        {companies.length === 0 && (
          <p className="text-muted-foreground px-2 py-1.5 text-sm">None yet</p>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/onboarding")} className="gap-2">
          <Plus className="size-3.5" />
          Add a company
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
