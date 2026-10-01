import { useEffect, useState } from "react";

export interface Greeting {
  time: string; // "1:07"
  meridiem: "AM" | "PM";
  line: string;
}

export function greeting(now: Date): Greeting {
  const h = now.getHours();
  const m = now.getMinutes();
  const time = `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")}`;
  const meridiem = h < 12 ? "AM" : "PM";

  let line: string;
  if (h < 5) line = "And you're googling it again.";
  else if (h < 12) line = "Worries don't keep office hours.";
  else if (h < 18) line = "Some questions are easier to ask a screen.";
  else line = "The 1 AM thoughts are warming up.";

  return { time, meridiem, line };
}

/** "just now", "5 minutes ago", "2 days ago": for the history list. */
export function relativeTime(at: number, now = Date.now()) {
  const mins = Math.max(0, Math.round((now - at) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return mins === 1 ? "1 minute ago" : mins + " minutes ago";
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : hours + " hours ago";
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 60) return days + " days ago";
  return new Date(at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** A Date that re-renders the caller roughly on the minute. */
export function useNow(everyMs = 15_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), everyMs);
    return () => window.clearInterval(id);
  }, [everyMs]);
  return now;
}
