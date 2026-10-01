import type { Answers, DailyEntry } from "./types";

export const has = (a: Answers, q: string, opt: string) => (a[q] ?? []).includes(opt);
export const one = (a: Answers, q: string) => (a[q] ?? [])[0];

export const isoDay = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const daysAgo = (n: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return isoDay(d);
};

/** Build example entries ending yesterday, oldest first. */
export const exampleSeries = (
  rows: DailyEntry["values"][],
): DailyEntry[] => rows.map((values, i) => ({ date: daysAgo(rows.length - i), values }));

export const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

export const daysBetween = (a: string, b: string) => {
  const da = new Date(a + "T12:00:00");
  const db = new Date(b + "T12:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
};

export const shortDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
