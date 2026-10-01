import { isoDay } from "@/content/util";
import { totalCount } from "@/content/hair";
import type { DailyEntry, Worry } from "@/content";
import { loadLast } from "./storage";

export const todayISO = () => isoDay(new Date());

/** Tonight's hair-check total (and wash-day answer), if the person already did the check today. */
export function hairPrefill(): DailyEntry["values"] | null {
  const last = loadLast("hair");
  if (!last?.count || isoDay(new Date(last.at)) !== todayISO()) return null;
  const count = totalCount(last.count);
  if (!Number.isFinite(count)) return null;
  const values: DailyEntry["values"] = { count: Math.min(600, Math.max(0, count)) };
  const wash = last.answers.wash?.[0];
  if (wash) values.wash = wash === "yes";
  return values;
}

export interface TrackStatus {
  /** Entries logged so far. */
  logged: number;
  /** Planned length (days/nights) for daily trackers; 0 for the dates tracker. */
  total: number;
  loggedToday: boolean;
  /** "Day 6 of 14" style position (today's slot, capped at total). */
  day: number;
}

export function trackStatus(worry: Worry, entries: DailyEntry[]): TrackStatus {
  const t = worry.tracker;
  const today = todayISO();
  const loggedToday = entries.some((e) => e.date === today);
  if (t.kind === "dates") return { logged: entries.length, total: 0, loggedToday, day: entries.length };
  const day = Math.min(t.days, entries.length + (loggedToday ? 0 : 1));
  return { logged: entries.length, total: t.days, loggedToday, day };
}
