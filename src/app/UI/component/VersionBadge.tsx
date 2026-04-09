import React from "react";
import { View, Text, StyleSheet } from "react-native";

const APP_VERSION = "0.03";

interface VersionBadgeProps {
  version?: string;
}

const VersionBadge: React.FC<VersionBadgeProps> = ({
  version = APP_VERSION,
}) => {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>v{version}</Text>
    </View>
  );
};

export default VersionBadge;

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-end",
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  text: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
