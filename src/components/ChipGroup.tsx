import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChipOption {
  id: string;
  label: string;
  hint?: string;
  /** Multi-select only: picking this clears the others, and picking another clears this. */
  exclusive?: boolean;
}

interface ChipGroupProps {
  options: ChipOption[];
  value: string[];
  onChange: (next: string[], changedId: string) => void;
  multi?: boolean;
  /** stack = full-width rows, wrap = flowing pills, row = equal-width columns. */
  layout?: "stack" | "wrap" | "row";
  label?: string;
  disabled?: boolean;
}

export function nextSelection(options: ChipOption[], value: string[], id: string, multi: boolean): string[] {
  if (!multi) return [id];
  const picked = options.find((o) => o.id === id);
  if (value.includes(id)) return value.filter((v) => v !== id);
  if (picked?.exclusive) return [id];
  const exclusive = new Set(options.filter((o) => o.exclusive).map((o) => o.id));
  return [...value.filter((v) => !exclusive.has(v)), id];
}

export function ChipGroup({ options, value, onChange, multi = false, layout = "stack", label, disabled }: ChipGroupProps) {
  const cols = options.length === 4 ? 2 : options.length;

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        layout === "stack" && "flex flex-col gap-2.5",
        layout === "wrap" && "flex flex-wrap gap-2",
        layout === "row" && "grid gap-2",
      )}
      style={layout === "row" ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => onChange(nextSelection(options, value, o.id, multi), o.id)}
            className={cn(
              // 75ms: the tap highlight lands well inside the 100ms mark
              "group relative flex touch-manipulation items-center gap-3 border text-left transition duration-75 active:scale-[0.985] active:border-lamp active:bg-lamp/15",
              layout === "stack" && "min-h-[58px] w-full rounded-2xl px-4 py-3 text-body",
              layout === "wrap" && "min-h-12 rounded-[22px] px-4 py-2.5 text-body",
              layout === "row" && "min-h-[52px] justify-center rounded-2xl px-3 py-2.5 text-center text-body",
              on
                ? "border-lamp bg-lamp/15 text-ink"
                : "border-line bg-surface text-ink hover:border-ink-faint hover:bg-surface-2",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                layout === "row" && "hidden",
                layout === "wrap" && "size-[18px]",
                on ? "border-lamp bg-lamp text-on-lamp" : "border-ink-faint text-transparent",
              )}
            >
              <Check className="size-3" strokeWidth={3.5} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block">{o.label}</span>
              {o.hint && <span className="mt-0.5 block text-small text-ink-muted">{o.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
