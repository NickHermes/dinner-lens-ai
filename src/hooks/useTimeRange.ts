import { useMemo, useState } from "react";

export type TimeRangeType = "week" | "month" | "recent" | "year" | "all" | "custom";

export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
  type: TimeRangeType;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // make Monday start
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfQuarter(date: Date) {
  const quarter = Math.floor(date.getMonth() / 3);
  const d = new Date(date.getFullYear(), quarter * 3, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfYear(date: Date) {
  const d = new Date(date.getFullYear(), 0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useTimeRange(initial: TimeRangeType = "month") {
  const [type, setType] = useState<TimeRangeType>(initial);
  const [custom, setCustom] = useState<{ start: Date; end: Date } | null>(null);

  const now = useMemo(() => new Date(), []);

  const { start, end, label } = useMemo(() => {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    if (type === "custom" && custom) {
      return {
        start: new Date(custom.start),
        end: new Date(custom.end),
        label: `${custom.start.toLocaleDateString()} – ${custom.end.toLocaleDateString()}`,
      };
    }

    if (type === "week") {
      // Look at the most recent week with data (fallback to current week)
      const start = startOfWeek(now);
      return { start, end, label: "This week" };
    }
    if (type === "month") {
      // Look at the most recent month with data (fallback to current month)
      const start = startOfMonth(now);
      return { start, end, label: now.toLocaleString(undefined, { month: "long", year: "numeric" }) };
    }
    if (type === "recent") {
      // Last 30 days - should capture your 2024 data
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { start, end, label: "Last 30 days" };
    }
    if (type === "year") {
      const start = startOfYear(now);
      return { start, end, label: `${now.getFullYear()}` };
    }
    if (type === "all") {
      // All time - go back 10 years
      const start = new Date(now.getFullYear() - 10, 0, 1);
      return { start, end, label: "All Time" };
    }
    const start = startOfMonth(now);
    return { start, end, label: now.toLocaleString(undefined, { month: "long", year: "numeric" }) };
  }, [type, custom, now]);

  return {
    range: { start, end, label, type } as TimeRange,
    setType,
    setCustom,
  };
}


