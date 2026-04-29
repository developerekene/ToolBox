import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";
import {
  CalendarEvent,
  EventCategory,
  ViewMode,
} from "../../../../../utils/constant/calendar/types";
import {
  todayStr,
  generateId,
  toDateStr,
} from "../../../../../utils/constant/calendar/calendarutils";
import { THEME } from "../../../../../utils/constant/calendar/types";

// ─── Sample Seed Data

const today = todayStr();
const [y, m, d] = today.split("-").map(Number);
const fmt = (dy: number, mo = 0) => toDateStr(new Date(y, m - 1 + mo, d + dy));

const SEED_EVENTS: CalendarEvent[] = [
  // {
  //   id: "seed-1",
  //   title: "Team Standup",
  //   description: "Daily sync with engineering team",
  //   date: fmt(0),
  //   startTime: "09:00",
  //   endTime: "09:30",
  //   category: "work",
  //   color: THEME.categories.work,
  //   isAllDay: false,
  //   recurrence: "daily",
  //   reminder: 10,
  //   location: "Zoom",
  //   createdAt: today,
  // },
  // {
  //   id: "seed-2",
  //   title: "Product Review",
  //   description: "Q4 product roadmap review",
  //   date: fmt(1),
  //   startTime: "14:00",
  //   endTime: "15:30",
  //   category: "work",
  //   color: THEME.categories.work,
  //   isAllDay: false,
  //   recurrence: "none",
  //   reminder: 30,
  //   location: "Conference Room A",
  //   createdAt: today,
  // },
  // {
  //   id: "seed-3",
  //   title: "Gym Session",
  //   description: "Upper body + cardio",
  //   date: fmt(0),
  //   startTime: "07:00",
  //   endTime: "08:00",
  //   category: "health",
  //   color: THEME.categories.health,
  //   isAllDay: false,
  //   recurrence: "weekly",
  //   reminder: 15,
  //   createdAt: today,
  // },
  // {
  //   id: "seed-4",
  //   title: "Sarah's Birthday",
  //   date: fmt(3),
  //   category: "social",
  //   color: THEME.categories.social,
  //   isAllDay: true,
  //   recurrence: "yearly",
  //   reminder: 60 * 24,
  //   createdAt: today,
  // },
  // {
  //   id: "seed-5",
  //   title: "Flight to London",
  //   description: "BA flight 234",
  //   date: fmt(7),
  //   startTime: "06:45",
  //   endTime: "10:30",
  //   category: "travel",
  //   color: THEME.categories.travel,
  //   isAllDay: false,
  //   recurrence: "none",
  //   reminder: 120,
  //   location: "Heathrow Terminal 5",
  //   createdAt: today,
  // },
  // {
  //   id: "seed-6",
  //   title: "Mortgage Payment",
  //   date: fmt(5),
  //   category: "finance",
  //   color: THEME.categories.finance,
  //   isAllDay: true,
  //   recurrence: "monthly",
  //   reminder: 60 * 24,
  //   createdAt: today,
  // },
  // {
  //   id: "seed-7",
  //   title: "Python Course",
  //   description: "Advanced Python — Module 6",
  //   date: fmt(2),
  //   startTime: "19:00",
  //   endTime: "21:00",
  //   category: "education",
  //   color: THEME.categories.education,
  //   isAllDay: false,
  //   recurrence: "weekly",
  //   createdAt: today,
  // },
  // {
  //   id: "seed-8",
  //   title: "Doctor Appointment",
  //   description: "Annual checkup with Dr. Okafor",
  //   date: fmt(10),
  //   startTime: "11:00",
  //   endTime: "11:45",
  //   category: "health",
  //   color: THEME.categories.health,
  //   isAllDay: false,
  //   recurrence: "none",
  //   reminder: 60,
  //   location: "Lagos Medical Center",
  //   createdAt: today,
  // },
  // {
  //   id: "seed-9",
  //   title: "Date Night",
  //   date: fmt(-1),
  //   startTime: "19:30",
  //   category: "personal",
  //   color: THEME.categories.personal,
  //   isAllDay: false,
  //   recurrence: "none",
  //   location: "Nok Restaurant",
  //   createdAt: today,
  // },
];

// ─── State & Actions ──────────────────────────────────────────────────────────

interface CalendarState {
  events: CalendarEvent[];
  selectedDate: string;
  viewMode: ViewMode;
  activeCategories: EventCategory[];
  searchQuery: string;
}

type Action =
  | { type: "ADD_EVENT"; event: CalendarEvent }
  | { type: "UPDATE_EVENT"; event: CalendarEvent }
  | { type: "DELETE_EVENT"; id: string }
  | { type: "SET_DATE"; date: string }
  | { type: "SET_VIEW"; mode: ViewMode }
  | { type: "TOGGLE_CATEGORY"; category: EventCategory }
  | { type: "SET_ALL_CATEGORIES"; categories: EventCategory[] }
  | { type: "SET_SEARCH"; query: string }
  | { type: "TOGGLE_COMPLETE"; id: string };

const ALL_CATEGORIES: EventCategory[] = [
  "work",
  "personal",
  "health",
  "social",
  "travel",
  "finance",
  "education",
];

const initialState: CalendarState = {
  events: SEED_EVENTS,
  selectedDate: todayStr(),
  viewMode: "month",
  activeCategories: ALL_CATEGORIES,
  searchQuery: "",
};

function reducer(state: CalendarState, action: Action): CalendarState {
  switch (action.type) {
    case "ADD_EVENT":
      return { ...state, events: [...state.events, action.event] };
    case "UPDATE_EVENT":
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.event.id ? action.event : e,
        ),
      };
    case "DELETE_EVENT":
      return {
        ...state,
        events: state.events.filter((e) => e.id !== action.id),
      };
    case "SET_DATE":
      return { ...state, selectedDate: action.date };
    case "SET_VIEW":
      return { ...state, viewMode: action.mode };
    case "TOGGLE_CATEGORY": {
      const has = state.activeCategories.includes(action.category);
      return {
        ...state,
        activeCategories: has
          ? state.activeCategories.filter((c) => c !== action.category)
          : [...state.activeCategories, action.category],
      };
    }
    case "SET_ALL_CATEGORIES":
      return { ...state, activeCategories: action.categories };
    case "SET_SEARCH":
      return { ...state, searchQuery: action.query };
    case "TOGGLE_COMPLETE":
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.id ? { ...e, isCompleted: !e.isCompleted } : e,
        ),
      };
    default:
      return state;
  }
}

// ─── Context

interface CalendarContextValue {
  state: CalendarState;
  addEvent: (event: Omit<CalendarEvent, "id" | "createdAt">) => void;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (id: string) => void;
  setSelectedDate: (date: string) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleCategory: (cat: EventCategory) => void;
  setAllCategories: (cats: EventCategory[]) => void;
  setSearch: (q: string) => void;
  toggleComplete: (id: string) => void;
  filteredEvents: CalendarEvent[];
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addEvent = useCallback(
    (event: Omit<CalendarEvent, "id" | "createdAt">) => {
      dispatch({
        type: "ADD_EVENT",
        event: { ...event, id: generateId(), createdAt: todayStr() },
      });
    },
    [],
  );

  const updateEvent = useCallback((event: CalendarEvent) => {
    dispatch({ type: "UPDATE_EVENT", event });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    dispatch({ type: "DELETE_EVENT", id });
  }, []);

  const setSelectedDate = useCallback((date: string) => {
    dispatch({ type: "SET_DATE", date });
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    dispatch({ type: "SET_VIEW", mode });
  }, []);

  const toggleCategory = useCallback((category: EventCategory) => {
    dispatch({ type: "TOGGLE_CATEGORY", category });
  }, []);

  const setAllCategories = useCallback((categories: EventCategory[]) => {
    dispatch({ type: "SET_ALL_CATEGORIES", categories });
  }, []);

  const setSearch = useCallback((query: string) => {
    dispatch({ type: "SET_SEARCH", query });
  }, []);

  const toggleComplete = useCallback((id: string) => {
    dispatch({ type: "TOGGLE_COMPLETE", id });
  }, []);

  // Filter events by active categories and search
  const filteredEvents = state.events.filter((e) => {
    if (!state.activeCategories.includes(e.category)) return false;
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <CalendarContext.Provider
      value={{
        state,
        addEvent,
        updateEvent,
        deleteEvent,
        setSelectedDate,
        setViewMode,
        toggleCategory,
        setAllCategories,
        setSearch,
        toggleComplete,
        filteredEvents,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
  return ctx;
};
