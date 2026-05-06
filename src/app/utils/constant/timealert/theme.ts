export const T = {
  bg: "#060912",
  bgCard: "#0D1120",
  bgElevated: "#131828",
  bgInput: "#0A0E1A",
  border: "#1C2240",
  borderBright: "#2A3060",

  // Mode accents
  amber: "#FFB520",
  amberDim: "#7A5500",
  amberGlow: "#FFB52044",

  cyan: "#00C8F0",
  cyanDim: "#005F75",
  cyanGlow: "#00C8F044",

  emerald: "#00E676",
  emeraldDim: "#006633",
  emeraldGlow: "#00E67644",

  red: "#FF3355",
  redGlow: "#FF335544",

  text: "#E8ECFF",
  textSub: "#6070A0",
  textDim: "#303860",

  white: "#FFFFFF",
};

export type Mode = "alarm" | "stopwatch" | "timer";

export const MODE_COLOR: Record<Mode, string> = {
  alarm: T.amber,
  stopwatch: T.cyan,
  timer: T.emerald,
};

// ─── Time Helpers
export const pad = (n: number, len = 2) =>
  String(Math.floor(Math.abs(n))).padStart(len, "0");

export const msToHMSCs = (ms: number) => {
  const totalMs = Math.max(ms, 0);
  const totalSec = Math.floor(totalMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const cs = Math.floor((totalMs % 1000) / 10);
  return { h, m, s, cs };
};

export const msToDuration = (ms: number): string => {
  const { h, m, s } = msToHMSCs(ms);
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
};

export const msToStopwatch = (ms: number): string => {
  const { h, m, s, cs } = msToHMSCs(ms);
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}`;
  return `${pad(m)}:${pad(s)}.${pad(cs)}`;
};

export const getCurrentHHMM = (): string => {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

export const generateId = (): string =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

// ─── Shared Types
export const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
export const DAYS_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface LapEntry {
  id: number;
  totalMs: number;
  splitMs: number;
}
