import { VERDICT_COPY, type Verdict, type Worry } from "@/content";
import { rng } from "./rng";

// The share card is the one place in the app where raw hex is allowed: it's painted on a
// canvas, outside the theme tokens, and always uses the night palette.
const C = {
  bg: "#0B0F1A",
  ink: "#F3EDE2",
  muted: "#A6ADBE",
  lamp: "#F5B971",
  normal: "#8FD3A8",
  watch: "#F5C26B",
  doctor: "#F28B7A",
};

const TONE: Record<Verdict, { color: string; line: string }> = {
  normal: { color: C.normal, line: "Turned out to be fine." },
  watch: { color: C.watch, line: "Nothing scary. Worth keeping an eye on." },
  doctor: { color: C.doctor, line: "Good thing I checked." },
};

// Lucide glyphs (24×24 grid), drawn as strokes inside the verdict pill.
const GLYPH: Record<Verdict, { paths: string[]; circles?: [number, number, number][] }> = {
  normal: { paths: ["M20 6 9 17l-5-5"] },
  watch: {
    paths: [
      "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
    ],
    circles: [[12, 12, 3]],
  },
  doctor: {
    paths: [
      "M11 2v2",
      "M5 2v2",
      "M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1",
      "M8 15a6 6 0 0 0 12 0v-3",
    ],
    circles: [[20, 10, 2]],
  },
};

const W = 1080;
const H = 1350;
const DISPLAY = '"Fraunces Variable", Georgia, serif';
const SANS = '"Figtree Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load('italic 400 112px "Fraunces Variable"', "I checked at 1 AM."),
      document.fonts.load('400 72px "Fraunces Variable"', "Hair in the drain"),
      document.fonts.load('400 52px "Fraunces Variable"', "1AM"),
      document.fonts.load('500 40px "Figtree Variable"', "Honest answers"),
      document.fonts.load('700 60px "Figtree Variable"', "WORTH A DOCTOR VISIT"),
    ]);
    await document.fonts.ready;
  } catch {
    /* fall back to the system serif / sans stacks */
  }
}

function crescent(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d")!;
  x.fillStyle = C.lamp;
  x.beginPath();
  x.arc(size / 2, size / 2, size * 0.46, 0, Math.PI * 2);
  x.fill();
  x.globalCompositeOperation = "destination-out";
  x.beginPath();
  x.arc(size * 0.68, size * 0.36, size * 0.38, 0, Math.PI * 2);
  x.fill();
  return c;
}

/**
 * Paint the share card. It deliberately knows nothing about the person: no counts, no answers.
 * Just the worry's title, the verdict's label and a generic line.
 */
export async function renderCard(worry: Worry, verdict: Verdict): Promise<Blob> {
  await loadFonts();

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const tone = TONE[verdict];
  const pad = 88;

  // night + a soft lamp glow at the top
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, -80, 0, W / 2, -80, 920);
  glow.addColorStop(0, "rgba(245,185,113,0.26)");
  glow.addColorStop(1, "rgba(245,185,113,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // faint stars
  const rand = rng(1);
  for (let i = 0; i < 90; i++) {
    ctx.globalAlpha = 0.12 + rand() * 0.5;
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.arc(rand() * W, rand() * H, 0.8 + rand() * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // wordmark
  ctx.drawImage(crescent(64), pad, 92);
  ctx.fillStyle = C.ink;
  ctx.textBaseline = "alphabetic";
  ctx.font = `400 54px ${DISPLAY}`;
  ctx.fillText("1AM", pad + 84, 144);

  // "I checked at 1 AM."
  ctx.fillStyle = C.ink;
  ctx.font = `italic 400 124px ${DISPLAY}`;
  let y = 380;
  for (const l of wrap(ctx, "I checked at 1 AM.", W - pad * 2)) {
    ctx.fillText(l, pad, y);
    y += 138;
  }

  // worry title
  y += 18;
  ctx.fillStyle = C.lamp;
  ctx.font = `400 74px ${DISPLAY}`;
  for (const l of wrap(ctx, worry.title, W - pad * 2)) {
    ctx.fillText(l, pad, y);
    y += 86;
  }

  // verdict pill: shrink the type until the label fits the card
  const label = VERDICT_COPY[verdict].label.toUpperCase();
  const iconSize = 72;
  const gap = 28;
  const padX = 52;
  let fontPx = 60;
  const spacing = (px: number) => `${Math.round(px * 0.05)}px`;
  const setLabelFont = (px: number) => {
    ctx.font = `700 ${px}px ${SANS}`;
    if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = spacing(px);
  };
  setLabelFont(fontPx);
  while (padX * 2 + iconSize + gap + ctx.measureText(label).width > W - pad * 2 && fontPx > 34) {
    fontPx -= 2;
    setLabelFont(fontPx);
  }
  const pillW = Math.min(W - pad * 2, padX * 2 + iconSize + gap + ctx.measureText(label).width);
  const pillH = 168;
  const pillY = Math.max(y + 56, 820);
  ctx.beginPath();
  ctx.roundRect(pad, pillY, pillW, pillH, pillH / 2);
  ctx.fillStyle = tone.color;
  ctx.globalAlpha = 0.16;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 3;
  ctx.strokeStyle = tone.color;
  ctx.stroke();

  ctx.save();
  ctx.translate(pad + padX, pillY + (pillH - iconSize) / 2);
  ctx.scale(iconSize / 24, iconSize / 24);
  ctx.strokeStyle = tone.color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  GLYPH[verdict].paths.forEach((d) => ctx.stroke(new Path2D(d)));
  GLYPH[verdict].circles?.forEach(([cx, cy, r]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();

  ctx.fillStyle = tone.color;
  ctx.textBaseline = "middle";
  ctx.fillText(label, pad + padX + iconSize + gap, pillY + pillH / 2 + 3);
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";

  // generic line
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = C.muted;
  ctx.font = `500 44px ${SANS}`;
  ctx.fillText(tone.line, pad, pillY + pillH + 84);

  // footer
  ctx.fillStyle = "rgba(243,237,226,0.14)";
  ctx.fillRect(pad, H - 250, W - pad * 2, 2);
  ctx.fillStyle = C.ink;
  ctx.font = `400 40px ${DISPLAY}`;
  let fy = H - 176;
  for (const l of wrap(ctx, "Honest answers to the health worries you'd never say out loud.", W - pad * 2)) {
    ctx.fillText(l, pad, fy);
    fy += 52;
  }
  ctx.fillStyle = C.lamp;
  ctx.font = `600 36px ${SANS}`;
  ctx.fillText(window.location.host || "1am", pad, H - 62);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't draw the card"))), "image/png"),
  );
}

export const shareUrl = () => window.location.origin + window.location.pathname;

export const shareText = (worry: Worry, verdict: Verdict) =>
  `Checked “${worry.whisper}” on 1AM: ${VERDICT_COPY[verdict].label}. Honest answers, cited sources, no sign-up: ${shareUrl()}`;

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export type ShareOutcome = "shared" | "whatsapp" | "copied" | "cancelled" | "failed";

/** Native share sheet with the card attached → WhatsApp link → clipboard. */
export async function shareResult(worry: Worry, verdict: Verdict, card?: Blob | null): Promise<ShareOutcome> {
  const text = shareText(worry, verdict);
  const url = shareUrl();

  try {
    const blob = card ?? (await renderCard(worry, verdict));
    const file = new File([blob], `1am-${worry.id}.png`, { type: "image/png" });
    if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text, url });
      return "shared";
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    // anything else: fall through to the plain-link options
  }

  const wa = window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  if (wa) return "whatsapp";

  return (await copyText(text)) ? "copied" : "failed";
}
