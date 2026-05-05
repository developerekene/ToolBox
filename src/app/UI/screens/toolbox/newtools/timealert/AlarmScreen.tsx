import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Switch,
  Vibration,
  Alert,
  Animated,
} from "react-native";
import {
  T,
  pad,
  getCurrentHHMM,
  generateId,
  DAYS_SHORT,
  DAYS_FULL,
} from "../../../../../utils/constant/timealert/theme";
import { LiveClock } from "../../newtools/timealert/TimerComponent";

interface AlarmEntry {
  id: string;
  time: string; // "HH:MM"
  label: string;
  active: boolean;
  days: number[]; // 0=Sun … 6=Sat, empty = once
  snoozeMinutes: number;
}

const SNOOZE_OPTIONS = [0, 5, 10, 15];

export default function AlarmScreen() {
  const accent = T.amber;

  const [alarms, setAlarms] = useState<AlarmEntry[]>([
    {
      id: "seed1",
      time: "07:00",
      label: "Good morning",
      active: true,
      days: [1, 2, 3, 4, 5],
      snoozeMinutes: 5,
    },
    {
      id: "seed2",
      time: "09:00",
      label: "Standup meeting",
      active: false,
      days: [1, 2, 3, 4, 5],
      snoozeMinutes: 0,
    },
    {
      id: "seed3",
      time: "18:30",
      label: "Evening walk",
      active: true,
      days: [],
      snoozeMinutes: 10,
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [fTime, setFTime] = useState("07:00");
  const [fLabel, setFLabel] = useState("");
  const [fDays, setFDays] = useState<number[]>([]);
  const [fSnooze, setFSnooze] = useState(5);

  // Slide-in animation for form
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (showForm) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [showForm]);

  // Check alarms every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = getCurrentHHMM();
      const todayDow = new Date().getDay();
      const todaySec = new Date().getSeconds();
      if (todaySec !== 0) return; // only check on the exact minute

      alarms.forEach((alarm) => {
        if (!alarm.active || alarm.time !== now) return;
        const matchDay =
          alarm.days.length === 0 || alarm.days.includes(todayDow);
        if (matchDay) fireAlarm(alarm);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [alarms]);

  const fireAlarm = (alarm: AlarmEntry) => {
    Vibration.vibrate([300, 200, 300, 200, 600, 200, 600], false);
    const buttons: any[] = [
      {
        text: "Dismiss",
        style: "destructive",
        onPress: () => Vibration.cancel(),
      },
    ];
    if (alarm.snoozeMinutes > 0) {
      buttons.unshift({
        text: `Snooze ${alarm.snoozeMinutes}m`,
        onPress: () => {
          Vibration.cancel();
          // Simple snooze: schedule a one-time alarm
          const snoozeMs = alarm.snoozeMinutes * 60 * 1000;
          setTimeout(() => {
            Vibration.vibrate([300, 200, 300, 200, 600], false);
            Alert.alert("⏰ Snooze Over", alarm.label || "Wake up!", [
              { text: "OK", onPress: () => Vibration.cancel() },
            ]);
          }, snoozeMs);
        },
      });
    }
    Alert.alert("⏰ Alarm!", alarm.label || "Time to wake up!", buttons);
  };

  const openAdd = () => {
    setEditId(null);
    setFTime("07:00");
    setFLabel("");
    setFDays([]);
    setFSnooze(5);
    setShowForm(true);
  };

  const openEdit = (alarm: AlarmEntry) => {
    setEditId(alarm.id);
    setFTime(alarm.time);
    setFLabel(alarm.label);
    setFDays([...alarm.days]);
    setFSnooze(alarm.snoozeMinutes);
    setShowForm(true);
  };

  const saveAlarm = () => {
    if (!fTime.match(/^\d{2}:\d{2}$/)) {
      Alert.alert("Invalid time", "Enter time in HH:MM format (e.g. 07:30)");
      return;
    }
    const [h, m] = fTime.split(":").map(Number);
    if (h > 23 || m > 59) {
      Alert.alert("Invalid time", "Hours must be 0-23, minutes 0-59");
      return;
    }
    const entry: AlarmEntry = {
      id: editId || generateId(),
      time: fTime,
      label: fLabel.trim() || "Alarm",
      active: true,
      days: [...fDays].sort(),
      snoozeMinutes: fSnooze,
    };
    if (editId) {
      setAlarms((prev) => prev.map((a) => (a.id === editId ? entry : a)));
    } else {
      setAlarms((prev) =>
        [...prev, entry].sort((a, b) => a.time.localeCompare(b.time)),
      );
    }
    setShowForm(false);
  };

  const deleteAlarm = (id: string) => {
    Alert.alert("Delete alarm?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setAlarms((prev) => prev.filter((a) => a.id !== id)),
      },
    ]);
  };

  const toggleAlarm = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)),
    );
  };

  const toggleDay = (day: number) => {
    setFDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const daysLabel = (days: number[]) => {
    if (days.length === 0) return "Once";
    if (days.length === 7) return "Every day";
    if (
      days.length === 5 &&
      days.includes(1) &&
      days.includes(2) &&
      days.includes(3) &&
      days.includes(4) &&
      days.includes(5)
    )
      return "Weekdays";
    if (days.length === 2 && days.includes(0) && days.includes(6))
      return "Weekends";
    return days.map((d) => DAYS_SHORT[d]).join(", ");
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <LiveClock color={accent} />

        {/* Alarm list */}
        {alarms.length === 0 && !showForm && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>⏰</Text>
            <Text style={styles.emptyText}>No alarms yet</Text>
            <Text style={styles.emptySub}>Tap + to add your first alarm</Text>
          </View>
        )}

        {alarms.map((alarm) => (
          <TouchableOpacity
            key={alarm.id}
            style={[
              styles.alarmCard,
              alarm.active && { borderColor: accent + "55" },
            ]}
            onPress={() => openEdit(alarm)}
            activeOpacity={0.8}
          >
            {/* Active indicator */}
            {alarm.active && (
              <View style={[styles.activeBar, { backgroundColor: accent }]} />
            )}

            <View style={styles.cardLeft}>
              <Text
                style={[
                  styles.alarmTime,
                  { color: alarm.active ? accent : T.textSub },
                ]}
              >
                {alarm.time.split(":")[0].length < 2 ? alarm.time : alarm.time}
                <Text style={styles.alarmAmpm}>
                  {" "}
                  {parseInt(alarm.time) >= 12 ? "PM" : "AM"}
                </Text>
              </Text>
              <Text style={styles.alarmLabel}>{alarm.label}</Text>
              <Text style={styles.alarmDays}>{daysLabel(alarm.days)}</Text>
              {alarm.snoozeMinutes > 0 && (
                <Text style={styles.alarmSnooze}>
                  💤 Snooze {alarm.snoozeMinutes}m
                </Text>
              )}
            </View>

            <View style={styles.cardRight}>
              <Switch
                value={alarm.active}
                onValueChange={() => toggleAlarm(alarm.id)}
                trackColor={{ false: T.border, true: accent + "66" }}
                thumbColor={alarm.active ? accent : T.textSub}
              />
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteAlarm(alarm.id)}
              >
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {/* Add form */}
        {showForm && (
          <Animated.View
            style={[
              styles.formCard,
              { borderColor: accent + "55" },
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={[styles.formTitle, { color: accent }]}>
              {editId ? "Edit Alarm" : "New Alarm"}
            </Text>

            {/* Time input */}
            <Text style={styles.fieldLabel}>TIME</Text>
            <TextInput
              style={[
                styles.bigTimeInput,
                { color: accent, borderBottomColor: accent + "66" },
              ]}
              value={fTime}
              onChangeText={setFTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              placeholder="07:00"
              placeholderTextColor={T.textDim}
              selectTextOnFocus
            />

            {/* Label */}
            <Text style={styles.fieldLabel}>LABEL</Text>
            <TextInput
              style={styles.textInput}
              value={fLabel}
              onChangeText={setFLabel}
              placeholder="Alarm label…"
              placeholderTextColor={T.textDim}
            />

            {/* Days */}
            <Text style={styles.fieldLabel}>REPEAT</Text>
            <View style={styles.daysRow}>
              {DAYS_FULL.map((day, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.dayBtn,
                    fDays.includes(i) && {
                      backgroundColor: accent,
                      borderColor: accent,
                    },
                  ]}
                  onPress={() => toggleDay(i)}
                >
                  <Text
                    style={[
                      styles.dayBtnText,
                      fDays.includes(i) && { color: "#000" },
                    ]}
                  >
                    {day.slice(0, 2)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Snooze */}
            <Text style={styles.fieldLabel}>SNOOZE</Text>
            <View style={styles.snoozeRow}>
              {SNOOZE_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.snoozeBtn,
                    fSnooze === s && {
                      backgroundColor: accent,
                      borderColor: accent,
                    },
                  ]}
                  onPress={() => setFSnooze(s)}
                >
                  <Text
                    style={[
                      styles.snoozeBtnText,
                      fSnooze === s && { color: "#000" },
                    ]}
                  >
                    {s === 0 ? "Off" : `${s}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: accent }]}
                onPress={saveAlarm}
              >
                <Text style={styles.saveBtnText}>
                  {editId ? "Update" : "Save Alarm"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      {!showForm && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: accent, shadowColor: accent }]}
          onPress={openAdd}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scroll: { flex: 1, paddingHorizontal: 16 },

  empty: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyIcon: { fontSize: 52 },
  emptyText: { fontSize: 20, fontWeight: "700", color: T.text },
  emptySub: { fontSize: 14, color: T.textSub },

  alarmCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 12,
    overflow: "hidden",
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingLeft: 20,
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 2,
  },
  cardLeft: { flex: 1, gap: 3 },
  alarmTime: { fontSize: 40, fontWeight: "200", letterSpacing: -1.5 },
  alarmAmpm: { fontSize: 16, fontWeight: "600", letterSpacing: 0 },
  alarmLabel: { fontSize: 14, color: T.text, fontWeight: "500" },
  alarmDays: { fontSize: 12, color: T.textSub },
  alarmSnooze: { fontSize: 11, color: T.textDim, marginTop: 2 },
  cardRight: { alignItems: "center", gap: 10 },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: T.bgElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  deleteBtnText: { fontSize: 11, color: T.textSub },

  formCard: {
    backgroundColor: T.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 12,
    gap: 6,
  },
  formTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: T.textDim,
    letterSpacing: 1.5,
    marginTop: 10,
    marginBottom: 4,
  },
  bigTimeInput: {
    fontSize: 56,
    fontWeight: "200",
    letterSpacing: -2,
    borderBottomWidth: 2,
    paddingVertical: 4,
  },
  textInput: {
    backgroundColor: T.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: T.text,
  },
  daysRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  dayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: T.bgElevated,
  },
  dayBtnText: { fontSize: 12, fontWeight: "700", color: T.textSub },
  snoozeRow: { flexDirection: "row", gap: 8 },
  snoozeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: T.bgElevated,
  },
  snoozeBtnText: { fontSize: 13, fontWeight: "700", color: T.textSub },

  formActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: T.border,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, color: T.textSub, fontWeight: "600" },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "800", color: "#000" },

  fab: {
    position: "absolute",
    bottom: 28,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  fabText: {
    fontSize: 30,
    color: "#000",
    fontWeight: "300",
    lineHeight: 36,
    marginTop: -2,
  },
});
