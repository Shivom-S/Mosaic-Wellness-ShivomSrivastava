import { isoDay } from "@/content/util";
import type { DailyEntry, Worry } from "@/content";

export const todayISO = () => isoDay(new Date());

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
