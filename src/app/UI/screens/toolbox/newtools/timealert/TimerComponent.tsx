import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import {
  T,
  Mode,
  MODE_COLOR,
  pad,
} from "../../../../../utils/constant/timealert/theme";

const { width: W } = Dimensions.get("window");

// ─── TabBar
interface TabBarProps {
  mode: Mode;
  onChange: (m: Mode) => void;
}

const TABS: { key: Mode; icon: string; label: string }[] = [
  { key: "alarm", icon: "⏰", label: "ALARM" },
  { key: "stopwatch", icon: "⏱", label: "STOPWATCH" },
  { key: "timer", icon: "⏲", label: "TIMER" },
];

export function TabBar({ mode, onChange }: TabBarProps) {
  return (
    <View style={tabStyles.bar}>
      {TABS.map((tab) => {
        const active = mode === tab.key;
        const color = MODE_COLOR[tab.key];
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              tabStyles.tab,
              active && { borderBottomColor: color, borderBottomWidth: 2.5 },
            ]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[tabStyles.icon, active && { opacity: 1 }]}>
              {tab.icon}
            </Text>
            <Text style={[tabStyles.label, active && { color }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: T.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
    gap: 4,
  },
  icon: { fontSize: 22, opacity: 0.5 },
  label: {
    fontSize: 9,
    fontWeight: "800",
    color: T.textSub,
    letterSpacing: 1.5,
  },
});

// ─── CircularRing
interface RingProps {
  progress: number; // 0–1
  color: string;
  size?: number;
  thickness?: number;
  children?: React.ReactNode;
}

export function CircularRing({
  progress,
  color,
  size = 260,
  thickness = 6,
  children,
}: RingProps) {
  const p = Math.min(Math.max(progress, 0), 1);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Track */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: thickness,
          borderColor: T.border,
        }}
      />

      {/* Quarter arcs approximation using rotated borders */}
      {[0, 0.25, 0.5, 0.75].map((threshold, i) => {
        const filled = p > threshold;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: thickness,
              borderColor: "transparent",
              borderTopColor: filled ? color : "transparent",
              transform: [{ rotate: `${i * 90}deg` }],
            }}
          />
        );
      })}

      {/* Glow effect */}
      {p > 0 && p < 1 && (
        <View
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: thickness + 2,
            borderColor: "transparent",
            borderTopColor: color + "55",
            transform: [{ rotate: `${p * 360 - 90}deg` }],
          }}
        />
      )}

      {/* Tip dot */}
      {p > 0.02 && p < 0.99 && (
        <View
          style={{
            position: "absolute",
            width: thickness + 6,
            height: thickness + 6,
            borderRadius: (thickness + 6) / 2,
            backgroundColor: color,
            top: thickness / 2 - 3,
            left: size / 2 - (thickness + 6) / 2,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 8,
            elevation: 6,
          }}
        />
      )}

      {children}
    </View>
  );
}

// ─── PulsingRing
export function PulsingRing({
  color,
  active,
}: {
  color: string;
  active: boolean;
}) {
  const scale1 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const opacity2 = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (animRef.current) animRef.current.stop();
    if (!active) {
      scale1.setValue(1);
      opacity1.setValue(0);
      scale2.setValue(1);
      opacity2.setValue(0);
      return;
    }
    animRef.current = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale1, {
              toValue: 1.22,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity1, {
              toValue: 0.3,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale1, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity1, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.sequence([
          Animated.delay(400),
          Animated.parallel([
            Animated.timing(scale2, {
              toValue: 1.35,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity2, {
              toValue: 0.15,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale2, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity2, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
    );
    animRef.current.start();
    return () => animRef.current?.stop();
  }, [active]);

  return (
    <>
      <Animated.View
        style={{
          position: "absolute",
          width: 268,
          height: 268,
          borderRadius: 134,
          borderWidth: 1.5,
          borderColor: color,
          opacity: opacity1,
          transform: [{ scale: scale1 }],
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          width: 268,
          height: 268,
          borderRadius: 134,
          borderWidth: 1,
          borderColor: color,
          opacity: opacity2,
          transform: [{ scale: scale2 }],
        }}
      />
    </>
  );
}

// ─── LiveClock
export function LiveClock({ color }: { color: string }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const h12 = now.getHours() % 12 || 12;
  const ampm = now.getHours() >= 12 ? "PM" : "AM";

  return (
    <View style={clockStyles.wrap}>
      <View style={clockStyles.timeRow}>
        <Text style={[clockStyles.hours, { color }]}>
          {pad(h12)}:{pad(now.getMinutes())}
        </Text>
        <View style={clockStyles.rightCol}>
          <Text style={[clockStyles.ampm, { color: color + "BB" }]}>
            {ampm}
          </Text>
          <Text style={[clockStyles.secs, { color: color + "77" }]}>
            :{pad(now.getSeconds())}
          </Text>
        </View>
      </View>
      <Text style={clockStyles.date}>
        {now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </Text>
    </View>
  );
}

const clockStyles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 20 },
  timeRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  hours: { fontSize: 72, fontWeight: "100", letterSpacing: -4, lineHeight: 78 },
  rightCol: { paddingBottom: 10, gap: 2 },
  ampm: { fontSize: 18, fontWeight: "700", letterSpacing: 1 },
  secs: { fontSize: 18, fontWeight: "300", letterSpacing: 1 },
  date: { fontSize: 13, color: T.textSub, marginTop: 4, letterSpacing: 0.5 },
});

interface ControlBtnProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  color?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function ControlBtn({
  label,
  onPress,
  variant = "secondary",
  color = T.cyan,
  size = "md",
  disabled = false,
}: ControlBtnProps) {
  const dim = size === "lg" ? 88 : size === "md" ? 74 : 60;
  const fontSize = size === "lg" ? 28 : size === "md" ? 22 : 18;

  const bg =
    variant === "primary" ? color : variant === "danger" ? T.red : T.bgElevated;

  const textColor =
    variant === "primary" ? "#000" : variant === "danger" ? "#fff" : T.textSub;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        ctrlStyles.btn,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: bg,
          borderColor: variant === "secondary" ? T.border : "transparent",
          opacity: disabled ? 0.4 : 1,
          shadowColor:
            variant === "primary"
              ? color
              : variant === "danger"
                ? T.red
                : "transparent",
        },
      ]}
    >
      <Text style={[ctrlStyles.label, { fontSize, color: textColor }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const ctrlStyles = StyleSheet.create({
  btn: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  label: { fontWeight: "400", lineHeight: 32, textAlign: "center" },
});
