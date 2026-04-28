/**
 * CalendarScreen.tsx
 * Root screen — renders the header, the active view, and the FAB.
 * Manages the event modal state.
 */

import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { THEME } from "../../../../../utils/constant/calendar/types";
import { useCalendar } from "../../newtools/calendar/CalendarContext";
import CalendarHeader from "../../newtools/calendar/CalendarHeader";
import MonthView from "../../newtools/calendar/MonthView";
import WeekView from "../../newtools/calendar/WeekView";
import { AgendaView, DayView } from "../../newtools/calendar/Agendadayview";
import EventModal from "../../newtools/calendar/EventModal";
import StatsStrip from "../../newtools/calendar/StatsStrip";
import { CalendarEvent } from "../../../../../utils/constant/calendar/types";

export default function CalendarScreen() {
  const { state } = useCalendar();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const openAdd = () => {
    setEditingEvent(null);
    setModalVisible(true);
  };

  const openEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setModalVisible(true);
  };

  const renderView = () => {
    switch (state.viewMode) {
      case "month":
        return <MonthView />;
      case "week":
        return <WeekView />;
      case "day":
        return <DayView />;
      case "agenda":
        return <AgendaView />;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
      <View style={styles.container}>
        {/* Header */}
        <CalendarHeader />

        {/* Active view */}
        <View style={styles.viewContainer}>{renderView()}</View>

        {/* Stats strip — only in month view */}
        {state.viewMode === "month" && <StatsStrip />}

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={openAdd}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>

        {/* Event modal */}
        <EventModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          editEvent={editingEvent}
          defaultDate={state.selectedDate}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  viewContainer: {
    flex: 1,
    paddingTop: 8,
  },
  fab: {
    position: "absolute",
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: THEME.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: "#000",
    fontWeight: "700",
    lineHeight: 32,
    marginTop: -2,
  },
});
