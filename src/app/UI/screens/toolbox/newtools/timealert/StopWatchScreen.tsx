import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import {
  T,
  pad,
  msToHMSCs,
  msToStopwatch,
  LapEntry,
} from "../../../../../utils/constant/timealert/theme";
import {
  CircularRing,
  PulsingRing,
} from "../../newtools/timealert/TimerComponent";

export default function StopwatchScreen() {
  const accent = T.cyan;

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<LapEntry[]>([]);

  const startTimeRef = useRef(0);
  const baseElapsedRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated value for number flip
  const flipAnim = useRef(new Animated.Value(1)).current;

  const tick = useCallback(() => {
    setElapsed(baseElapsedRef.current + (Date.now() - startTimeRef.current));
  }, []);

  const start = () => {
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(tick, 16); // ~60fps
    setRunning(true);
  };

  const pause = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    baseElapsedRef.current += Date.now() - startTimeRef.current;
    setRunning(false);
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    baseElapsedRef.current = 0;
    setRunning(false);
    setElapsed(0);
    setLaps([]);

    // Flash animation
    Animated.sequence([
      Animated.timing(flipAnim, {
        toValue: 0.3,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const recordLap = () => {
    if (!running) return;
    const prevTotal = laps.length > 0 ? laps[laps.length - 1].totalMs : 0;
    setLaps((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        totalMs: elapsed,
        splitMs: elapsed - prevTotal,
      },
    ]);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Ring progress: one rotation per minute
  const progress = (elapsed % 60000) / 60000;
  const { h, m, s, cs } = msToHMSCs(elapsed);

  // Best and worst lap split
  const bestSplit =
    laps.length > 1 ? Math.min(...laps.map((l) => l.splitMs)) : null;
  const worstSplit =
    laps.length > 1 ? Math.max(...laps.map((l) => l.splitMs)) : null;

  return (
    <View style={styles.root}>
      {/* Ring & Time Display */}
      <View style={styles.ringSection}>
        <PulsingRing color={accent} active={running} />
        <CircularRing
          progress={progress}
          color={accent}
          size={260}
          thickness={5}
        >
          <Animated.View style={[styles.timeDisplay, { opacity: flipAnim }]}>
            {h > 0 && (
              <Text style={[styles.hoursText, { color: accent + "88" }]}>
                {pad(h)}h
              </Text>
            )}
            <Text
              style={[styles.mainTime, { color: running ? accent : T.text }]}
            >
              {pad(m)}:{pad(s)}
            </Text>
            <Text style={[styles.centiseconds, { color: accent + "AA" }]}>
              .{pad(cs)}
            </Text>
            {running && (
              <View style={[styles.runningDot, { backgroundColor: accent }]} />
            )}
          </Animated.View>
        </CircularRing>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Left: Lap / Reset */}
        <TouchableOpacity
          style={[
            styles.secondaryBtn,
            { opacity: !running && elapsed === 0 ? 0.3 : 1 },
          ]}
          onPress={running ? recordLap : reset}
          disabled={!running && elapsed === 0}
          activeOpacity={0.75}
        >
          <Text style={styles.secondaryBtnText}>
            {running ? "Lap" : "Reset"}
          </Text>
        </TouchableOpacity>

        {/* Center: Start / Pause */}
        <TouchableOpacity
          style={[
            styles.mainBtn,
            {
              backgroundColor: running ? T.red : accent,
              shadowColor: running ? T.red : accent,
            },
          ]}
          onPress={running ? pause : start}
          activeOpacity={0.85}
        >
          <Text
            style={[styles.mainBtnIcon, { color: running ? "#fff" : "#000" }]}
          >
            {running ? "⏸" : "▶"}
          </Text>
        </TouchableOpacity>

        {/* Right: placeholder for symmetry */}
        <View style={styles.secondaryBtn}>
          {laps.length > 0 && (
            <Text style={styles.lapCountText}>
              {laps.length}
              {"\n"}
              <Text style={{ fontSize: 10 }}>laps</Text>
            </Text>
          )}
        </View>
      </View>

      {/* Laps table */}
      {laps.length > 0 && (
        <View style={styles.lapsContainer}>
          {/* Header */}
          <View style={styles.lapsHeader}>
            <Text style={[styles.lapCol, styles.lapHeaderText]}>LAP</Text>
            <Text style={[styles.lapColWide, styles.lapHeaderText]}>SPLIT</Text>
            <Text style={[styles.lapColWide, styles.lapHeaderText]}>TOTAL</Text>
            <Text style={[styles.lapColNarrow, styles.lapHeaderText]}>
              DIFF
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.lapsScroll}
          >
            {[...laps].reverse().map((lap, idx) => {
              const isBest =
                bestSplit !== null &&
                lap.splitMs === bestSplit &&
                laps.length > 2;
              const isWorst =
                worstSplit !== null &&
                lap.splitMs === worstSplit &&
                laps.length > 2;
              const prevSplit =
                laps.find((l) => l.id === lap.id - 1)?.splitMs ?? lap.splitMs;
              const diff = lap.splitMs - prevSplit;

              return (
                <View
                  key={lap.id}
                  style={[
                    styles.lapRow,
                    isBest && { backgroundColor: T.emerald + "10" },
                    isWorst && { backgroundColor: T.red + "08" },
                  ]}
                >
                  <View style={styles.lapCol}>
                    <Text style={styles.lapNum}>#{lap.id}</Text>
                    {isBest && (
                      <Text style={[styles.lapBadge, { color: T.emerald }]}>
                        BEST
                      </Text>
                    )}
                    {isWorst && (
                      <Text style={[styles.lapBadge, { color: T.red }]}>
                        SLOW
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.lapColWide,
                      styles.lapSplit,
                      isBest && { color: T.emerald },
                      isWorst && { color: T.red },
                    ]}
                  >
                    {msToStopwatch(lap.splitMs)}
                  </Text>
                  <Text style={[styles.lapColWide, styles.lapTotal]}>
                    {msToStopwatch(lap.totalMs)}
                  </Text>
                  <Text
                    style={[
                      styles.lapColNarrow,
                      styles.lapDiff,
                      {
                        color:
                          diff > 0 ? T.red : diff < 0 ? T.emerald : T.textSub,
                      },
                    ]}
                  >
                    {lap.id === 1
                      ? "—"
                      : `${diff > 0 ? "+" : ""}${(diff / 1000).toFixed(2)}s`}
                  </Text>
                </View>
              );
            })}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg, alignItems: "center" },

  ringSection: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    marginBottom: 28,
  },

  timeDisplay: { alignItems: "center", gap: 0 },
  hoursText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 2,
  },
  mainTime: {
    fontSize: 58,
    fontWeight: "200",
    letterSpacing: -3,
    lineHeight: 60,
  },
  centiseconds: {
    fontSize: 24,
    fontWeight: "400",
    letterSpacing: 2,
    marginTop: -4,
  },
  runningDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 6,
  },

  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginBottom: 28,
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
  secondaryBtnText: { fontSize: 14, fontWeight: "700", color: T.textSub },
  lapCountText: {
    fontSize: 16,
    fontWeight: "700",
    color: T.cyan,
    textAlign: "center",
    lineHeight: 20,
  },

  lapsContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 16,
  },
  lapsHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingBottom: 8,
    marginBottom: 4,
  },
  lapHeaderText: {
    fontSize: 9,
    fontWeight: "800",
    color: T.textDim,
    letterSpacing: 1.2,
    textAlign: "center",
  },
  lapsScroll: { flex: 1 },

  lapRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.border,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  lapCol: { width: 50, alignItems: "center" },
  lapColWide: { flex: 1, textAlign: "center" },
  lapColNarrow: { width: 55, textAlign: "center" },
  lapNum: { fontSize: 13, fontWeight: "700", color: T.textSub },
  lapBadge: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  lapSplit: { fontSize: 13, fontWeight: "600", color: T.text },
  lapTotal: { fontSize: 12, color: T.textSub },
  lapDiff: { fontSize: 11, fontWeight: "600" },
});
