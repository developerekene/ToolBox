import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  THEME,
  CATEGORY_ICONS,
} from "../../../../../utils/constant/calendar/types";
import {
  addDays,
  todayStr,
  getEventsForDate,
  relativeDayLabel,
  formatTime,
  formatDateDisplay,
} from "../../../../../utils/constant/calendar/calendarutils";
import { useCalendar } from "../../newtools/calendar/Calendarcontext ";
import { CalendarEvent } from "../../../../../utils/constant/calendar/types";

// ─── Agenda View

export function AgendaView() {
  const { filteredEvents, state, setSelectedDate } = useCalendar();

  const today = todayStr();
  const days = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => addDays(today, i - 7));
  }, [today]);

  const groups = useMemo(() => {
    return days
      .map((date) => ({
        date,
        events: getEventsForDate(date, filteredEvents),
      }))
      .filter((g) => g.events.length > 0);
  }, [days, filteredEvents]);

  if (groups.length === 0) {
    return (
      <View style={agendaStyles.empty}>
        <Text style={agendaStyles.emptyIcon}>📭</Text>
        <Text style={agendaStyles.emptyText}>No upcoming events</Text>
        <Text style={agendaStyles.emptySub}>Tap + to add your first event</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={agendaStyles.container}
      showsVerticalScrollIndicator={false}
    >
      {groups.map(({ date, events }) => (
        <View key={date} style={agendaStyles.group}>
          <TouchableOpacity onPress={() => setSelectedDate(date)}>
            <View style={agendaStyles.dateHeader}>
              <View style={agendaStyles.datePill}>
                <Text style={agendaStyles.dateLabel}>
                  {relativeDayLabel(date)}
                </Text>
                {date === today && <View style={agendaStyles.todayDot} />}
              </View>
            </View>
          </TouchableOpacity>

          {events.map((evt) => (
            <AgendaEventRow key={evt.id} event={evt} />
          ))}
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const AgendaEventRow = ({ event }: { event: CalendarEvent }) => {
  const { toggleComplete } = useCalendar();
  return (
    <TouchableOpacity
      style={[agendaStyles.eventRow, { borderLeftColor: event.color }]}
      onPress={() => toggleComplete(event.id)}
      activeOpacity={0.7}
    >
      <View style={agendaStyles.eventLeft}>
        <Text style={agendaStyles.eventIcon}>
          {CATEGORY_ICONS[event.category]}
        </Text>
      </View>
      <View style={agendaStyles.eventMid}>
        <Text
          style={[
            agendaStyles.eventTitle,
            event.isCompleted && agendaStyles.eventTitleDone,
          ]}
        >
          {event.title}
        </Text>
        {event.location ? (
          <Text style={agendaStyles.eventLocation}>📍 {event.location}</Text>
        ) : null}
        {event.description ? (
          <Text style={agendaStyles.eventDesc} numberOfLines={1}>
            {event.description}
          </Text>
        ) : null}
      </View>
      <View style={agendaStyles.eventRight}>
        {event.isAllDay ? (
          <Text style={agendaStyles.allDayBadge}>All day</Text>
        ) : (
          <>
            <Text style={[agendaStyles.timeText, { color: event.color }]}>
              {formatTime(event.startTime!)}
            </Text>
            {event.endTime ? (
              <Text style={agendaStyles.endTime}>
                {formatTime(event.endTime)}
              </Text>
            ) : null}
          </>
        )}
        {event.isCompleted && <Text style={agendaStyles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
};

const agendaStyles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: "700", color: THEME.text },
  emptySub: { fontSize: 14, color: THEME.textSub },

  group: { marginBottom: 8 },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: THEME.bgElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  dateLabel: { fontSize: 13, fontWeight: "700", color: THEME.text },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.gold,
  },

  eventRow: {
    flexDirection: "row",
    backgroundColor: THEME.bgCard,
    borderRadius: 12,
    marginBottom: 6,
    borderLeftWidth: 3,
    padding: 12,
    alignItems: "flex-start",
    gap: 10,
  },
  eventLeft: { paddingTop: 2 },
  eventIcon: { fontSize: 20 },
  eventMid: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 15, fontWeight: "600", color: THEME.text },
  eventTitleDone: {
    textDecorationLine: "line-through",
    color: THEME.textDim,
  },
  eventLocation: { fontSize: 12, color: THEME.textSub },
  eventDesc: { fontSize: 12, color: THEME.textDim },
  eventRight: { alignItems: "flex-end", gap: 2, minWidth: 52 },
  allDayBadge: {
    fontSize: 10,
    color: THEME.textSub,
    backgroundColor: THEME.bgElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  timeText: { fontSize: 12, fontWeight: "700" },
  endTime: { fontSize: 10, color: THEME.textDim },
  checkmark: { fontSize: 12, color: THEME.success, fontWeight: "700" },
});

// ─── Day View

export function DayView() {
  const { state, filteredEvents, toggleComplete } = useCalendar();
  const { selectedDate } = state;

  const allEvents = getEventsForDate(selectedDate, filteredEvents);
  const allDayEvents = allEvents.filter((e) => e.isAllDay);
  const timedEvents = allEvents.filter((e) => !e.isAllDay);

  return (
    <ScrollView
      style={dayStyles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={dayStyles.dayTitle}>{formatDateDisplay(selectedDate)}</Text>

      {allDayEvents.length > 0 && (
        <View style={dayStyles.section}>
          <Text style={dayStyles.sectionLabel}>ALL DAY</Text>
          {allDayEvents.map((evt) => (
            <DayEventCard
              key={evt.id}
              event={evt}
              onPress={() => toggleComplete(evt.id)}
            />
          ))}
        </View>
      )}

      {timedEvents.length > 0 && (
        <View style={dayStyles.section}>
          <Text style={dayStyles.sectionLabel}>SCHEDULED</Text>
          {timedEvents.map((evt) => (
            <DayEventCard
              key={evt.id}
              event={evt}
              onPress={() => toggleComplete(evt.id)}
            />
          ))}
        </View>
      )}

      {allEvents.length === 0 && (
        <View style={dayStyles.emptyDay}>
          <Text style={dayStyles.emptyText}>✨ Free day</Text>
          <Text style={dayStyles.emptySub}>Nothing scheduled</Text>
        </View>
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const DayEventCard = ({
  event,
  onPress,
}: {
  event: CalendarEvent;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[dayStyles.card, { borderColor: event.color + "55" }]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[dayStyles.cardAccent, { backgroundColor: event.color }]} />
    <View style={dayStyles.cardBody}>
      <View style={dayStyles.cardTop}>
        <Text style={dayStyles.cardIcon}>{CATEGORY_ICONS[event.category]}</Text>
        <Text
          style={[
            dayStyles.cardTitle,
            event.isCompleted && dayStyles.cardTitleDone,
          ]}
        >
          {event.title}
        </Text>
        {event.isCompleted && (
          <View style={dayStyles.doneTag}>
            <Text style={dayStyles.doneTagText}>Done</Text>
          </View>
        )}
      </View>
      {!event.isAllDay && event.startTime && (
        <Text style={[dayStyles.cardTime, { color: event.color }]}>
          {formatTime(event.startTime)}
          {event.endTime ? ` – ${formatTime(event.endTime)}` : ""}
        </Text>
      )}
      {event.location ? (
        <Text style={dayStyles.cardMeta}>📍 {event.location}</Text>
      ) : null}
      {event.description ? (
        <Text style={dayStyles.cardDesc}>{event.description}</Text>
      ) : null}
      {event.reminder ? (
        <Text style={dayStyles.cardMeta}>
          🔔{" "}
          {event.reminder < 60
            ? `${event.reminder}m before`
            : `${event.reminder / 60}h before`}
        </Text>
      ) : null}
      {event.recurrence !== "none" && (
        <Text style={dayStyles.cardMeta}>🔄 Repeats {event.recurrence}</Text>
      )}
    </View>
  </TouchableOpacity>
);

const dayStyles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  dayTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: THEME.text,
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.textDim,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  emptyDay: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: { fontSize: 28 },
  emptySub: { fontSize: 15, color: THEME.textSub },

  card: {
    flexDirection: "row",
    backgroundColor: THEME.bgCard,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 4 },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  cardIcon: { fontSize: 18 },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: THEME.text,
  },
  cardTitleDone: {
    textDecorationLine: "line-through",
    color: THEME.textDim,
  },
  doneTag: {
    backgroundColor: THEME.success + "22",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  doneTagText: { fontSize: 10, color: THEME.success, fontWeight: "700" },
  cardTime: { fontSize: 13, fontWeight: "700" },
  cardMeta: { fontSize: 12, color: THEME.textSub },
  cardDesc: { fontSize: 13, color: THEME.textSub, lineHeight: 18 },
});
