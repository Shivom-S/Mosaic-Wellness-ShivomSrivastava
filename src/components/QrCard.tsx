import { useMemo } from "react";
import { X } from "lucide-react";
import qrcode from "qrcode-generator";
import { store, useStoreVersion } from "@/lib/storage";

const KEY = "qr-dismissed";
const QUIET = 2; // modules of empty border around the code

/** One <path> for every dark module, so the SVG stays tiny and takes its colour from currentColor. */
function qrPath(text: string) {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  let d = "";
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) if (qr.isDark(y, x)) d += `M${x + QUIET} ${y + QUIET}h1v1h-1z`;
  return { d, size: n + QUIET * 2 };
}

/** Desktop only: a QR of this page, so a reviewer on a laptop can open it on their phone. */
export function QrCard() {
  useStoreVersion(); // "Wipe everything" brings it back
  const dismissed = store.get<boolean>(KEY) === true;
  const url = window.location.origin + window.location.pathname;
  const qr = useMemo(() => qrPath(url), [url]);

  if (dismissed) return null;

  return (
    <aside
      aria-label="Open on your phone"
      className="fixed bottom-4 left-4 z-30 hidden w-[220px] rounded-2xl border border-line bg-surface p-4 text-ink lg:block"
    >
      <button
        type="button"
        onClick={() => store.set(KEY, true)}
        aria-label="Dismiss"
        className="absolute right-1 top-1 inline-flex size-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
      <svg
        viewBox={`0 0 ${qr.size} ${qr.size}`}
        role="img"
        aria-label="QR code for this page"
        shapeRendering="crispEdges"
        className="size-[104px]"
      >
        <path d={qr.d} fill="currentColor" />
      </svg>
      <p className="mt-3 text-[13px] leading-snug text-ink-muted">
        Built for your phone, at 1 AM. Scan to open it there.
      </p>
    </aside>
  );
}
