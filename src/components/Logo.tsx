import { cn } from "@/lib/utils";

export function Crescent({ className }: { className?: string }) {
  return (
    <svg viewBox="12 12 40 40" aria-hidden="true" className={cn("size-[1em] text-lamp", className)}>
      <path d="M40.5 14a19 19 0 1 0 9.5 33.6A16 16 0 0 1 40.5 14Z" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-[26px] leading-none tracking-tight", className)}>
      <Crescent className="text-[22px]" />
      <span>1AM</span>
    </span>
  );
}
