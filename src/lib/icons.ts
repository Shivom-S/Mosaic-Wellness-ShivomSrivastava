import { Baby, CalendarDays, Flame, MoonStar, PenLine, ScanFace, Snowflake, Wind, type LucideIcon } from "lucide-react";
import type { WorryId } from "@/content";

/** One icon per worry, drawn the same way everywhere (see IconBadge). */
export const WORRY_ICON: Record<WorryId, LucideIcon> = {
  hair: Wind,
  cycle: CalendarDays,
  sleep: MoonStar,
  toddler: Baby,
  acne: ScanFace,
  dandruff: Snowflake,
  reflux: Flame,
};

export const AI_ICON: LucideIcon = PenLine;
