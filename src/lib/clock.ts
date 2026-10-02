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
