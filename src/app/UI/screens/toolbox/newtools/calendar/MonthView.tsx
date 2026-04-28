import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  THEME,
  DAYS_SHORT,
} from "../../../../../utils/constant/calendar/types";
import {
  buildMonthGrid,
  addMonths,
  formatMonthYear,
} from "../../../../../utils/constant/calendar/calendarutils";
import { useCalendar } from "../../newtools/calendar/Calendarcontext ";
import { DayData } from "../../../../../utils/constant/calendar/types";

const { width: W } = Dimensions.get("window");
const CELL_W = (W - 32) / 7;

export default function MonthView() {
  const { state, filteredEvents, setSelectedDate, setViewMode } = useCalendar();
  const { selectedDate } = state;

  const weeks = useMemo(
    () => buildMonthGrid(selectedDate, filteredEvents),
    [selectedDate, filteredEvents],
  );

  const handleDayPress = (day: DayData) => {
    setSelectedDate(day.date);
    if (day.events.length > 0) {
      // Stay in month view but show day detail below
    }
  };

  const handleDayLongPress = (day: DayData) => {
    setSelectedDate(day.date);
    setViewMode("day");
  };

  return (
    <View style={styles.container}>
      {/* Day headers */}
      <View style={styles.headerRow}>
        {DAYS_SHORT.map((day, i) => (
          <View key={day} style={styles.headerCell}>
            <Text
              style={[
                styles.headerText,
                (i === 0 || i === 6) && styles.headerWeekend,
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day) => (
            <DayCell
              key={day.date}
              day={day}
              isSelected={day.date === selectedDate}
              onPress={() => handleDayPress(day)}
              onLongPress={() => handleDayLongPress(day)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const DayCell = ({
  day,
  isSelected,
  onPress,
  onLongPress,
}: {
  day: DayData;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) => {
  const maxDots = 3;
  const visibleEvents = day.events.slice(0, maxDots);

  return (
    <TouchableOpacity
      style={[
        styles.dayCell,
        !day.isCurrentMonth && styles.dayCellOtherMonth,
        isSelected && styles.dayCellSelected,
        day.isToday && !isSelected && styles.dayCellToday,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.dayNumber,
          !day.isCurrentMonth && styles.dayNumberOther,
          isSelected && styles.dayNumberSelected,
          day.isToday && !isSelected && styles.dayNumberToday,
          day.isWeekend &&
            day.isCurrentMonth &&
            !isSelected &&
            styles.dayNumberWeekend,
        ]}
      >
        {day.dayNumber}
      </Text>

      {/* Event dots */}
      {day.events.length > 0 && (
        <View style={styles.dotRow}>
          {visibleEvents.map((evt, i) => (
            <View
              key={evt.id + i}
              style={[styles.dot, { backgroundColor: evt.color }]}
            />
          ))}
          {day.events.length > maxDots && (
            <Text style={styles.moreDots}>+{day.events.length - maxDots}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  headerCell: {
    width: CELL_W,
    alignItems: "center",
    paddingVertical: 8,
  },
  headerText: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.textSub,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  headerWeekend: {
    color: THEME.gold,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dayCell: {
    width: CELL_W,
    height: CELL_W,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    position: "relative",
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayCellSelected: {
    backgroundColor: THEME.gold,
    borderRadius: 10,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: THEME.gold,
    borderRadius: 10,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "500",
    color: THEME.text,
  },
  dayNumberOther: {
    color: THEME.textDim,
  },
  dayNumberSelected: {
    color: "#000",
    fontWeight: "700",
  },
  dayNumberToday: {
    color: THEME.gold,
    fontWeight: "700",
  },
  dayNumberWeekend: {
    color: THEME.textSub,
  },
  dotRow: {
    flexDirection: "row",
    position: "absolute",
    bottom: 4,
    alignItems: "center",
    gap: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  moreDots: {
    fontSize: 8,
    color: THEME.textSub,
    marginLeft: 1,
  },
});
