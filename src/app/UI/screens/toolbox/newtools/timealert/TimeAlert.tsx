import React, { useState } from "react";
import { View, StyleSheet, SafeAreaView, StatusBar } from "react-native";
import { T, Mode } from "../../../../../utils/constant/timealert/theme";
import { TabBar } from "../../newtools/timealert/TimerComponent";
import AlarmScreen from "../../newtools/timealert/AlarmScreen";
import StopwatchScreen from "../../newtools/timealert/StopWatchScreen";
import TimerScreen from "../../newtools/timealert/TimerScreen";

export default function TimeAlert() {
  const [mode, setMode] = useState<Mode>("timer");

  return (
    <View style={styles.root}>
      <TabBar mode={mode} onChange={setMode} />
      <View style={styles.content}>
        {mode === "alarm" && <AlarmScreen />}
        {mode === "stopwatch" && <StopwatchScreen />}
        {mode === "timer" && <TimerScreen />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  content: { flex: 1 },
});
