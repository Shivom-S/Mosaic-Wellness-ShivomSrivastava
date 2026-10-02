import { useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import type { DailyEntry } from "@/content";
import { daysBetween } from "@/content/util";
import { todayISO } from "@/lib/track";
import { btn, DOT_TONE } from "@/lib/ui";

interface TrackerDatesProps {
  entries: DailyEntry[];
  onChange: (next: DailyEntry[]) => void;
}

const longDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export function TrackerDates({ entries, onChange }: TrackerDatesProps) {
  const [value, setValue] = useState("");
  const today = todayISO();

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    if (value > today) return void toast("That date hasn't happened yet. Pick today or an earlier day.");
    if (entries.some((x) => x.date === value)) return void toast("That date is already on the list. Pick a different one.");
    onChange([...entries, { date: value, values: {} }].sort((a, b) => a.date.localeCompare(b.date)));
    setValue("");
  };

  // entries are oldest-first; show newest-first, with the gap back to the one before
  const rows = entries
    .map((x, i) => ({ date: x.date, gap: i > 0 ? daysBetween(entries[i - 1].date, x.date) : null }))
    .reverse();

  return (
    <div>
      <form onSubmit={add} className="flex items-stretch gap-2.5">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Period start date</span>
          <input
            type="date"
            value={value}
            max={today}
            onChange={(e) => setValue(e.target.value)}
            className="field h-full min-w-0 appearance-none"
          />
        </label>
        <button type="submit" disabled={!value} className={btn("primary", "shrink-0 px-5")}>
          <Plus className="size-4" aria-hidden="true" />
          Add
        </button>
      </form>

      {rows.length > 0 && (
        <ul className="mt-5 divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-surface">
          {rows.map((r) => {
            const status = r.gap === null ? null : r.gap >= 21 && r.gap <= 35 ? "good" : r.gap <= 45 ? "meh" : "bad";
            return (
              <li key={r.date} className="flex min-h-[64px] items-center justify-between gap-3 py-2 pl-4 pr-1.5">
                <div className="min-w-0">
                  <p className="text-body font-medium text-ink">{longDate(r.date)}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-small text-ink-muted">
                    {status && <span aria-hidden="true" className={`size-2 rounded-full ${DOT_TONE[status].fill}`} />}
                    {r.gap === null ? "Earliest date" : `${r.gap} days after the one before`}
                    {status && <span className="sr-only">, {DOT_TONE[status].label}</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(entries.filter((x) => x.date !== r.date))}
                  aria-label={`Remove ${longDate(r.date)}`}
                  className="inline-flex size-12 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-2 hover:text-doctor"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
