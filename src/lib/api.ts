// Optional backend (Replit). If VITE_API_URL isn't set, every call is a quiet no-op
// and the app works exactly as before.
import type { Verdict, WorryId } from "@/content";

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");
export const apiEnabled = Boolean(BASE);

export interface Pulse {
  windowDays: number;
  total: number;
  helpedPct: number | null;
  byWorry: Record<WorryId, number>;
  byVerdict: Record<Verdict, number>;
}

export function sendRating(r: { worry: WorryId; verdict: Verdict; answer: string; tone?: string }) {
  if (!BASE) return;
  try {
    void fetch(`${BASE}/api/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(r),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* offline or blocked: fine */
  }
}

export async function getPulse(): Promise<Pulse | null> {
  if (!BASE) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${BASE}/api/pulse`, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok ? ((await res.json()) as Pulse) : null;
  } catch {
    return null;
  }
}
