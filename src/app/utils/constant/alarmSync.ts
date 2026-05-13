import AsyncStorage from "@react-native-async-storage/async-storage";
import { CalendarEvent } from "../../utils/constant/calendar/types";
import { todayStr } from "../constant/calendar/calendarutils";

export const ALARM_STORAGE_KEY = "alarm_entries";
export const CALENDAR_STORAGE_KEY = "calendar_events";

export interface AlarmEntry {
  id: string;
  time: string; // "HH:MM"
  label: string;
  active: boolean;
  days: number[]; // 0=Sun…6=Sat, empty = once
  snoozeMinutes: number;
  source: "alarm" | "calendar"; // ← new: track origin
}

const DAYS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// ─── Alarm → Calendar event

export function alarmToEvents(alarm: AlarmEntry): CalendarEvent[] {
  if (alarm.source === "calendar") return []; // calendar events don't re-derive
  const targetDays = alarm.days.length > 0 ? alarm.days : [new Date().getDay()];

  return targetDays.map((dow) => {
    const today = new Date();
    const diff = (dow - today.getDay() + 7) % 7;
    const target = new Date(today);
    target.setDate(today.getDate() + diff);
    const dateStr = target.toISOString().split("T")[0];

    return {
      id: `alarm_${alarm.id}_day${dow}`,
      title: alarm.label || "Alarm",
      date: dateStr,
      startTime: alarm.time,
      endTime: undefined,
      isAllDay: false,
      category: "health" as const,
      color: "#F59E0B",
      description:
        alarm.days.length === 0
          ? "One-time alarm"
          : `Repeats every ${alarm.days.map((d) => DAYS_FULL[d]).join(", ")}`,
      location: undefined,
      reminder: undefined,
      recurrence:
        alarm.days.length === 7
          ? "daily"
          : alarm.days.length === 0
            ? "none"
            : "weekly",
      isCompleted: false,
      createdAt: todayStr(),
    };
  });
}

// ─── Calendar event → AlarmEntry

export function calendarEventToAlarm(event: CalendarEvent): AlarmEntry | null {
  // Only timed events (not all-day, must have startTime)
  if (event.isAllDay || !event.startTime) return null;
  // Don't re-convert alarm-derived events
  if (event.id.startsWith("alarm_")) return null;

  // Determine which day-of-week this event falls on
  const eventDate = new Date(event.date);
  const dow = eventDate.getDay();

  return {
    id: `cal_${event.id}`,
    time: event.startTime,
    label: event.title,
    active: !event.isCompleted,
    days: [dow], // fires on that weekday
    snoozeMinutes: 5, // sensible default
    source: "calendar",
  };
}

// ─── Save alarms + sync derived events into calendar storage

export async function saveAlarmsAndSync(alarms: AlarmEntry[]): Promise<void> {
  try {
    // 1. Only persist real alarm entries (not calendar-derived ones)
    const pureAlarms = alarms.filter((a) => a.source === "alarm");
    await AsyncStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(pureAlarms));

    // 2. Load current calendar events
    const raw = await AsyncStorage.getItem(CALENDAR_STORAGE_KEY);
    const allEvents: CalendarEvent[] = raw ? JSON.parse(raw) : [];

    // 3. Keep manual calendar events, remove stale alarm-derived ones
    const manualEvents = allEvents.filter((e) => !e.id.startsWith("alarm_"));

    // 4. Convert active pure alarms → calendar events
    const alarmEvents = pureAlarms
      .filter((a) => a.active)
      .map(alarmToEvents)
      .reduce((acc, events) => acc.concat(events), [] as CalendarEvent[]);

    // 5. Write merged result back
    await AsyncStorage.setItem(
      CALENDAR_STORAGE_KEY,
      JSON.stringify([...manualEvents, ...alarmEvents]),
    );
  } catch (err) {
    console.error("Failed to sync alarms to calendar:", err);
  }
}

// ─── Load alarms + inject timed calendar events as alarm entries

export async function loadAlarmsAndCalendarEvents(): Promise<AlarmEntry[]> {
  try {
    // 1. Load raw alarms
    const alarmRaw = await AsyncStorage.getItem(ALARM_STORAGE_KEY);
    const pureAlarms: AlarmEntry[] = alarmRaw
      ? JSON.parse(alarmRaw).map((a: AlarmEntry) => ({
          ...a,
          source: "alarm" as const,
        }))
      : [];

    // 2. Load calendar events and convert timed ones to AlarmEntry
    const calRaw = await AsyncStorage.getItem(CALENDAR_STORAGE_KEY);
    const calEvents: CalendarEvent[] = calRaw ? JSON.parse(calRaw) : [];
    const calAlarms: AlarmEntry[] = calEvents
      .map(calendarEventToAlarm)
      .filter((a): a is AlarmEntry => a !== null);

    // 3. Merge — pure alarms first, then calendar-derived
    // Deduplicate by time+label in case of overlap
    const seen = new Set(pureAlarms.map((a) => `${a.time}_${a.label}`));
    const uniqueCalAlarms = calAlarms.filter(
      (a) => !seen.has(`${a.time}_${a.label}`),
    );

    return [...pureAlarms, ...uniqueCalAlarms].sort((a, b) =>
      a.time.localeCompare(b.time),
    );
  } catch {
    return [];
  }
}

// ─── Legacy loader (still used by CalendarContext)

export async function loadAlarms(): Promise<AlarmEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(ALARM_STORAGE_KEY);
    return raw
      ? JSON.parse(raw).map((a: AlarmEntry) => ({
          ...a,
          source: "alarm" as const,
        }))
      : [];
  } catch {
    return [];
  }
}

// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { CalendarEvent } from "../../utils/constant/calendar/types";
// import { todayStr } from "../constant/calendar/calendarutils";

// export const ALARM_STORAGE_KEY = "alarm_entries";
// export const CALENDAR_STORAGE_KEY = "calendar_events";

// export interface AlarmEntry {
//   id: string;
//   time: string;
//   label: string;
//   active: boolean;
//   days: number[];
//   snoozeMinutes: number;
// }

// const DAYS_FULL = [
//   "Sunday",
//   "Monday",
//   "Tuesday",
//   "Wednesday",
//   "Thursday",
//   "Friday",
//   "Saturday",
// ];

// export function alarmToEvents(alarm: AlarmEntry): CalendarEvent[] {
//   const targetDays = alarm.days.length > 0 ? alarm.days : [new Date().getDay()];

//   return targetDays.map((dow) => {
//     const today = new Date();
//     const todayDow = today.getDay();
//     const diff = (dow - todayDow + 7) % 7;
//     const target = new Date(today);
//     target.setDate(today.getDate() + diff);
//     const dateStr = target.toISOString().split("T")[0];

//     return {
//       id: `alarm_${alarm.id}_day${dow}`,
//       title: alarm.label || "Alarm",
//       date: dateStr,
//       startTime: alarm.time,
//       endTime: undefined,
//       isAllDay: false,
//       category: "health" as const,
//       color: "#F59E0B",
//       description:
//         alarm.days.length === 0
//           ? "One-time alarm"
//           : `Repeats every ${alarm.days.map((d) => DAYS_FULL[d]).join(", ")}`,
//       location: undefined,
//       reminder: undefined,
//       recurrence:
//         alarm.days.length === 7
//           ? "daily"
//           : alarm.days.length === 0
//             ? "none"
//             : "weekly",
//       isCompleted: false,
//       createdAt: todayStr(),
//     };
//   });
// }

// export async function saveAlarmsAndSync(alarms: AlarmEntry[]): Promise<void> {
//   try {
//     await AsyncStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(alarms));

//     const raw = await AsyncStorage.getItem(CALENDAR_STORAGE_KEY);
//     const allEvents: CalendarEvent[] = raw ? JSON.parse(raw) : [];
//     const manualEvents = allEvents.filter((e) => !e.id.startsWith("alarm_"));

//     const alarmEvents = alarms
//       .filter((a) => a.active)
//       .reduce<
//         CalendarEvent[]
//       >((acc, alarm) => [...acc, ...alarmToEvents(alarm)], []);

//     await AsyncStorage.setItem(
//       CALENDAR_STORAGE_KEY,
//       JSON.stringify([...manualEvents, ...alarmEvents]),
//     );
//   } catch (err) {
//     console.error("Failed to sync alarms to calendar:", err);
//   }
// }

// export async function loadAlarms(): Promise<AlarmEntry[]> {
//   try {
//     const raw = await AsyncStorage.getItem(ALARM_STORAGE_KEY);
//     return raw ? JSON.parse(raw) : [];
//   } catch {
//     return [];
//   }
// }
