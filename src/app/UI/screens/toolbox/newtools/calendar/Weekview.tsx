import React, { useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  THEME,
  DAYS_SHORT,
} from "../../../../../utils/constant/calendar/types";
import {
  getWeekDates,
  getEventsForDate,
  todayStr,
  formatTime,
} from "../../../../../utils/constant/calendar/calendarutils";
import { useCalendar } from "../../newtools/calendar/CalendarContext";

const { width: W } = Dimensions.get("window");
const TIME_COL_W = 48;
const DAY_COL_W = (W - TIME_COL_W - 32) / 7;
const HOUR_HEIGHT = 60;
const TOTAL_HEIGHT = HOUR_HEIGHT * 24;

export default function WeekView() {
  const { state, filteredEvents, setSelectedDate } = useCalendar();
  const { selectedDate } = state;
  const scrollRef = useRef<ScrollView>(null);
  const today = todayStr();

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  // Scroll to 8am on mount
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: HOUR_HEIGHT * 7, animated: true });
    }, 300);
  }, []);

  const now = new Date();
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const nowY = (currentMinute / 60) * HOUR_HEIGHT;

  return (
    <View style={styles.container}>
      {/* Day headers */}
      <View style={styles.headerRow}>
        <View style={{ width: TIME_COL_W }} />
        {weekDates.map((date, i) => {
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const d = new Date(date + "T00:00:00");
          return (
            <TouchableOpacity
              key={date}
              style={styles.dayHeader}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {DAYS_SHORT[d.getDay()]}
              </Text>
              <View
                style={[
                  styles.dateCircle,
                  isToday && styles.dateCircleToday,
                  isSelected && !isToday && styles.dateCircleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dateNum,
                    (isToday || isSelected) && styles.dateNumActive,
                  ]}
                >
                  {d.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Scrollable time grid */}
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {/* Time labels */}
          <View style={styles.timeColumn}>
            {Array.from({ length: 24 }, (_, i) => (
              <View key={i} style={styles.hourLabel}>
                <Text style={styles.hourText}>
                  {i === 0
                    ? ""
                    : i < 12
                      ? `${i}AM`
                      : i === 12
                        ? "12PM"
                        : `${i - 12}PM`}
                </Text>
              </View>
            ))}
          </View>

          {/* Day columns */}
          {weekDates.map((date, di) => {
            const dayEvents = getEventsForDate(date, filteredEvents).filter(
              (e) => !e.isAllDay && e.startTime,
            );
            const isToday = date === today;

            return (
              <View key={date} style={styles.dayColumn}>
                {/* Hour lines */}
                {Array.from({ length: 24 }, (_, i) => (
                  <View key={i} style={styles.hourLine} />
                ))}

                {/* Current time indicator */}
                {isToday && (
                  <View style={[styles.nowLine, { top: nowY }]}>
                    <View style={styles.nowDot} />
                    <View style={styles.nowLineBar} />
                  </View>
                )}

                {/* Events */}
                {dayEvents.map((evt) => {
                  const [sh, sm] = evt.startTime!.split(":").map(Number);
                  const startMins = sh * 60 + sm;
                  const [eh, em] = (
                    evt.endTime ||
                    `${sh + 1}:${sm < 10 ? "0" + sm : String(sm)}`
                  )
                    .split(":")
                    .map(Number);
                  const endMins = eh * 60 + em;
                  const duration = Math.max(endMins - startMins, 30);
                  const top = (startMins / 60) * HOUR_HEIGHT;
                  const height = Math.max((duration / 60) * HOUR_HEIGHT, 20);

                  return (
                    <TouchableOpacity
                      key={evt.id}
                      style={[
                        styles.event,
                        {
                          top,
                          height,
                          backgroundColor: evt.color + "33",
                          borderLeftColor: evt.color,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.eventTitle, { color: evt.color }]}
                        numberOfLines={2}
                      >
                        {evt.title}
                      </Text>
                      {height > 32 && (
                        <Text
                          style={[
                            styles.eventTime,
                            { color: evt.color + "BB" },
                          ]}
                        >
                          {formatTime(evt.startTime!)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    marginBottom: 4,
  },
  dayHeader: {
    width: DAY_COL_W,
    alignItems: "center",
    gap: 4,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: THEME.textSub,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  dayLabelToday: { color: THEME.gold },
  dateCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  dateCircleToday: { backgroundColor: THEME.gold },
  dateCircleSelected: {
    backgroundColor: THEME.bgElevated,
    borderWidth: 1.5,
    borderColor: THEME.gold,
  },
  dateNum: { fontSize: 13, fontWeight: "600", color: THEME.text },
  dateNumActive: { color: "#000", fontWeight: "700" },

  grid: { flexDirection: "row", height: TOTAL_HEIGHT },
  timeColumn: { width: TIME_COL_W },
  hourLabel: {
    height: HOUR_HEIGHT,
    justifyContent: "flex-start",
    paddingTop: 2,
    paddingRight: 8,
    alignItems: "flex-end",
  },
  hourText: { fontSize: 10, color: THEME.textDim, fontWeight: "500" },

  dayColumn: {
    width: DAY_COL_W,
    height: TOTAL_HEIGHT,
    borderLeftWidth: 1,
    borderLeftColor: THEME.border + "66",
    position: "relative",
  },
  hourLine: {
    height: HOUR_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.border + "44",
  },

  nowLine: {
    position: "absolute",
    left: -1,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.danger,
    marginLeft: -4,
  },
  nowLineBar: {
    flex: 1,
    height: 1.5,
    backgroundColor: THEME.danger,
  },

  event: {
    position: "absolute",
    left: 2,
    right: 2,
    borderLeftWidth: 3,
    borderRadius: 4,
    padding: 4,
    overflow: "hidden",
    zIndex: 5,
  },
  eventTitle: { fontSize: 10, fontWeight: "700", lineHeight: 13 },
  eventTime: { fontSize: 9, marginTop: 2 },
});
