"use client";

import { LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/store";

export function UserMenu() {
  const router = useRouter();
  const signOut = useSession((s) => s.signOut);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-accent/60 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors">
        <div className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium">
          DS
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">Deep Shukla</p>
          <p className="text-muted-foreground truncate text-xs">Owner</p>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        {/* Base UI requires a Group around a GroupLabel. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm">Deep Shukla</p>
            <p className="text-muted-foreground text-xs">Demo account — no authentication</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2" disabled>
          <Settings className="size-3.5" /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onClick={() => {
            signOut();
            router.push("/login");
          }}
        >
          <LogOut className="size-3.5" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
