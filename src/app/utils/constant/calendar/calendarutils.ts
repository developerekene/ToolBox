import { CalendarEvent, DayData } from "./types";

// ─── Date Utilities

export const toDateStr = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const fromDateStr = (str: string): Date => {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const todayStr = (): string => toDateStr(new Date());

export const sameDay = (a: string, b: string) => a === b;

export const addDays = (dateStr: string, n: number): string => {
  const d = fromDateStr(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
};

export const addMonths = (dateStr: string, n: number): string => {
  const d = fromDateStr(dateStr);
  d.setMonth(d.getMonth() + n);
  return toDateStr(d);
};

export const startOfMonth = (dateStr: string): string => {
  const d = fromDateStr(dateStr);
  return toDateStr(new Date(d.getFullYear(), d.getMonth(), 1));
};

export const endOfMonth = (dateStr: string): string => {
  const d = fromDateStr(dateStr);
  return toDateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0));
};

export const daysInMonth = (dateStr: string): number => {
  const d = fromDateStr(dateStr);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
};

export const dayOfWeek = (dateStr: string): number => {
  return fromDateStr(dateStr).getDay();
};

export const isWeekend = (dateStr: string): boolean => {
  const d = dayOfWeek(dateStr);
  return d === 0 || d === 6;
};

export const isSameMonth = (a: string, b: string): boolean => {
  return a.substring(0, 7) === b.substring(0, 7);
};

export const formatTime = (time: string): string => {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
};

export const formatDateDisplay = (dateStr: string): string => {
  const d = fromDateStr(dateStr);
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
};

export const formatMonthYear = (dateStr: string): string => {
  const d = fromDateStr(dateStr);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const getWeekDates = (dateStr: string): string[] => {
  const d = fromDateStr(dateStr);
  const dow = d.getDay();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    return toDateStr(day);
  });
};

export const getHourSlots = (): string[] =>
  Array.from({ length: 24 }, (_, i) => {
    const h = i;
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:00 ${period}`;
  });

// ─── Month Grid Builder

export const buildMonthGrid = (
  dateStr: string,
  events: CalendarEvent[],
): DayData[][] => {
  const today = todayStr();
  const firstDay = startOfMonth(dateStr);
  const startDow = dayOfWeek(firstDay);
  const totalDays = daysInMonth(dateStr);

  const d = fromDateStr(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth();

  // Build flat list of cells (prev month tail + current + next month head)
  const cells: DayData[] = [];

  // Prev month padding
  for (let i = startDow - 1; i >= 0; i--) {
    const cellDate = new Date(year, month, -i);
    const ds = toDateStr(cellDate);
    cells.push({
      date: ds,
      dayNumber: cellDate.getDate(),
      month: cellDate.getMonth(),
      year: cellDate.getFullYear(),
      isToday: sameDay(ds, today),
      isCurrentMonth: false,
      isWeekend: isWeekend(ds),
      events: getEventsForDate(ds, events),
    });
  }

  // Current month
  for (let day = 1; day <= totalDays; day++) {
    const cellDate = new Date(year, month, day);
    const ds = toDateStr(cellDate);
    cells.push({
      date: ds,
      dayNumber: day,
      month,
      year,
      isToday: sameDay(ds, today),
      isCurrentMonth: true,
      isWeekend: isWeekend(ds),
      events: getEventsForDate(ds, events),
    });
  }

  // Next month padding to complete last row
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let i = 1; i <= 7 - remainder; i++) {
      const cellDate = new Date(year, month + 1, i);
      const ds = toDateStr(cellDate);
      cells.push({
        date: ds,
        dayNumber: cellDate.getDate(),
        month: cellDate.getMonth(),
        year: cellDate.getFullYear(),
        isToday: sameDay(ds, today),
        isCurrentMonth: false,
        isWeekend: isWeekend(ds),
        events: getEventsForDate(ds, events),
      });
    }
  }

  // Chunk into weeks
  const weeks: DayData[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
};

// ─── Event Helpers

export const getEventsForDate = (
  dateStr: string,
  events: CalendarEvent[],
): CalendarEvent[] => {
  return events
    .filter((e) => {
      if (e.date === dateStr) return true;
      // Check recurrence
      if (e.recurrence === "daily") return true;
      if (e.recurrence === "weekly") {
        return dayOfWeek(e.date) === dayOfWeek(dateStr) && dateStr >= e.date;
      }
      if (e.recurrence === "monthly") {
        const orig = fromDateStr(e.date);
        const target = fromDateStr(dateStr);
        return orig.getDate() === target.getDate() && dateStr >= e.date;
      }
      if (e.recurrence === "yearly") {
        const orig = e.date.substring(5); // MM-DD
        const target = dateStr.substring(5);
        return orig === target && dateStr >= e.date;
      }
      return false;
    })
    .sort((a, b) => {
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;
      return (a.startTime || "").localeCompare(b.startTime || "");
    });
};

export const generateId = (): string =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);

export const getUpcomingEvents = (
  events: CalendarEvent[],
  days = 7,
): CalendarEvent[] => {
  const today = todayStr();
  const future = addDays(today, days);
  return events
    .filter((e) => e.date >= today && e.date <= future)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.startTime || "").localeCompare(b.startTime || "");
    });
};

export const relativeDayLabel = (dateStr: string): string => {
  const today = todayStr();
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  if (dateStr === yesterday) return "Yesterday";
  return formatDateDisplay(dateStr);
};
