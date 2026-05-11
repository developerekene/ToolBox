import React, { Component } from "react";
import {
  Text,
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";

const { width, height } = Dimensions.get("window");

const GRID_COLS = 8;
const GRID_ROWS = 12;
const CELL_W = width / GRID_COLS;
const CELL_H = height / GRID_ROWS;

interface State {
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  lineAnim: Animated.Value;
  dot1: Animated.Value;
  dot2: Animated.Value;
  dot3: Animated.Value;
  glowAnim: Animated.Value;
}

export class ComingSoon extends Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = {
      fadeAnim: new Animated.Value(0),
      scaleAnim: new Animated.Value(0.88),
      lineAnim: new Animated.Value(0),
      dot1: new Animated.Value(0),
      dot2: new Animated.Value(0),
      dot3: new Animated.Value(0),
      glowAnim: new Animated.Value(0.4),
    };
  }

  componentDidMount() {
    const { fadeAnim, scaleAnim, lineAnim, dot1, dot2, dot3, glowAnim } =
      this.state;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(lineAnim, {
        toValue: 1,
        duration: 1200,
        delay: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    const bounce = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 350,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(800),
        ]),
      );

    bounce(dot1, 0).start();
    bounce(dot2, 180).start();
    bounce(dot3, 360).start();
  }

  renderGrid() {
    const lines = [];
    for (let c = 1; c < GRID_COLS; c++) {
      lines.push(
        <View key={`v${c}`} style={[styles.gridLineV, { left: c * CELL_W }]} />,
      );
    }
    for (let r = 1; r < GRID_ROWS; r++) {
      lines.push(
        <View key={`h${r}`} style={[styles.gridLineH, { top: r * CELL_H }]} />,
      );
    }
    return lines;
  }

  render() {
    const { fadeAnim, scaleAnim, lineAnim, dot1, dot2, dot3, glowAnim } =
      this.state;

    const lineWidth = lineAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    });

    const dotY1 = dot1.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -7],
    });
    const dotY2 = dot2.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -7],
    });
    const dotY3 = dot3.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -7],
    });

    return (
      <View style={styles.root}>
        <View style={StyleSheet.absoluteFill}>{this.renderGrid()}</View>

        <Animated.View style={[styles.glow, { opacity: glowAnim }]} />

        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.heading}>Coming Soon</Text>

          <Animated.View style={[styles.underline, { width: lineWidth }]} />

          <Text style={styles.body}>
            We’re putting the final touches on something exciting.
          </Text>

          <View style={styles.dotsRow}>
            {[dotY1, dotY2, dotY3].map((y, i) => (
              <Animated.View
                key={i}
                style={[styles.dot, { transform: [{ translateY: y }] }]}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>Stay tuned! </Text>
          <View style={styles.footerLine} />
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0A0F",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 80,
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  glow: {},
  content: {
    alignItems: "center",
    paddingHorizontal: 36,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 32,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4A5FFF",
  },
  chipText: {
    fontSize: 11,
    letterSpacing: 3.5,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "600",
  },
  heading: {
    fontSize: 34,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -2.5,
    lineHeight: 70,
    marginBottom: 20,
  },
  underline: {
    height: 2,
    backgroundColor: "#4A5FFF",
    borderRadius: 1,
    alignSelf: "flex-start",
    marginBottom: 28,
  },
  body: {
    fontSize: 15,
    color: "rgba(255,255,255,0.38)",
    textAlign: "center",
    lineHeight: 24,
    letterSpacing: 0.2,
    marginBottom: 44,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#4A5FFF",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 36,
    paddingBottom: 44,
    width: "100%",
  },
  footerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  footerText: {
    fontSize: 10,
    letterSpacing: 3,
    color: "rgba(255,255,255,0.2)",
    fontWeight: "600",
  },
});

export default ComingSoon;
