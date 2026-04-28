/**
 * EventModal.tsx
 * Full-screen bottom sheet modal for creating and editing events.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  THEME,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  EventCategory,
  RecurrenceType,
} from "../../../../../utils/constant/calendar/types";
import { useCalendar } from "../../newtools/calendar/CalendarContext";
import { CalendarEvent } from "../../../../../utils/constant/calendar/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  editEvent?: CalendarEvent | null;
  defaultDate?: string;
}

const ALL_CATEGORIES: EventCategory[] = [
  "work",
  "personal",
  "health",
  "social",
  "travel",
  "finance",
  "education",
];

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const REMINDER_OPTIONS = [
  { value: undefined, label: "None" },
  { value: 5, label: "5 minutes before" },
  { value: 10, label: "10 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 1440, label: "1 day before" },
];

export default function EventModal({
  visible,
  onClose,
  editEvent,
  defaultDate,
}: Props) {
  const { addEvent, updateEvent, deleteEvent } = useCalendar();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate || "");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [isAllDay, setIsAllDay] = useState(false);
  const [category, setCategory] = useState<EventCategory>("work");
  const [location, setLocation] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");
  const [reminder, setReminder] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title);
      setDescription(editEvent.description || "");
      setDate(editEvent.date);
      setStartTime(editEvent.startTime || "09:00");
      setEndTime(editEvent.endTime || "10:00");
      setIsAllDay(editEvent.isAllDay);
      setCategory(editEvent.category);
      setLocation(editEvent.location || "");
      setRecurrence(editEvent.recurrence);
      setReminder(editEvent.reminder);
    } else {
      setTitle("");
      setDescription("");
      setDate(defaultDate || "");
      setStartTime("09:00");
      setEndTime("10:00");
      setIsAllDay(false);
      setCategory("work");
      setLocation("");
      setRecurrence("none");
      setReminder(undefined);
    }
  }, [editEvent, defaultDate, visible]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Title required", "Please enter an event title.");
      return;
    }
    if (!date) {
      Alert.alert("Date required", "Please select a date.");
      return;
    }

    const eventData = {
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      isAllDay,
      category,
      color: THEME.categories[category],
      location: location.trim() || undefined,
      recurrence,
      reminder,
      isCompleted: editEvent?.isCompleted || false,
    };

    if (editEvent) {
      updateEvent({
        ...eventData,
        id: editEvent.id,
        createdAt: editEvent.createdAt,
      });
    } else {
      addEvent(eventData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!editEvent) return;
    Alert.alert("Delete Event", `Delete "${editEvent.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteEvent(editEvent.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editEvent ? "Edit Event" : "New Event"}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <View style={styles.section}>
            <TextInput
              style={styles.titleInput}
              placeholder="Event title"
              placeholderTextColor={THEME.textDim}
              value={title}
              onChangeText={setTitle}
              autoFocus={!editEvent}
            />
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CATEGORY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.catScroll}
            >
              {ALL_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    category === cat && {
                      backgroundColor: THEME.categories[cat] + "33",
                      borderColor: THEME.categories[cat],
                    },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={styles.catIcon}>{CATEGORY_ICONS[cat]}</Text>
                  <Text
                    style={[
                      styles.catLabel,
                      category === cat && { color: THEME.categories[cat] },
                    ]}
                  >
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DATE & TIME</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Date</Text>
                <TextInput
                  style={styles.inlineInput}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={THEME.textDim}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>All Day</Text>
                <Switch
                  value={isAllDay}
                  onValueChange={setIsAllDay}
                  trackColor={{ false: THEME.border, true: THEME.gold }}
                  thumbColor="#fff"
                />
              </View>
              {!isAllDay && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Start</Text>
                    <TextInput
                      style={styles.inlineInput}
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="HH:MM"
                      placeholderTextColor={THEME.textDim}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>End</Text>
                    <TextInput
                      style={styles.inlineInput}
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="HH:MM"
                      placeholderTextColor={THEME.textDim}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Location & Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DETAILS</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rowIcon}>📍</Text>
                <TextInput
                  style={[styles.inlineInput, { flex: 1 }]}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Add location"
                  placeholderTextColor={THEME.textDim}
                />
              </View>
              <View style={styles.divider} />
              <View
                style={[
                  styles.row,
                  { alignItems: "flex-start", paddingVertical: 12 },
                ]}
              >
                <Text style={[styles.rowIcon, { marginTop: 2 }]}>📝</Text>
                <TextInput
                  style={[styles.inlineInput, { flex: 1, minHeight: 60 }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add notes"
                  placeholderTextColor={THEME.textDim}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Recurrence */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>REPEAT</Text>
            <View style={styles.card}>
              {RECURRENCE_OPTIONS.map((opt, i) => (
                <View key={opt.value}>
                  {i > 0 && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={styles.row}
                    onPress={() => setRecurrence(opt.value)}
                  >
                    <Text style={styles.rowLabel}>{opt.label}</Text>
                    {recurrence === opt.value && (
                      <Text style={[styles.checkmark, { color: THEME.gold }]}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Reminder */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>REMINDER</Text>
            <View style={styles.card}>
              {REMINDER_OPTIONS.map((opt, i) => (
                <View key={String(opt.value)}>
                  {i > 0 && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={styles.row}
                    onPress={() => setReminder(opt.value)}
                  >
                    <Text style={styles.rowLabel}>{opt.label}</Text>
                    {reminder === opt.value && (
                      <Text style={[styles.checkmark, { color: THEME.gold }]}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Delete */}
          {editEvent && (
            <View style={styles.section}>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteText}>Delete Event</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerBtn: { minWidth: 60 },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: THEME.text,
  },
  cancelText: { fontSize: 16, color: THEME.textSub },
  saveText: {
    fontSize: 16,
    color: THEME.gold,
    fontWeight: "600",
    textAlign: "right",
  },

  scroll: { flex: 1 },

  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.textDim,
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  titleInput: {
    fontSize: 24,
    fontWeight: "700",
    color: THEME.text,
    padding: 0,
  },

  catScroll: { flexDirection: "row" },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: THEME.border,
    backgroundColor: THEME.bgCard,
    marginRight: 8,
  },
  catIcon: { fontSize: 16 },
  catLabel: { fontSize: 13, fontWeight: "600", color: THEME.textSub },

  card: {
    backgroundColor: THEME.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    justifyContent: "space-between",
  },
  rowLabel: { fontSize: 15, color: THEME.text },
  rowIcon: { fontSize: 18, marginRight: 12 },
  inlineInput: {
    fontSize: 15,
    color: THEME.gold,
    textAlign: "right",
    fontWeight: "500",
    padding: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: THEME.border,
    marginLeft: 16,
  },
  checkmark: { fontSize: 18, fontWeight: "700" },

  deleteBtn: {
    backgroundColor: THEME.danger + "18",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.danger + "44",
    paddingVertical: 16,
    alignItems: "center",
  },
  deleteText: { fontSize: 16, color: THEME.danger, fontWeight: "600" },
});
