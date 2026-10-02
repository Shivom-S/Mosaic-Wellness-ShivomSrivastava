import { createContext, useContext } from "react";
import { LifeBuoy, Phone } from "lucide-react";
import { URGENT } from "@/content";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useDesktop } from "@/lib/media";
import { setUrgentOpen, useUrgentOpen } from "@/lib/urgent";

function Body() {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-doctor/15 text-doctor">
          <LifeBuoy className="size-5" aria-hidden="true" />
        </span>
        <DrawerOrDialogTitle />
      </div>
      <DrawerOrDialogDescription />

      <ul className="space-y-2.5 text-body text-ink">
        {URGENT.signs.map((s) => (
          <li key={s} className="flex gap-3">
            <span aria-hidden="true" className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-doctor" />
            <span>{s}</span>
          </li>
        ))}
      </ul>

      <ul className="space-y-2.5">
        {URGENT.numbers.map((n) => (
          <li key={n.number}>
            <a
              href={`tel:${n.number}`}
              className="flex min-h-[60px] items-center justify-between gap-4 rounded-2xl border border-doctor/40 bg-doctor/10 px-4 py-3 text-ink transition-colors hover:bg-doctor/20"
            >
              <span className="text-small text-ink-muted">{n.label}</span>
              <span className="num flex shrink-0 items-center gap-2 font-display text-[1.75rem] leading-none text-doctor">
                <Phone className="size-5" aria-hidden="true" />
                {n.number}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="text-small text-ink-muted">{URGENT.footer}</p>
    </>
  );
}

// The title and description differ by primitive (Drawer vs Dialog), so the body asks which one it is in.
const Ctx = createContext<"drawer" | "dialog">("drawer");

function DrawerOrDialogTitle() {
  const kind = useContext(Ctx);
  const cls = "font-display text-[1.5rem] font-normal leading-tight tracking-normal text-ink";
  return kind === "dialog" ? (
    <DialogTitle className={cls}>{URGENT.title}</DialogTitle>
  ) : (
    <DrawerTitle className={cls}>{URGENT.title}</DrawerTitle>
  );
}

function DrawerOrDialogDescription() {
  const kind = useContext(Ctx);
  const cls = "text-body text-ink-muted";
  return kind === "dialog" ? (
    <DialogDescription className={cls}>{URGENT.intro}</DialogDescription>
  ) : (
    <DrawerDescription className={cls}>{URGENT.intro}</DrawerDescription>
  );
}

/** Phone: a bottom drawer. Laptop: a centred dialog. Same content, same numbers. */
export function UrgentHelp() {
  const open = useUrgentOpen();
  const desktop = useDesktop();

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={setUrgentOpen}>
        <DialogContent className="max-h-[90dvh] max-w-xl gap-4 overflow-y-auto rounded-[28px] border-line bg-surface p-7">
          <Ctx.Provider value="dialog">
            <Body />
          </Ctx.Provider>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setUrgentOpen}>
      <DrawerContent className="max-h-[92dvh] rounded-t-[28px] border-line bg-surface">
        <div className="space-y-4 overflow-y-auto px-5 pb-safe pt-5">
          <Ctx.Provider value="drawer">
            <Body />
          </Ctx.Provider>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
