import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { store } from "@/lib/storage";
import { btn } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface WipeButtonProps {
  /** "all" clears every 1am: key. Otherwise just these keys (without the prefix). */
  scope?: "all" | string[];
  label?: string;
  question?: string;
  detail?: string;
  done?: string;
  variant?: "link" | "danger";
  className?: string;
  onWiped?: () => void;
}

export function WipeButton({
  scope = "all",
  label = "Wipe everything",
  question = "Wipe everything from this phone?",
  detail = "Your saved checks, trackers and theme will be deleted. 1AM never had a copy, so this can't be undone.",
  done = "Gone. Nothing left on this phone.",
  variant = "link",
  className,
  onWiped,
}: WipeButtonProps) {
  const [open, setOpen] = useState(false);

  const wipe = () => {
    if (scope === "all") store.wipeAll();
    else scope.forEach((k) => store.remove(k));
    setOpen(false);
    toast(done);
    onWiped?.();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          variant === "link"
            ? btn("ghost", "gap-1.5 decoration-transparent hover:decoration-line")
            : btn("danger"),
          className,
        )}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2.5rem)] max-w-sm rounded-[28px] border-line bg-surface p-6 sm:rounded-[28px]">
          <div className="space-y-2 pr-6">
            <DialogTitle className="font-display text-2xl font-normal leading-tight">{question}</DialogTitle>
            <DialogDescription className="text-[15px] leading-relaxed text-ink-muted">{detail}</DialogDescription>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            <button type="button" onClick={wipe} className={btn("danger", "w-full")}>
              Yes, wipe it
            </button>
            <button type="button" onClick={() => setOpen(false)} className={btn("secondary", "w-full")}>
              Keep it
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
