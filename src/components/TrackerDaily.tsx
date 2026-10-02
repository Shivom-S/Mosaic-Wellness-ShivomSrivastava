import { useState } from "react";
import { Hand, Minus, Plus } from "lucide-react";
import type { DailyEntry, DailyTracker, Field, HairCount, NumberField, WorryId } from "@/content";
import { totalCount } from "@/content/hair";
import { ChipGroup } from "@/components/ChipGroup";
import { HairCounter, NO_HAIRS } from "@/components/HairCounter";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { btn } from "@/lib/ui";
import { cn } from "@/lib/utils";

type Draft = Record<string, number | string | boolean | undefined>;

interface TrackerDailyProps {
  worryId: WorryId;
  tracker: DailyTracker;
  /** Today's entry, if there already is one (so you can correct it). */
  today?: DailyEntry;
  /** Starting values when there's no entry for today yet (hair: tonight's check). */
  prefill?: DailyEntry["values"];
  onSave: (values: DailyEntry["values"]) => void;
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 touch-manipulation items-center rounded-full border transition-colors duration-200",
        on ? "border-lamp bg-lamp" : "border-line bg-surface-2",
      )}
    >
      <span
        className={cn(
          "absolute left-1 size-6 rounded-full shadow transition-transform duration-200",
          on ? "translate-x-6 bg-on-lamp" : "translate-x-0 bg-ink-muted",
        )}
      />
    </button>
  );
}

function Stepper({ field, value, onChange }: { field: NumberField; value: number | undefined; onChange: (n: number) => void }) {
  const clamp = (n: number) => Math.min(field.max, Math.max(field.min, n));
  const bump = (d: number) => onChange(clamp((value ?? field.min) + d));
  const wide = field.max - field.min > 100;

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={() => bump(-field.step)} aria-label={`One less ${field.unit}`} className={btn("secondary", "size-12 shrink-0 !px-0")}>
          <Minus className="size-5" aria-hidden="true" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label={field.label}
          placeholder="–"
          value={value ?? ""}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (digits !== "") onChange(clamp(parseInt(digits, 10)));
          }}
          className="field num min-w-0 flex-1 text-center font-display text-[32px]"
        />
        <button type="button" onClick={() => bump(field.step)} aria-label={`One more ${field.unit}`} className={btn("secondary", "size-12 shrink-0 !px-0")}>
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </div>
      {wide && (
        <div className="mt-2 flex justify-center gap-2">
          {[-10, 10].map((d) => (
            <button key={d} type="button" onClick={() => bump(d)} className={btn("ghost", "px-3")}>
              {d > 0 ? `+${d}` : `−${-d}`}
            </button>
          ))}
        </div>
      )}
      <p className="mt-1 text-center text-[13px] text-ink-faint">{field.unit}</p>
    </div>
  );
}

export function TrackerDaily({ worryId, tracker, today, prefill, onSave }: TrackerDailyProps) {
  const [draft, setDraft] = useState<Draft>(() => ({ ...(today?.values ?? prefill ?? {}) }));
  const [padOpen, setPadOpen] = useState(false);
  const [padCount, setPadCount] = useState<HairCount>(NO_HAIRS);

  const set = (id: string, v: Draft[string]) => setDraft((d) => ({ ...d, [id]: v }));
  const complete = tracker.fields.every((f) => f.kind === "toggle" || draft[f.id] !== undefined);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complete) return;
    const values: DailyEntry["values"] = {};
    tracker.fields.forEach((f) => {
      values[f.id] = f.kind === "toggle" ? draft[f.id] === true : (draft[f.id] as number | string);
    });
    onSave(values);
  };

  const control = (f: Field) => {
    if (f.kind === "chips") {
      const cur = draft[f.id];
      return (
        <ChipGroup
          layout="row"
          label={f.label}
          options={f.options.map((o) => ({ id: o.id, label: o.label }))}
          value={cur === undefined ? [] : [String(cur)]}
          onChange={([id]) => set(f.id, id)}
        />
      );
    }
    if (f.kind === "number") {
      return (
        <div className="space-y-3">
          <Stepper field={f} value={draft[f.id] as number | undefined} onChange={(n) => set(f.id, n)} />
          {worryId === "hair" && f.id === "count" && (
            <button
              type="button"
              onClick={() => {
                setPadCount(NO_HAIRS);
                setPadOpen(true);
              }}
              className={btn("secondary", "w-full")}
            >
              <Hand className="size-4" aria-hidden="true" />
              Count with the tap pad
            </button>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <form onSubmit={submit} className="space-y-7">
      {!today && prefill && <p className="-mb-3 text-[13px] text-ink-muted">Pre-filled from tonight's count.</p>}
      {tracker.fields.map((f) =>
        f.kind === "toggle" ? (
          <div key={f.id} className="flex min-h-12 items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-4 py-2.5">
            <span className="font-display text-[19px] leading-tight">{f.label}</span>
            <Toggle on={draft[f.id] === true} onChange={(v) => set(f.id, v)} label={f.label} />
          </div>
        ) : (
          <fieldset key={f.id} className="min-w-0">
            <legend className="mb-3 font-display text-[22px] leading-tight">{f.label}</legend>
            {control(f)}
          </fieldset>
        ),
      )}

      <div>
        <button type="submit" disabled={!complete} className={btn("primary", "w-full")}>
          {today ? "Update today's log" : "Log today"}
        </button>
        {!complete && <p className="mt-2.5 text-center text-[13px] text-ink-faint">Fill in each one to log today.</p>}
      </div>

      <Drawer open={padOpen} onOpenChange={setPadOpen} shouldScaleBackground={false}>
        <DrawerContent className="mx-auto max-h-[94dvh] max-w-[480px] rounded-t-[28px] border-line bg-bg">
          <div className="overflow-y-auto px-5 pb-safe pt-4">
            <DrawerTitle className="sr-only">Count with the tap pad</DrawerTitle>
            <DrawerDescription className="sr-only">Tap once per hair, then use the total.</DrawerDescription>
            <HairCounter
              variant="drawer"
              value={padCount}
              onChange={setPadCount}
              onDone={(c) => {
                set("count", Math.min(600, totalCount(c)));
                setPadOpen(false);
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </form>
  );
}
