import { cn } from "@/lib/utils";

/**
 * A single headline number. Deliberately not a chart: one value over no
 * dimension has nothing to plot, and a sparkline behind it would be decoration.
 *
 * Labels and context wear text tokens, never a series colour — nothing here
 * encodes identity, so nothing here should be coloured as if it did.
 */
export function StatTile({
  label,
  value,
  context,
  emphasis = false,
}: {
  label: string;
  value: string | number;
  context?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-5",
        emphasis && "border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20",
      )}
    >
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {context && <p className="text-muted-foreground mt-1 text-xs">{context}</p>}
    </div>
  );
}
