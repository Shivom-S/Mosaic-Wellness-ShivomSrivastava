import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface DisclosureProps {
  title: string;
  /** One line that says what's inside, so nobody has to open it to decide. */
  summary: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** A collapsed card with a title and a one-line summary. */
export function Disclosure({ title, summary, defaultOpen = false, children }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="overflow-hidden rounded-[22px] border border-line bg-surface">
      <CollapsibleTrigger className="flex min-h-[64px] w-full touch-manipulation items-center justify-between gap-3 px-5 py-3 text-left transition-colors duration-75 hover:bg-surface-2 active:bg-surface-2">
        <span className="min-w-0">
          <span className="block font-display text-[1.1875rem] leading-snug text-ink">{title}</span>
          <span className="mt-0.5 block text-small text-ink-muted">{summary}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn("size-5 shrink-0 text-ink-muted transition-transform duration-200", open && "rotate-180")}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="border-t border-line px-5 pb-5 pt-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
