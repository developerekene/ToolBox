import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Tier } from "../../screens/toolbox/MembershipModal";
import { Region } from "../../../../hooks/useLocation";

interface Props {
  tier: Tier;
  price: string;
  tierColor: string;
  region: Region | null;
  regionLoading: boolean;
  onPress: () => void;
}

const PayButton: React.FC<Props> = ({
  tier,
  price,
  tierColor,
  region,
  regionLoading,
  onPress,
}) => {
  return (
    <>
      <View style={s.secureRow}>
        <Ionicons name="lock-closed" size={12} color="#4B5563" />
        <Text style={s.secureText}>
          256-bit SSL encrypted · Secure checkout
        </Text>
      </View>

      <TouchableOpacity
        style={[
          s.payNowBtn,
          { backgroundColor: tierColor },
          regionLoading && { opacity: 0.6 },
        ]}
        onPress={onPress}
        disabled={regionLoading}
        activeOpacity={0.85}
      >
        <Text
          style={[
            s.payNowText,
            { color: tier === "Gold" ? "#1a0e00" : "#fff" },
          ]}
        >
          {regionLoading
            ? "Detecting location..."
            : region === "africa"
              ? `Pay ₦${(parseFloat(price) * 2050).toLocaleString()} / month`
              : `Proceed with £${price} / month`}
        </Text>
      </TouchableOpacity>
    </>
  );
};

const s = StyleSheet.create({
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
  },
  secureText: { color: "#4B5563", fontSize: 11 },
  payNowBtn: { borderRadius: 14, padding: 16, alignItems: "center" },
  payNowText: { fontSize: 16, fontWeight: "700" },
});

export default PayButton;
