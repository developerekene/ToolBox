import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Vibration,
  Alert,
  Switch,
  Animated,
  TextInput,
} from "react-native";
import {
  T,
  pad,
  msToHMSCs,
  msToDuration,
} from "../../../../../utils/constant/timealert/theme";
import {
  CircularRing,
  PulsingRing,
} from "../../newtools/timealert/TimerComponent";

// ─── Presets
const PRESETS = [
  { label: "1 min", ms: 60_000 },
  { label: "3 min", ms: 180_000 },
  { label: "5 min", ms: 300_000 },
  { label: "10 min", ms: 600_000 },
  { label: "15 min", ms: 900_000 },
  { label: "25 min", ms: 1_500_000 },
  { label: "30 min", ms: 1_800_000 },
  { label: "45 min", ms: 2_700_000 },
  { label: "1 hr", ms: 3_600_000 },
  { label: "90 min", ms: 5_400_000 },
];

type TimerState = "idle" | "running" | "paused" | "finished";

export default function TimerScreen() {
  const accent = T.emerald;

  const [totalMs, setTotalMs] = useState(300_000); // 5 min default
  const [remaining, setRemaining] = useState(300_000);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [recurrent, setRecurrent] = useState(false);
  const [recurrCount, setRecurrCount] = useState(0);
  const [showCustom, setShowCustom] = useState(false);

  // Custom time inputs
  const [inputH, setInputH] = useState("0");
  const [inputM, setInputM] = useState("5");
  const [inputS, setInputS] = useState("0");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef(0);

  // Animations
  const finishedAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  const clearTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const playFinishedAnimation = () => {
    Animated.sequence([
      Animated.timing(finishedAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(finishedAnim, {
        toValue: 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(finishedAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleFinished = () => {
    clearTimer();
    setTimerState("finished");
    setRemaining(0);
    playFinishedAnimation();
    Vibration.vibrate([0, 400, 150, 400, 150, 800, 150, 400], false);

    if (recurrent) {
      const count = recurrCount + 1;
      setRecurrCount(count);
      // Brief pause then restart
      setTimeout(() => {
        setRemaining(totalMs);
        setTimerState("idle");
        // Auto-start next iteration
        setTimeout(() => startTimer(totalMs), 500);
      }, 2000);
    } else {
      Alert.alert(
        "⏲ Timer Done!",
        `Your ${msToDuration(totalMs)} timer has finished.`,
        [{ text: "OK", onPress: () => Vibration.cancel() }],
      );
    }
  };

  const startTimer = (ms?: number) => {
    const duration = ms ?? remaining;
    if (duration <= 0) return;
    endTimeRef.current = Date.now() + duration;
    setTimerState("running");

    intervalRef.current = setInterval(() => {
      const left = endTimeRef.current - Date.now();
      if (left <= 100) {
        setRemaining(0);
        handleFinished();
      } else {
        setRemaining(left);
      }
    }, 100);
  };

  const pauseTimer = () => {
    clearTimer();
    setTimerState("paused");
  };

  const resetTimer = () => {
    clearTimer();
    Vibration.cancel();
    setTimerState("idle");
    setRemaining(totalMs);
    setRecurrCount(0);
    finishedAnim.setValue(0);
  };

  const applyDuration = (ms: number) => {
    clearTimer();
    Vibration.cancel();
    setTotalMs(ms);
    setRemaining(ms);
    setTimerState("idle");
    setRecurrCount(0);
    finishedAnim.setValue(0);
  };

  const applyCustom = () => {
    const ms =
      (parseInt(inputH) || 0) * 3_600_000 +
      (parseInt(inputM) || 0) * 60_000 +
      (parseInt(inputS) || 0) * 1_000;
    if (ms <= 0) {
      Alert.alert("Invalid duration", "Please enter a time greater than 0");
      return;
    }
    applyDuration(ms);
    setShowCustom(false);
  };

  useEffect(() => {
    return () => {
      clearTimer();
      Vibration.cancel();
    };
  }, []);

  const progress =
    timerState === "idle"
      ? 1
      : timerState === "finished"
        ? 1
        : totalMs > 0
          ? remaining / totalMs
          : 0;

  const { h, m, s } = msToHMSCs(remaining);
  const isFinished = timerState === "finished";
  const isRunning = timerState === "running";
  const isPaused = timerState === "paused";
  const isIdle = timerState === "idle";

  const ringColor = isFinished ? T.red : accent;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Ring */}
      <Animated.View
        style={[styles.ringWrap, { transform: [{ translateX: shakeAnim }] }]}
      >
        <PulsingRing color={ringColor} active={isRunning} />
        <CircularRing
          progress={progress}
          color={ringColor}
          size={260}
          thickness={5}
        >
          <View style={styles.timeDisplay}>
            {isFinished ? (
              <Animated.Text
                style={[styles.finishedText, { opacity: finishedAnim }]}
              >
                ✓ Done!
              </Animated.Text>
            ) : (
              <>
                <Text
                  style={[
                    styles.mainTime,
                    { color: isRunning ? ringColor : T.text },
                  ]}
                >
                  {h > 0 ? `${pad(h)}:` : ""}
                  {pad(m)}:{pad(s)}
                </Text>
                {recurrent && recurrCount > 0 && (
                  <View style={styles.recurrBadge}>
                    <Text style={[styles.recurrBadgeText, { color: accent }]}>
                      ×{recurrCount} completed
                    </Text>
                  </View>
                )}
                {isRunning && (
                  <Text style={[styles.statusText, { color: accent + "77" }]}>
                    running
                  </Text>
                )}
                {isPaused && (
                  <Text style={[styles.statusText, { color: T.amber + "99" }]}>
                    paused
                  </Text>
                )}
              </>
            )}
          </View>
        </CircularRing>
      </Animated.View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.secondaryBtn,
            { opacity: isIdle && recurrCount === 0 ? 0.3 : 1 },
          ]}
          onPress={resetTimer}
          disabled={isIdle && recurrCount === 0}
          activeOpacity={0.75}
        >
          <Text style={styles.secondaryBtnText}>↺{"\n"}Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.mainBtn,
            {
              backgroundColor: isRunning
                ? T.red
                : isFinished
                  ? T.amber
                  : accent,
              shadowColor: isRunning ? T.red : accent,
            },
          ]}
          onPress={() => {
            if (isRunning) pauseTimer();
            else if (isFinished) resetTimer();
            else startTimer();
          }}
          disabled={isIdle && remaining <= 0}
          activeOpacity={0.85}
        >
          <Text
            style={[styles.mainBtnIcon, { color: isRunning ? "#fff" : "#000" }]}
          >
            {isRunning ? "⏸" : isFinished ? "↺" : isPaused ? "▶" : "▶"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryBtn,
            showCustom && {
              borderColor: accent,
              backgroundColor: accent + "18",
            },
          ]}
          onPress={() => setShowCustom((v) => !v)}
          activeOpacity={0.75}
        >
          <Text
            style={[styles.secondaryBtnText, showCustom && { color: accent }]}
          >
            ✎{"\n"}Custom
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recurrence toggle */}
      <View
        style={[styles.recurrRow, recurrent && { borderColor: accent + "44" }]}
      >
        <View style={styles.recurrLeft}>
          <Text style={styles.recurrLabel}>🔄 Repeat automatically</Text>
          {recurrent && (
            <Text style={styles.recurrSub}>
              Timer restarts when it reaches zero
            </Text>
          )}
        </View>
        <Switch
          value={recurrent}
          onValueChange={setRecurrent}
          trackColor={{ false: T.border, true: accent + "77" }}
          thumbColor={recurrent ? accent : T.textSub}
        />
      </View>

      {/* Custom input */}
      {showCustom && (
        <View style={[styles.customCard, { borderColor: accent + "44" }]}>
          <Text style={[styles.customTitle, { color: accent }]}>
            Custom Duration
          </Text>
          <View style={styles.customInputs}>
            {[
              { label: "HRS", val: inputH, set: setInputH, max: "99" },
              { label: "MIN", val: inputM, set: setInputM, max: "59" },
              { label: "SEC", val: inputS, set: setInputS, max: "59" },
            ].map(({ label, val, set }) => (
              <View key={label} style={styles.customInputWrap}>
                <TextInput
                  style={[
                    styles.customInput,
                    { color: accent, borderColor: accent + "55" },
                  ]}
                  value={val}
                  onChangeText={set}
                  keyboardType="numeric"
                  maxLength={2}
                  selectTextOnFocus
                />
                <Text style={styles.customInputLabel}>{label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.customActions}>
            <TouchableOpacity
              style={styles.customCancel}
              onPress={() => setShowCustom(false)}
            >
              <Text style={styles.customCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.customApply, { backgroundColor: accent }]}
              onPress={applyCustom}
            >
              <Text style={styles.customApplyText}>Set Timer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Presets */}
      <View style={styles.presetsSection}>
        <Text style={styles.presetsLabel}>QUICK PRESETS</Text>
        <View style={styles.presetsGrid}>
          {PRESETS.map((preset) => {
            const selected = totalMs === preset.ms;
            return (
              <TouchableOpacity
                key={preset.label}
                style={[
                  styles.presetBtn,
                  selected && {
                    borderColor: accent,
                    backgroundColor: accent + "18",
                  },
                ]}
                onPress={() => applyDuration(preset.ms)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.presetText, selected && { color: accent }]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  content: { alignItems: "center", paddingHorizontal: 16 },

  ringWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 24,
  },
  timeDisplay: { alignItems: "center", gap: 4 },
  mainTime: {
    fontSize: 52,
    fontWeight: "200",
    letterSpacing: -2,
    lineHeight: 56,
  },
  finishedText: {
    fontSize: 36,
    fontWeight: "800",
    color: T.red,
    letterSpacing: 1,
  },
  recurrBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: T.bgCard,
    borderWidth: 1,
    borderColor: T.border,
  },
  recurrBadgeText: { fontSize: 11, fontWeight: "700" },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
  },
  mainBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  mainBtnIcon: { fontSize: 30, lineHeight: 36 },
  secondaryBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: T.bgCard,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: T.textSub,
    textAlign: "center",
    lineHeight: 17,
  },

  recurrRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: T.bgCard,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  recurrLeft: { flex: 1, gap: 2 },
  recurrLabel: { fontSize: 14, color: T.text, fontWeight: "600" },
  recurrSub: { fontSize: 11, color: T.textSub },

  customCard: {
    width: "100%",
    backgroundColor: T.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    gap: 12,
  },
  customTitle: { fontSize: 16, fontWeight: "800" },
  customInputs: { flexDirection: "row", gap: 12, justifyContent: "center" },
  customInputWrap: { alignItems: "center", gap: 6 },
  customInput: {
    width: 80,
    height: 72,
    borderRadius: 14,
    borderWidth: 2,
    textAlign: "center",
    fontSize: 36,
    fontWeight: "200",
  },
  customInputLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: T.textDim,
    letterSpacing: 1.5,
  },
  customActions: { flexDirection: "row", gap: 10 },
  customCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: T.border,
    alignItems: "center",
  },
  customCancelText: { fontSize: 14, color: T.textSub, fontWeight: "600" },
  customApply: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  customApplyText: { fontSize: 15, fontWeight: "800", color: "#000" },

  presetsSection: { width: "100%", marginTop: 4 },
  presetsLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: T.textDim,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  presetsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  presetBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: T.bgCard,
  },
  presetText: { fontSize: 13, fontWeight: "700", color: T.textSub },
});
