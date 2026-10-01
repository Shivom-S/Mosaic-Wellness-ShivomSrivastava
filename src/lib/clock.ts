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

/** A Date that re-renders the caller roughly on the minute. */
export function useNow(everyMs = 15_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), everyMs);
    return () => window.clearInterval(id);
  }, [everyMs]);
  return now;
}
