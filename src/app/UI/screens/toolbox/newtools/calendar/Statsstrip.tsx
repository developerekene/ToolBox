import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {
  THEME,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  EventCategory,
} from "../../../../../utils/constant/calendar/types";
import { useCalendar } from "../../newtools/calendar/Calendarcontext ";
import {
  getEventsForDate,
  addDays,
  todayStr,
} from "../../../../../utils/constant/calendar/calendarutils";

export default function StatsStrip() {
  const { filteredEvents, state } = useCalendar();

  const monthStr = state.selectedDate.substring(0, 7);

  const stats = useMemo(() => {
    const counts: Partial<Record<EventCategory, number>> = {};
    filteredEvents.forEach((e) => {
      if (e.date.startsWith(monthStr)) {
        counts[e.category] = (counts[e.category] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5) as [EventCategory, number][];
  }, [filteredEvents, monthStr]);

  // Upcoming count: next 7 days
  const upcomingCount = useMemo(() => {
    const today = todayStr();
    let count = 0;
    for (let i = 0; i < 7; i++) {
      count += getEventsForDate(addDays(today, i), filteredEvents).length;
    }
    return count;
  }, [filteredEvents]);

  // Completed count this month
  const completedCount = useMemo(
    () =>
      filteredEvents.filter((e) => e.isCompleted && e.date.startsWith(monthStr))
        .length,
    [filteredEvents, monthStr],
  );

  const totalMonth = useMemo(
    () => filteredEvents.filter((e) => e.date.startsWith(monthStr)).length,
    [filteredEvents, monthStr],
  );

  if (stats.length === 0 && upcomingCount === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {/* Summary chip */}
        <View style={[styles.chip, styles.chipSummary]}>
          <Text style={styles.chipNum}>{totalMonth}</Text>
          <Text style={styles.chipLabel}>this month</Text>
        </View>

        {/* Upcoming */}
        {upcomingCount > 0 && (
          <View style={[styles.chip, { borderColor: THEME.accent + "66" }]}>
            <Text style={[styles.chipNum, { color: THEME.accent }]}>
              {upcomingCount}
            </Text>
            <Text style={styles.chipLabel}>next 7 days</Text>
          </View>
        )}

        {/* Completed */}
        {completedCount > 0 && (
          <View style={[styles.chip, { borderColor: THEME.success + "66" }]}>
            <Text style={[styles.chipNum, { color: THEME.success }]}>
              ✓ {completedCount}
            </Text>
            <Text style={styles.chipLabel}>completed</Text>
          </View>
        )}

        {/* Per-category */}
        {stats.map(([cat, count]) => (
          <View
            key={cat}
            style={[styles.chip, { borderColor: THEME.categories[cat] + "55" }]}
          >
            <Text style={styles.chipIcon}>{CATEGORY_ICONS[cat]}</Text>
            <Text style={[styles.chipNum, { color: THEME.categories[cat] }]}>
              {count}
            </Text>
            <Text style={styles.chipLabel}>{CATEGORY_LABELS[cat]}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.border,
    backgroundColor: THEME.bg,
  },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.bgCard,
  },
  chipSummary: {
    borderColor: THEME.goldDim,
    backgroundColor: THEME.goldDim + "22",
  },
  chipIcon: { fontSize: 13 },
  chipNum: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.gold,
  },
  chipLabel: {
    fontSize: 11,
    color: THEME.textSub,
  },
});
