import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { Tier } from "../../screens/toolbox/MembershipModal";

const TIER_FEATURES: Record<Tier, string[]> = {
  Silver: [
    "Crop Tool, Word Counter",
    "Scientific & BMI Calculator",
    "Unit & Tip Calculator",
    "QR Code Generator",
  ],
  Gold: [
    "Everything in Silver",
    "PDF Scanner & QR Scanner",
    "Image Compress & Translator",
    "Loan & Discount Calculator",
  ],
  Platinum: [
    "Everything in Gold",
    "Video Trim, Audio Rec, Zip Creator",
    "Notes Pro, Encoder / Decoder",
    "Currency, Investment & Mortgage Calc",
  ],
};

interface Props {
  tier: Tier;
  tierColor: string;
  onDone: () => void;
}

const SuccessScreen: React.FC<Props> = ({ tier, tierColor, onDone }) => (
  <ScrollView
    showsVerticalScrollIndicator={false}
    contentContainerStyle={s.container}
  >
    <View style={[s.ringOuter, { borderColor: tierColor + "33" }]}>
      <View style={[s.ringInner, { borderColor: tierColor + "66" }]}>
        <View
          style={[
            s.iconCircle,
            { backgroundColor: tierColor + "22", borderColor: tierColor },
          ]}
        >
          <Ionicons name="checkmark" size={48} color={tierColor} />
        </View>
      </View>
    </View>

    <View
      style={[
        s.tierBadge,
        { backgroundColor: tierColor + "22", borderColor: tierColor + "55" },
      ]}
    >
      <FontAwesome5
        name={
          tier === "Gold" ? "crown" : tier === "Platinum" ? "gem" : "shield-alt"
        }
        size={12}
        color={tierColor}
      />
      <Text style={[s.tierBadgeText, { color: tierColor }]}>{tier} Member</Text>
    </View>

    <Text style={s.title}>You're all set!</Text>
    <Text style={s.subtitle}>
      Welcome to{" "}
      <Text style={{ color: tierColor, fontWeight: "700" }}>{tier}</Text>.{"\n"}
      Your tools are now ready to use.
    </Text>

    <View style={[s.unlockedCard, { borderColor: tierColor + "33" }]}>
      <Text style={[s.unlockedLabel, { color: tierColor }]}>
        ✦ Unlocked with {tier}
      </Text>
      {TIER_FEATURES[tier].map((f) => (
        <View key={f} style={s.unlockedRow}>
          <View style={[s.dot, { backgroundColor: tierColor }]} />
          <Text style={s.unlockedText}>{f}</Text>
        </View>
      ))}
    </View>

    <TouchableOpacity
      style={[s.doneBtn, { backgroundColor: tierColor }]}
      onPress={onDone}
      activeOpacity={0.85}
    >
      <Text
        style={[s.doneBtnText, { color: tier === "Gold" ? "#1a0e00" : "#fff" }]}
      >
        Start using {tier} tools
      </Text>
      <Ionicons
        name="arrow-forward"
        size={18}
        color={tier === "Gold" ? "#1a0e00" : "#fff"}
        style={{ marginLeft: 8 }}
      />
    </TouchableOpacity>

    <Text style={s.note}>A receipt has been sent to your email</Text>
  </ScrollView>
);

const s = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 8,
  },
  ringOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  ringInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "700", marginBottom: 10 },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  unlockedCard: {
    width: "100%",
    backgroundColor: "#1F2937",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  unlockedLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  unlockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  unlockedText: { color: "#9CA3AF", fontSize: 13 },
  doneBtn: {
    width: "100%",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  doneBtnText: { fontSize: 16, fontWeight: "700" },
  note: { color: "#4B5563", fontSize: 12 },
});

export default SuccessScreen;
