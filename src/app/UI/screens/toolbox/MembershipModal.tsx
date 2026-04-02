import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

export type Tier = "Silver" | "Gold" | "Platinum";

interface Props {
  visible: boolean;
  currentTier: Tier;
  onClose: () => void;
  onUpgrade: (tier: Tier) => void;
}

const PLANS: {
  tier: Tier;
  price: string;
  period: string;
  color: string;
  bg: string;
  badge?: string;
  features: string[];
}[] = [
  {
    tier: "Silver",
    price: "Free",
    period: "/ forever",
    color: "#94A3B8",
    bg: "#1E2A3A",
    features: [
      "Crop Tool, Word Counter, Translator",
      "Scientific & BMI Calculator",
      "Unit & Tip Calculator",
      "QR Code Generator",
    ],
  },
  {
    tier: "Gold",
    price: "$4.99",
    period: "/ mo",
    color: "#F59E0B",
    bg: "#1E2A1A",
    badge: "Popular",
    features: [
      "Everything in Silver",
      "PDF Scanner & QR Scanner",
      "Image Compress",
      "Loan & Discount Calculator",
    ],
  },
  {
    tier: "Platinum",
    price: "$9.99",
    period: "/ mo",
    color: "#A78BFA",
    bg: "#1A1A2E",
    badge: "Best value",
    features: [
      "Everything in Gold",
      "Video Trim, Audio Rec, Zip Creator",
      "Notes Pro, Encoder / Decoder",
      "Currency, Investment & Mortgage Calc",
    ],
  },
];

const MembershipModal: React.FC<Props> = ({
  visible,
  currentTier,
  onClose,
  onUpgrade,
}) => {
  const [selected, setSelected] = useState<Tier>(currentTier);

  const ctaColor = () => {
    if (selected === "Gold") return "#F59E0B";
    if (selected === "Platinum") return "#7C3AED";
    return "#334155";
  };

  const ctaTextColor = selected === "Gold" ? "#1a0e00" : "#fff";

  const ctaLabel =
    selected === currentTier
      ? `Continue with ${selected}`
      : `Upgrade to ${selected}`;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>Choose your plan</Text>
          <Text style={s.subtitle}>Unlock more tools as you upgrade</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {PLANS.map(
              ({ tier, price, period, color, bg, badge, features }) => {
                const isSelected = selected === tier;
                const isCurrent = currentTier === tier;

                return (
                  <TouchableOpacity
                    key={tier}
                    style={[
                      s.card,
                      { backgroundColor: bg },
                      isSelected && { borderColor: color, borderWidth: 2 },
                    ]}
                    onPress={() => setSelected(tier)}
                    activeOpacity={0.85}
                  >
                    {isCurrent && (
                      <View style={[s.currentBadge, { borderColor: color }]}>
                        <Text style={[s.currentBadgeText, { color }]}>
                          Current
                        </Text>
                      </View>
                    )}

                    <View style={s.cardHeader}>
                      <View style={s.cardHeaderLeft}>
                        <Text style={[s.tierName, { color }]}>{tier}</Text>
                        {badge && (
                          <View
                            style={[s.badge, { backgroundColor: color + "22" }]}
                          >
                            <Text style={[s.badgeText, { color }]}>
                              {badge}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.price}>
                        {price} <Text style={s.period}>{period}</Text>
                      </Text>
                    </View>

                    {features.map((f) => (
                      <Text key={f} style={s.feature}>
                        <Text style={{ color }}>✓ </Text>
                        {f}
                      </Text>
                    ))}
                  </TouchableOpacity>
                );
              },
            )}
          </ScrollView>

          <TouchableOpacity
            style={[s.cta, { backgroundColor: ctaColor() }]}
            onPress={() => {
              onUpgrade(selected);
              onClose();
            }}
          >
            <Text style={[s.ctaText, { color: ctaTextColor }]}>{ctaLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={s.dismissBtn}>
            <Text style={s.dismissText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#101828",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#374151",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 13,
    marginBottom: 20,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  currentBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tierName: {
    fontSize: 16,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  price: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  period: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "400",
  },
  feature: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 4,
  },
  cta: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
  },
  dismissBtn: {
    marginTop: 12,
    alignItems: "center",
  },
  dismissText: {
    color: "#6B7280",
    fontSize: 13,
  },
});

export default MembershipModal;
