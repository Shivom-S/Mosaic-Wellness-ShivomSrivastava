import { useEffect, useRef, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import type { TextSize, Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface HeaderToggleProps {
  label: string;
  /** Spoken name when it needs to say more than the visible label. */
  ariaLabel?: string;
  icon: ReactNode;
  pressed?: boolean;
  onClick: () => void;
}

/**
 * A header button: icon plus a visible label on laptops. On phones the label is the aria-label,
 * and a long press shows it as a small tooltip so the icon never has to be guessed.
 */
function HeaderToggle({ label, ariaLabel, icon, pressed, onClick }: HeaderToggleProps) {
  const [tip, setTip] = useState(false);
  const start = useRef<number | undefined>(undefined);
  const hide = useRef<number | undefined>(undefined);
  const longPressed = useRef(false);

  useEffect(
    () => () => {
      window.clearTimeout(start.current);
      window.clearTimeout(hide.current);
    },
    [],
  );

  const press = () => {
    longPressed.current = false;
    window.clearTimeout(start.current);
    start.current = window.setTimeout(() => {
      longPressed.current = true;
      setTip(true);
      window.clearTimeout(hide.current);
      hide.current = window.setTimeout(() => setTip(false), 1600);
    }, 450);
  };
  const release = () => window.clearTimeout(start.current);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={ariaLabel ?? label}
        aria-pressed={pressed}
        onPointerDown={press}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => {
          // a long press only explains the button; it doesn't flip it
          if (longPressed.current) {
            longPressed.current = false;
            return;
          }
          onClick();
        }}
        className={cn(
          "inline-flex size-12 touch-manipulation select-none items-center justify-center gap-2 rounded-full border text-body font-medium transition duration-75 active:scale-95 lg:w-auto lg:px-4",
          pressed
            ? "border-lamp bg-lamp/15 text-lamp"
            : "border-line text-ink-muted hover:border-lamp/60 hover:bg-surface hover:text-lamp",
        )}
      >
        {icon}
        <span className="hidden lg:inline">{label}</span>
      </button>
      {tip && (
        <span
          role="status"
          className="pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] z-40 animate-fade-up whitespace-nowrap rounded-xl bg-ink px-3 py-1.5 text-small font-medium text-bg lg:hidden"
        >
          {label}
        </span>
      )}
    </div>
  );
}

export function TextSizeToggle({ size, onSize }: { size: TextSize; onSize: (s: TextSize) => void }) {
  const large = size === "large";
  return (
    <HeaderToggle
      label="Larger text"
      pressed={large}
      onClick={() => onSize(large ? "normal" : "large")}
      icon={
        <span aria-hidden="true" className="font-display text-[1.125rem] font-semibold leading-none">
          Aa
        </span>
      }
    />
  );
}

export function ThemeToggle({ theme, onTheme }: { theme: Theme; onTheme: (t: Theme) => void }) {
  const toDay = theme === "night";
  const Icon = toDay ? Sun : Moon;
  return (
    <HeaderToggle
      label={toDay ? "Day mode" : "Night mode"}
      ariaLabel={toDay ? "Switch to Day mode" : "Switch to Night mode"}
      onClick={() => onTheme(toDay ? "lamp" : "night")}
      icon={<Icon className="size-5" aria-hidden="true" />}
    />
  );
}
