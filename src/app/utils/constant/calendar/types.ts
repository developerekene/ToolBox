// ─── Types ────────────────────────────────────────────────────────────────────

export type EventCategory =
  | "work"
  | "personal"
  | "health"
  | "social"
  | "travel"
  | "finance"
  | "education";

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export type ViewMode = "month" | "week" | "day" | "agenda";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string;
  category: EventCategory;
  color: string;
  isAllDay: boolean;
  recurrence: RecurrenceType;
  reminder?: number; // minutes before
  location?: string;
  isCompleted?: boolean;
  createdAt: string;
}

export interface DayData {
  date: string;
  dayNumber: number;
  month: number;
  year: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  events: CalendarEvent[];
}

// ─── Theme

export const THEME = {
  // Luxurious deep navy + gold accent palette
  bg: "#0A0C14",
  bgCard: "#10131F",
  bgElevated: "#161928",
  bgModal: "#1C2033",
  border: "#252840",
  borderLight: "#2E3255",

  gold: "#C9A84C",
  goldLight: "#E8C96A",
  goldDim: "#8A6E30",

  accent: "#5B6EF5",
  accentSoft: "#3D4DB3",

  text: "#F0EFFF",
  textSub: "#8B8FAE",
  textDim: "#555875",

  success: "#3ECF8E",
  warning: "#F5A623",
  danger: "#FF5C5C",

  // Category colors
  categories: {
    work: "#5B6EF5",
    personal: "#C9A84C",
    health: "#3ECF8E",
    social: "#F56B8A",
    travel: "#56C8D8",
    finance: "#F5A623",
    education: "#B56BF5",
  },
};

export const CATEGORY_ICONS: Record<EventCategory, string> = {
  work: "💼",
  personal: "⭐",
  health: "🏃",
  social: "🎉",
  travel: "✈️",
  finance: "💰",
  education: "📚",
};

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  work: "Work",
  personal: "Personal",
  health: "Health",
  social: "Social",
  travel: "Travel",
  finance: "Finance",
  education: "Education",
};

export const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAYS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const MONTHS = [
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
export const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
