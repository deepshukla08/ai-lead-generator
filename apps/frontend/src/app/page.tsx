"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

type Readiness = {
  status: string;
  checks: Record<string, string>;
};

export default function Home() {
  const { data, isPending, error } = useQuery({
    queryKey: ["readiness"],
    queryFn: () => api<Readiness>("/health/ready"),
    refetchInterval: 10_000,
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 p-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">AgentSDR</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          An autonomous AI Sales Development Representative.
        </p>
      </header>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-sm font-medium tracking-wide uppercase">System status</h2>

        {isPending && <p className="text-muted-foreground text-sm">Checking…</p>}

        {error && (
          <p className="text-sm text-red-600">
            API unreachable. Is <code>docker compose up</code> running?
          </p>
        )}

        {data && (
          <ul className="space-y-2 text-sm">
            {Object.entries(data.checks).map(([name, state]) => (
              <li key={name} className="flex items-center justify-between gap-4">
                <span className="font-mono">{name}</span>
                <span className={state === "ok" ? "text-green-600" : "text-red-600"}>{state}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
