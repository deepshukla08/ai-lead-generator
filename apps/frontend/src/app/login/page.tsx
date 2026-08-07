"use client";

import { Bot } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/store";

/**
 * There is no authentication behind this screen and it does not pretend to
 * validate anything — any input signs you in. It exists so the product demos
 * with a front door, and so the real sign-in has a place to land later.
 */
export default function LoginPage() {
  const router = useRouter();
  const signIn = useSession((s) => s.signIn);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <Bot className="size-6" />
          <span className="text-xl font-semibold tracking-tight">AgentSDR</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground mt-1 text-sm">Continue to your workspace.</p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            signIn();
            router.push("/");
          }}
          className="mt-8 space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" placeholder="you@company.com" defaultValue="" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <p className="text-muted-foreground mt-6 rounded-md border border-dashed p-3 text-xs">
          Demo build — authentication is not implemented. Any credentials, or none at all, will sign
          you in.
        </p>
      </div>
    </div>
  );
}
