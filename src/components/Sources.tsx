import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { SOURCES, sourceList, type Source } from "@/content";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface SourcesProps {
  /** Source ids. Omit to list everything 1AM cites. */
  ids?: string[];
  /** Group by organisation (About page) instead of one flat list. */
  grouped?: boolean;
  /** Plain list, no collapsing. */
  collapsible?: boolean;
  defaultOpen?: boolean;
}

function SourceLink({ s, showOrg }: { s: Source; showOrg: boolean }) {
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-11 items-start justify-between gap-3 rounded-xl py-2.5"
    >
      <span className="min-w-0 text-[14px] leading-snug text-ink-muted transition-colors group-hover:text-ink">
        {showOrg && <b className="block font-semibold text-ink">{s.org}</b>}
        {s.title}
      </span>
      <ExternalLink aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-faint group-hover:text-lamp" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

function List({ items, grouped }: { items: Source[]; grouped: boolean }) {
  if (!grouped) {
    return (
      <ul className="divide-y divide-line">
        {items.map((s) => (
          <li key={s.id}>
            <SourceLink s={s} showOrg />
          </li>
        ))}
      </ul>
    );
  }
  const byOrg = new Map<string, Source[]>();
  items.forEach((s) => byOrg.set(s.org, [...(byOrg.get(s.org) ?? []), s]));
  return (
    <div className="space-y-5">
      {[...byOrg.entries()].map(([org, list]) => (
        <div key={org}>
          <h3 className="text-[15px] font-semibold text-ink">{org}</h3>
          <ul className="mt-1 divide-y divide-line/60">
            {list.map((s) => (
              <li key={s.id}>
                <SourceLink s={s} showOrg={false} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function Sources({ ids, grouped = false, collapsible = true, defaultOpen = false }: SourcesProps) {
  const [open, setOpen] = useState(defaultOpen);
  const items = ids ? sourceList(ids) : Object.values(SOURCES);

  if (!collapsible) return <List items={items} grouped={grouped} />;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex min-h-11 w-full touch-manipulation items-center justify-between gap-3 text-left text-sm text-ink-muted">
        <span>
          {items.length} {items.length === 1 ? "source" : "sources"}, linked
        </span>
        <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform duration-200", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <List items={items} grouped={grouped} />
      </CollapsibleContent>
    </Collapsible>
  );
}
