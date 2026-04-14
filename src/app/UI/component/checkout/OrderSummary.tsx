import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Tier } from "../../screens/toolbox/MembershipModal";
import { Region } from "../../../../hooks/useLocation";

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
  price: string;
  tierColor: string;
  region: Region | null;
  regionLoading: boolean;
}

const OrderSummary: React.FC<Props> = ({
  tier,
  price,
  tierColor,
  region,
  regionLoading,
}) => {
  return (
    <View style={s.summaryCard}>
      <Text style={s.sectionLabel}>Order Summary</Text>
      <View style={s.summaryRow}>
        <View>
          <Text style={s.summaryTierName}>
            <Text style={{ color: tierColor }}>{tier}</Text> Plan
          </Text>
          <Text style={s.summaryBilling}>Billed monthly · Cancel anytime</Text>
        </View>
        <Text style={s.summaryPrice}>
          £{price}
          <Text style={s.summaryPeriod}>/mo</Text>
        </Text>
      </View>

      <View style={s.divider} />

      {TIER_FEATURES[tier].map((f) => (
        <Text key={f} style={s.featureItem}>
          <Text style={{ color: tierColor }}>✓ </Text>
          {f}
        </Text>
      ))}

      <View style={s.divider} />

      <View style={s.summaryRow}>
        <Text style={s.totalLabel}>Total today</Text>
        <Text style={[s.totalPrice, { color: tierColor }]}>
          {region === "africa"
            ? `₦${(parseFloat(price) * 2050).toLocaleString()}`
            : `£${price}`}
        </Text>
      </View>

      {!regionLoading && (
        <View style={s.regionBadge}>
          <Text style={s.regionText}>
            {region === "africa"
              ? "🇳🇬 Paying in Naira via Paystack"
              : "🌍 Paying in GBP"}
          </Text>
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  summaryCard: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryTierName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  summaryBilling: { color: "#4B5563", fontSize: 11 },
  summaryPrice: { color: "#fff", fontSize: 22, fontWeight: "700" },
  summaryPeriod: { color: "#6B7280", fontSize: 13, fontWeight: "400" },
  divider: { height: 1, backgroundColor: "#374151", marginVertical: 12 },
  featureItem: { color: "#9CA3AF", fontSize: 13, marginBottom: 5 },
  totalLabel: { color: "#9CA3AF", fontSize: 14 },
  totalPrice: { fontSize: 22, fontWeight: "700" },
  sectionLabel: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  regionBadge: {
    marginTop: 10,
    backgroundColor: "#0f2027",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  regionText: { color: "#9CA3AF", fontSize: 12 },
});

export default OrderSummary;
