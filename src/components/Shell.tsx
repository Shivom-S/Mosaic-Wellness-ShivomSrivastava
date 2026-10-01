import type { MouseEvent, ReactNode } from "react";
import { LifeBuoy } from "lucide-react";
import { Logo } from "@/components/Logo";
import { StarField } from "@/components/StarField";
import { ThemeMenu } from "@/components/ThemeMenu";
import { WipeButton } from "@/components/WipeButton";
import type { Theme } from "@/lib/theme";
import { openUrgent } from "@/lib/urgent";
import { cn } from "@/lib/utils";

interface ShellProps {
  children: ReactNode;
  theme: Theme;
  onTheme: (t: Theme) => void;
  comfort: boolean;
  onComfort: (on: boolean) => void;
  onHome: boolean;
  /** Full star field (home) vs. just a quiet sky down the sides on wide screens. */
  stars?: "full" | "sides";
  footer?: boolean;
}

const NAV_LINK =
  "inline-flex min-h-11 items-center rounded-xl px-3 text-[15px] text-ink-muted transition-colors hover:bg-surface hover:text-ink";

export function scrollToHow() {
  document.getElementById("how")?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
}

export function Shell({ children, theme, onTheme, comfort, onComfort, onHome, stars = "sides", footer = true }: ShellProps) {
  // "How it works" lives on Home: scroll there, or go home first and then scroll.
  const goHow = (e: MouseEvent) => {
    e.preventDefault();
    if (onHome) scrollToHow();
    else {
      window.location.hash = "#/";
      window.setTimeout(scrollToHow, 120);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <StarField className={stars === "sides" ? "hidden opacity-60 md:block" : undefined} />
      <div aria-hidden="true" className="lamp-glow pointer-events-none absolute inset-x-0 top-0 h-[460px]" />

      <div
        className={cn(
          "relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col lg:max-w-[1120px]",
          "pl-[max(env(safe-area-inset-left),1.25rem)] pr-[max(env(safe-area-inset-right),1.25rem)] lg:px-10",
          "pt-[max(env(safe-area-inset-top),0.5rem)] pb-safe",
        )}
      >
        <header className="flex h-14 items-center justify-between lg:h-20">
          <a
            href="#/"
            aria-label="1AM, home"
            className="-ml-1 inline-flex min-h-11 items-center rounded-xl px-1 transition-opacity hover:opacity-80"
          >
            <Logo />
          </a>
          <nav aria-label="Main" className="flex items-center gap-1.5 lg:gap-2">
            <a href="#how" onClick={goHow} className={cn(NAV_LINK, "hidden lg:inline-flex")}>
              How it works
            </a>
            <a href="#/about" className={cn(NAV_LINK, "hidden lg:inline-flex")}>
              Why I built this
            </a>
            <button
              type="button"
              onClick={openUrgent}
              className="inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-full border border-doctor/60 px-3.5 text-[14px] font-semibold text-doctor transition hover:bg-doctor/10 active:scale-95 lg:px-4"
            >
              <LifeBuoy className="size-[18px]" aria-hidden="true" />
              <span className="lg:hidden">Urgent</span>
              <span className="hidden lg:inline">Need urgent help?</span>
            </button>
            <ThemeMenu theme={theme} onTheme={onTheme} comfort={comfort} onComfort={onComfort} />
          </nav>
        </header>

        <main id="main" tabIndex={-1} className="flex-1 pb-10 pt-2 outline-none lg:pb-16 lg:pt-4">
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
