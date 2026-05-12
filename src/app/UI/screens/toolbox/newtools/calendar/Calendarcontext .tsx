import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

// ─── Seed Data
const today = todayStr();
const [y, m, d] = today.split("-").map(Number);
const fmt = (dy: number, mo = 0) => toDateStr(new Date(y, m - 1 + mo, d + dy));
const SEED_EVENTS: CalendarEvent[] = [];

// ─── Persistence
const STORAGE_KEY = "calendar_events";

async function loadEvents(): Promise<CalendarEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CalendarEvent[]) : SEED_EVENTS;
  } catch {
    return SEED_EVENTS;
  }
}

async function saveEvents(events: CalendarEvent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    console.error("Failed to save events to AsyncStorage:", err);
  }
}

// ─── State & Actions
interface CalendarState {
  events: CalendarEvent[];
  selectedDate: string;
  viewMode: ViewMode;
  activeCategories: EventCategory[];
  searchQuery: string;
}

type Action =
  | { type: "SET_ALL_EVENTS"; events: CalendarEvent[] }
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

function reducer(state: CalendarState, action: Action): CalendarState {
  switch (action.type) {
    case "SET_ALL_EVENTS":
      return { ...state, events: action.events };
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
  const [state, dispatch] = useReducer(reducer, {
    events: [],
    selectedDate: todayStr(),
    viewMode: "month" as ViewMode,
    activeCategories: ALL_CATEGORIES,
    searchQuery: "",
  });

  const [hydrated, setHydrated] = useState(false);

  // ─── Load persisted events on mount
  useEffect(() => {
    loadEvents().then((events) => {
      dispatch({ type: "SET_ALL_EVENTS", events });
      setHydrated(true);
    });
  }, []);

  // ─── Persist events on every change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    saveEvents(state.events);
  }, [state.events, hydrated]);

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

  if (!hydrated) return null; // prevents flash of empty state

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

// import React, {
//   createContext,
//   useContext,
//   useReducer,
//   useCallback,
//   ReactNode,
// } from "react";
// import {
//   CalendarEvent,
//   EventCategory,
//   ViewMode,
// } from "../../../../../utils/constant/calendar/types";
// import {
//   todayStr,
//   generateId,
//   toDateStr,
// } from "../../../../../utils/constant/calendar/calendarutils";
// import { THEME } from "../../../../../utils/constant/calendar/types";

// // ─── Sample Seed Data

// const today = todayStr();
// const [y, m, d] = today.split("-").map(Number);
// const fmt = (dy: number, mo = 0) => toDateStr(new Date(y, m - 1 + mo, d + dy));

// const SEED_EVENTS: CalendarEvent[] = [];

// // ─── State & Actions

// interface CalendarState {
//   events: CalendarEvent[];
//   selectedDate: string;
//   viewMode: ViewMode;
//   activeCategories: EventCategory[];
//   searchQuery: string;
// }

// type Action =
//   | { type: "ADD_EVENT"; event: CalendarEvent }
//   | { type: "UPDATE_EVENT"; event: CalendarEvent }
//   | { type: "DELETE_EVENT"; id: string }
//   | { type: "SET_DATE"; date: string }
//   | { type: "SET_VIEW"; mode: ViewMode }
//   | { type: "TOGGLE_CATEGORY"; category: EventCategory }
//   | { type: "SET_ALL_CATEGORIES"; categories: EventCategory[] }
//   | { type: "SET_SEARCH"; query: string }
//   | { type: "TOGGLE_COMPLETE"; id: string };

// const ALL_CATEGORIES: EventCategory[] = [
//   "work",
//   "personal",
//   "health",
//   "social",
//   "travel",
//   "finance",
//   "education",
// ];

// const initialState: CalendarState = {
//   events: SEED_EVENTS,
//   selectedDate: todayStr(),
//   viewMode: "month",
//   activeCategories: ALL_CATEGORIES,
//   searchQuery: "",
// };

// function reducer(state: CalendarState, action: Action): CalendarState {
//   switch (action.type) {
//     case "ADD_EVENT":
//       return { ...state, events: [...state.events, action.event] };
//     case "UPDATE_EVENT":
//       return {
//         ...state,
//         events: state.events.map((e) =>
//           e.id === action.event.id ? action.event : e,
//         ),
//       };
//     case "DELETE_EVENT":
//       return {
//         ...state,
//         events: state.events.filter((e) => e.id !== action.id),
//       };
//     case "SET_DATE":
//       return { ...state, selectedDate: action.date };
//     case "SET_VIEW":
//       return { ...state, viewMode: action.mode };
//     case "TOGGLE_CATEGORY": {
//       const has = state.activeCategories.includes(action.category);
//       return {
//         ...state,
//         activeCategories: has
//           ? state.activeCategories.filter((c) => c !== action.category)
//           : [...state.activeCategories, action.category],
//       };
//     }
//     case "SET_ALL_CATEGORIES":
//       return { ...state, activeCategories: action.categories };
//     case "SET_SEARCH":
//       return { ...state, searchQuery: action.query };
//     case "TOGGLE_COMPLETE":
//       return {
//         ...state,
//         events: state.events.map((e) =>
//           e.id === action.id ? { ...e, isCompleted: !e.isCompleted } : e,
//         ),
//       };
//     default:
//       return state;
//   }
// }

// // ─── Context

// interface CalendarContextValue {
//   state: CalendarState;
//   addEvent: (event: Omit<CalendarEvent, "id" | "createdAt">) => void;
//   updateEvent: (event: CalendarEvent) => void;
//   deleteEvent: (id: string) => void;
//   setSelectedDate: (date: string) => void;
//   setViewMode: (mode: ViewMode) => void;
//   toggleCategory: (cat: EventCategory) => void;
//   setAllCategories: (cats: EventCategory[]) => void;
//   setSearch: (q: string) => void;
//   toggleComplete: (id: string) => void;
//   filteredEvents: CalendarEvent[];
// }

// const CalendarContext = createContext<CalendarContextValue | null>(null);

// export const CalendarProvider = ({ children }: { children: ReactNode }) => {
//   const [state, dispatch] = useReducer(reducer, initialState);

//   const addEvent = useCallback(
//     (event: Omit<CalendarEvent, "id" | "createdAt">) => {
//       dispatch({
//         type: "ADD_EVENT",
//         event: { ...event, id: generateId(), createdAt: todayStr() },
//       });
//     },
//     [],
//   );

//   const updateEvent = useCallback((event: CalendarEvent) => {
//     dispatch({ type: "UPDATE_EVENT", event });
//   }, []);

//   const deleteEvent = useCallback((id: string) => {
//     dispatch({ type: "DELETE_EVENT", id });
//   }, []);

//   const setSelectedDate = useCallback((date: string) => {
//     dispatch({ type: "SET_DATE", date });
//   }, []);

//   const setViewMode = useCallback((mode: ViewMode) => {
//     dispatch({ type: "SET_VIEW", mode });
//   }, []);

//   const toggleCategory = useCallback((category: EventCategory) => {
//     dispatch({ type: "TOGGLE_CATEGORY", category });
//   }, []);

//   const setAllCategories = useCallback((categories: EventCategory[]) => {
//     dispatch({ type: "SET_ALL_CATEGORIES", categories });
//   }, []);

//   const setSearch = useCallback((query: string) => {
//     dispatch({ type: "SET_SEARCH", query });
//   }, []);

//   const toggleComplete = useCallback((id: string) => {
//     dispatch({ type: "TOGGLE_COMPLETE", id });
//   }, []);

//   // Filter events by active categories and search
//   const filteredEvents = state.events.filter((e) => {
//     if (!state.activeCategories.includes(e.category)) return false;
//     if (state.searchQuery) {
//       const q = state.searchQuery.toLowerCase();
//       return (
//         e.title.toLowerCase().includes(q) ||
//         e.description?.toLowerCase().includes(q) ||
//         e.location?.toLowerCase().includes(q)
//       );
//     }
//     return true;
//   });

//   return (
//     <CalendarContext.Provider
//       value={{
//         state,
//         addEvent,
//         updateEvent,
//         deleteEvent,
//         setSelectedDate,
//         setViewMode,
//         toggleCategory,
//         setAllCategories,
//         setSearch,
//         toggleComplete,
//         filteredEvents,
//       }}
//     >
//       {children}
//     </CalendarContext.Provider>
//   );
// };

// export const useCalendar = () => {
//   const ctx = useContext(CalendarContext);
//   if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
//   return ctx;
// };
