import { ExternalLink } from "lucide-react";
import { SOURCES, sourceList, type Source } from "@/content";

interface SourcesProps {
  /** Source ids. Omit to list everything 1AM cites. */
  ids?: string[];
  /** Group by organisation (About page) instead of one flat list. */
  grouped?: boolean;
}

function SourceLink({ s, showOrg }: { s: Source; showOrg: boolean }) {
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-12 items-start justify-between gap-3 rounded-xl py-2.5 transition-colors"
    >
      <span className="min-w-0 text-small text-ink-muted transition-colors group-hover:text-ink">
        {showOrg && <b className="block font-semibold text-ink">{s.org}</b>}
        {s.title}
      </span>
      <ExternalLink aria-hidden="true" className="mt-1 size-4 shrink-0 text-ink-muted group-hover:text-lamp" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/** A plain list of the sources behind an answer, each linked. */
export function Sources({ ids, grouped = false }: SourcesProps) {
  const items = ids ? sourceList(ids) : Object.values(SOURCES);

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
    <div className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-x-10 lg:gap-y-6 lg:space-y-0">
      {[...byOrg.entries()].map(([org, list]) => (
        <div key={org}>
          <h3 className="text-body font-semibold text-ink">{org}</h3>
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
