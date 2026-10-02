import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** A small lucide icon in a tinted circle. Decorative: the label next to it carries the meaning. */
export function IconBadge({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-full bg-lamp/15 text-lamp", className)}
    >
      <Icon className="size-[18px]" strokeWidth={1.75} />
    </span>
  );
}
