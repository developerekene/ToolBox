import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

interface Props {
  tierColor: string;
}

const ProcessingScreen: React.FC<Props> = ({ tierColor }) => (
  <View style={s.container}>
    <ActivityIndicator size="large" color={tierColor} />
    <Text style={s.title}>Processing payment...</Text>
    <Text style={s.subtitle}>Please don't close this screen</Text>
  </View>
);

const s = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 20 },
  subtitle: { color: "#6B7280", fontSize: 13, marginTop: 8 },
});

export default ProcessingScreen;
