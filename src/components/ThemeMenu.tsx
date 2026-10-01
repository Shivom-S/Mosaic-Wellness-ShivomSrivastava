import { useEffect, useRef, useState } from "react";
import { Eye, Moon, Palette, Sun, type LucideIcon } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface ThemeMenuProps {
  theme: Theme;
  onTheme: (t: Theme) => void;
  comfort: boolean;
  onComfort: (on: boolean) => void;
}

function Option({
  icon: Icon,
  label,
  hint,
  on,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "flex min-h-[52px] w-full touch-manipulation items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
        on ? "bg-lamp/15 text-ink" : "text-ink hover:bg-surface-2",
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          on ? "bg-lamp text-on-lamp" : "bg-surface-2 text-ink-muted",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-medium leading-tight">{label}</span>
        <span className="block text-[12px] leading-snug text-ink-muted">{hint}</span>
      </span>
    </button>
  );
}

/** One header button, three choices: Night, Day mode, and the sleep-friendly "Easier on the eyes". */
export function ThemeMenu({ theme, onTheme, comfort, onComfort }: ThemeMenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Theme and display"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex size-11 touch-manipulation items-center justify-center rounded-full border transition active:scale-90",
          open ? "border-lamp text-lamp" : "border-line text-ink-muted hover:border-lamp/60 hover:bg-surface hover:text-lamp",
        )}
      >
        <Palette className="size-5" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="group"
          aria-label="Theme and display"
          className="absolute right-0 top-[52px] z-40 w-[272px] animate-fade-up rounded-2xl border border-line bg-surface p-1.5 shadow-lg"
        >
          <Option icon={Moon} label="Night" hint="The default. Deep green, easy at 1 AM." on={theme === "night"} onClick={() => onTheme("night")} />
          <Option icon={Sun} label="Day mode" hint="Pale paper, for daylight." on={theme === "lamp"} onClick={() => onTheme("lamp")} />
          <div className="mx-3 my-1 h-px bg-line" />
          <Option
            icon={Eye}
            label="Easier on the eyes"
            hint="Bigger text, dimmer light, nothing moves."
            on={comfort}
            onClick={() => onComfort(!comfort)}
          />
        </div>
      )}
    </div>
  );
}
