/**
 * CalendarHeader.tsx
 * Top navigation bar: month title, nav arrows, view mode tabs, search & filter.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
} from "react-native";
import {
  THEME,
  ViewMode,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  EventCategory,
} from "../../../../../utils/constant/calendar/types";
import {
  formatMonthYear,
  addMonths,
  getWeekDates,
} from "../../../../../utils/constant/calendar/calendarutils";
import { useCalendar } from "../../newtools/calendar/Calendarcontext ";

const VIEW_TABS: { key: ViewMode; label: string }[] = [
  { key: "month", label: "Month" },
  { key: "week", label: "Week" },
  { key: "day", label: "Day" },
  { key: "agenda", label: "Agenda" },
];

const ALL_CATEGORIES: EventCategory[] = [
  "work",
  "personal",
  "health",
  "social",
  "travel",
  "finance",
  "education",
];

export default function CalendarHeader() {
  const {
    state,
    setSelectedDate,
    setViewMode,
    setSearch,
    toggleCategory,
    setAllCategories,
  } = useCalendar();
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const handlePrev = () => {
    if (state.viewMode === "month") {
      setSelectedDate(addMonths(state.selectedDate, -1));
    } else if (state.viewMode === "week") {
      const week = getWeekDates(state.selectedDate);
      setSelectedDate(week[0].replace(/\d+$/, (d) => String(parseInt(d) - 7)));
    } else {
      const d = new Date(state.selectedDate);
      d.setDate(d.getDate() - 1);
      setSelectedDate(d.toISOString().split("T")[0]);
    }
  };

  const handleNext = () => {
    if (state.viewMode === "month") {
      setSelectedDate(addMonths(state.selectedDate, 1));
    } else if (state.viewMode === "week") {
      const week = getWeekDates(state.selectedDate);
      const last = week[6];
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().split("T")[0]);
    } else {
      const d = new Date(state.selectedDate);
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().split("T")[0]);
    }
  };

  const allActive = state.activeCategories.length === ALL_CATEGORIES.length;

  if (showSearch) {
    return (
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events, locations…"
          placeholderTextColor={THEME.textDim}
          autoFocus
          returnKeyType="search"
          onChangeText={setSearch}
          onSubmitEditing={() => setShowSearch(false)}
        />
        <TouchableOpacity
          onPress={() => {
            setShowSearch(false);
            setSearch("");
          }}
          style={styles.closeBtn}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={handlePrev} style={styles.navBtn}>
            <Text style={styles.navBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {formatMonthYear(state.selectedDate)}
          </Text>
          <TouchableOpacity onPress={handleNext} style={styles.navBtn}>
            <Text style={styles.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() =>
              setSelectedDate(new Date().toISOString().split("T")[0])
            }
          >
            <Text style={styles.iconBtnText}>◎</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowSearch(true)}
          >
            <Text style={styles.iconBtnText}>⌕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, showFilter && styles.iconBtnActive]}
            onPress={() => setShowFilter((v) => !v)}
          >
            <Text
              style={[styles.iconBtnText, showFilter && { color: THEME.gold }]}
            >
              ⊞
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter row */}
      {showFilter && (
        <View style={styles.filterPanel}>
          <View style={styles.filterTop}>
            <Text style={styles.filterTitle}>FILTER BY CATEGORY</Text>
            <TouchableOpacity
              onPress={() =>
                allActive
                  ? setAllCategories([])
                  : setAllCategories(ALL_CATEGORIES)
              }
            >
              <Text style={styles.filterToggleAll}>
                {allActive ? "Deselect all" : "Select all"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filterChips}>
            {ALL_CATEGORIES.map((cat) => {
              const active = state.activeCategories.indexOf(cat) !== -1;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.filterChip,
                    active && {
                      backgroundColor: THEME.categories[cat] + "22",
                      borderColor: THEME.categories[cat],
                    },
                  ]}
                  onPress={() => toggleCategory(cat)}
                >
                  <Text style={styles.filterChipIcon}>
                    {CATEGORY_ICONS[cat]}
                  </Text>
                  <Text
                    style={[
                      styles.filterChipLabel,
                      active && { color: THEME.categories[cat] },
                    ]}
                  >
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* View tabs */}
      <View style={styles.tabRow}>
        {VIEW_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, state.viewMode === tab.key && styles.tabActive]}
            onPress={() => setViewMode(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                state.viewMode === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.bg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 0,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  monthNav: { flexDirection: "row", alignItems: "center", gap: 10 },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnText: { fontSize: 20, color: THEME.textSub, lineHeight: 24 },
  monthTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.text,
    letterSpacing: -0.3,
    minWidth: 160,
  },

  actions: { flexDirection: "row", gap: 6 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnActive: {
    backgroundColor: THEME.goldDim,
    borderColor: THEME.gold,
  },
  iconBtnText: { fontSize: 16, color: THEME.textSub },

  filterPanel: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  filterTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.textDim,
    letterSpacing: 1.2,
  },
  filterToggleAll: { fontSize: 12, color: THEME.gold },
  filterChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  filterChipIcon: { fontSize: 13 },
  filterChipLabel: { fontSize: 12, color: THEME.textSub, fontWeight: "500" },

  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 2,
    backgroundColor: THEME.bgCard,
    marginHorizontal: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: { backgroundColor: THEME.bgElevated },
  tabText: { fontSize: 12, fontWeight: "600", color: THEME.textDim },
  tabTextActive: { color: THEME.text },

  // Search bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.bg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  searchIcon: { fontSize: 20, color: THEME.textSub },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: THEME.text,
    padding: 0,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { fontSize: 12, color: THEME.textSub },
});
