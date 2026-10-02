import type { MouseEvent, ReactNode } from "react";
import { LifeBuoy } from "lucide-react";
import { Logo } from "@/components/Logo";
import { StarField } from "@/components/StarField";
import { TextSizeToggle, ThemeToggle } from "@/components/HeaderToggles";
import { WipeButton } from "@/components/WipeButton";
import type { TextSize, Theme } from "@/lib/theme";
import { openUrgent } from "@/lib/urgent";
import { cn } from "@/lib/utils";

interface ShellProps {
  children: ReactNode;
  theme: Theme;
  onTheme: (t: Theme) => void;
  textSize: TextSize;
  onTextSize: (s: TextSize) => void;
  onHome: boolean;
  /** Full star field (home) vs. just a quiet sky down the sides on wide screens. */
  stars?: "full" | "sides";
  footer?: boolean;
}

const NAV_LINK =
  "inline-flex min-h-12 items-center rounded-xl px-3 text-body text-ink-muted transition-colors hover:bg-surface hover:text-ink";
const FOOT_LINK =
  "inline-flex min-h-12 items-center rounded-xl px-1 text-small font-medium text-ink-muted transition-colors hover:text-ink";

export function scrollToHow() {
  document.getElementById("how")?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
}

export function Shell({ children, theme, onTheme, textSize, onTextSize, onHome, stars = "sides", footer = true }: ShellProps) {
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
          "pl-[max(env(safe-area-inset-left),1rem)] pr-[max(env(safe-area-inset-right),1rem)] lg:px-10",
          "pt-[max(env(safe-area-inset-top),0.5rem)] pb-safe",
        )}
      >
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-x-2 gap-y-2 py-2 lg:min-h-20">
          <a
            href="#/"
            aria-label="1AM, home"
            className="-ml-1 inline-flex min-h-12 items-center rounded-xl px-1 transition-opacity hover:opacity-80"
          >
            <Logo />
          </a>
          <nav aria-label="Main" className="flex items-center gap-1 lg:gap-2">
            <a href="#how" onClick={goHow} className={cn(NAV_LINK, "hidden lg:inline-flex")}>
              How it works
            </a>
            <a href="#/about" className={cn(NAV_LINK, "hidden lg:inline-flex")}>
              Why I built this
            </a>
            <button
              type="button"
              onClick={openUrgent}
              className="inline-flex min-h-12 touch-manipulation items-center gap-1.5 rounded-full bg-doctor px-3 text-small font-semibold text-bg transition duration-75 hover:brightness-110 active:scale-95 lg:gap-2 lg:px-5 lg:text-body"
            >
              <LifeBuoy className="size-[18px] shrink-0" aria-hidden="true" />
              Get urgent help
            </button>
            <TextSizeToggle size={textSize} onSize={onTextSize} />
            <ThemeToggle theme={theme} onTheme={onTheme} />
          </nav>
        </header>

        <main id="main" tabIndex={-1} className="flex-1 pb-10 pt-2 outline-none lg:pb-16 lg:pt-4">
          {children}
        </main>

        {footer && (
          <footer className="border-t border-line pt-5">
            <p className="text-small text-ink-muted">Not a diagnosis. For emergencies, call 112.</p>
            <div className="-ml-1 mt-1 flex flex-wrap items-center gap-x-5">
              <a href="#how" onClick={goHow} className={FOOT_LINK}>
                How it works
              </a>
              <a href="#/about" className={FOOT_LINK}>
                Why I built this
              </a>
              <WipeButton label="Wipe my data" />
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
