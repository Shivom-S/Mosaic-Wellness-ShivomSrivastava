import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Copy } from "lucide-react";
import type { Result, Worry } from "@/content";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { copyText } from "@/lib/share";
import { btn } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface DoctorNoteProps {
  worry: Worry;
  result: Result;
  at: number;
  /** Open by default when the verdict is "worth a doctor visit". */
  defaultOpen?: boolean;
}

export function DoctorNote({ worry, result, at, defaultOpen = false }: DoctorNoteProps) {
  const [open, setOpen] = useState(defaultOpen);
  const when = new Date(at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const text = [
    `Summary for my doctor: ${worry.title}`,
    `Checked on ${when}`,
    "",
    ...result.doctorNote.map((l) => `- ${l}`),
    "",
    "Self-reported on 1AM. This is not a diagnosis.",
  ].join("\n");

  const copy = async () => {
    const ok = await copyText(text);
    toast(ok ? "Copied. Paste it into WhatsApp or show it at the clinic." : "Couldn't copy. Select the text and copy it by hand.");
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="overflow-hidden rounded-[28px] border border-line bg-surface">
      <CollapsibleTrigger className="flex min-h-[60px] w-full touch-manipulation items-center justify-between gap-3 px-5 py-3 text-left">
        <span>
          <span className="block font-display text-[19px] leading-tight text-ink">Doctor-ready summary</span>
          <span className="mt-0.5 block text-[13px] text-ink-muted">What to say, already written down</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn("size-5 shrink-0 text-ink-muted transition-transform duration-200", open && "rotate-180")}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="border-t border-line px-5 pb-5 pt-4">
          <ul className="space-y-2.5 text-[15px] leading-relaxed text-ink">
            {result.doctorNote.map((l, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-lamp" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={copy} className={btn("secondary", "mt-5 w-full")}>
            <Copy className="size-4" aria-hidden="true" />
            Copy
          </button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
