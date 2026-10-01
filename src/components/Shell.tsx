import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";
import { Logo } from "@/components/Logo";
import { StarField } from "@/components/StarField";
import { WipeButton } from "@/components/WipeButton";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface ShellProps {
  children: ReactNode;
  theme: Theme;
  onToggleTheme: () => void;
  /** Full star field (home) vs. just a quiet sky down the sides on wide screens. */
  stars?: "full" | "sides";
  footer?: boolean;
}

export function Shell({ children, theme, onToggleTheme, stars = "sides", footer = true }: ShellProps) {
  const lampOn = theme === "lamp";

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <StarField className={stars === "sides" ? "hidden opacity-60 md:block" : undefined} />
      <div aria-hidden="true" className="lamp-glow pointer-events-none absolute inset-x-0 top-0 h-[460px]" />

      <div
        className={cn(
          "relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col",
          "pl-[max(env(safe-area-inset-left),1.25rem)] pr-[max(env(safe-area-inset-right),1.25rem)]",
          "pt-[max(env(safe-area-inset-top),0.5rem)] pb-safe",
        )}
      >
        <header className="flex h-14 items-center justify-between">
          <a href="#/" aria-label="1AM, home" className="-ml-1 inline-flex min-h-11 items-center rounded-xl px-1">
            <Logo />
          </a>
          <div className="-mr-2 flex items-center gap-1">
            <a
              href="#/about"
              className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              Why I built this
            </a>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-pressed={lampOn}
              aria-label={lampOn ? "Lamp is on. Switch back to night" : "Switch the lamp on"}
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-full transition-colors",
                lampOn ? "bg-lamp/15 text-lamp" : "text-ink-muted hover:bg-surface hover:text-lamp",
              )}
            >
              <Lightbulb className={cn("size-5 transition-all", lampOn && "fill-lamp/30")} aria-hidden="true" />
            </button>
          </div>
        </header>

        <main id="main" tabIndex={-1} className="flex-1 pb-10 pt-2 outline-none">
          {children}
        </main>

        {footer && (
          <footer className="border-t border-line pt-5 text-[13px] leading-relaxed text-ink-faint">
            <p>
              Not medical advice. 1AM explains common thresholds and when to see a doctor. It doesn't diagnose.
            </p>
            <div className="-ml-1 mt-2 flex flex-wrap items-center justify-between gap-x-4">
              <WipeButton />
              <a
                href="#/about"
                className="inline-flex min-h-11 items-center rounded-xl px-1 text-sm text-ink-muted transition-colors hover:text-ink"
              >
                Why I built this →
              </a>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
