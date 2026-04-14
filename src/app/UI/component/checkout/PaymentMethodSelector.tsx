import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

type PaymentMethod = "card" | "paypal";

interface Props {
  paymentMethod: PaymentMethod;
  tierColor: string;
  onSelect: (method: PaymentMethod) => void;
}

const PaymentMethodSelector: React.FC<Props> = ({
  paymentMethod,
  tierColor,
  onSelect,
}) => {
  return (
    <>
      <Text style={s.sectionLabel}>Payment method</Text>
      <View style={s.payMethodRow}>
        <TouchableOpacity
          style={[
            s.payBtn,
            paymentMethod === "card" && {
              borderColor: tierColor,
              borderWidth: 2,
            },
          ]}
          onPress={() => onSelect("card")}
          activeOpacity={0.8}
        >
          <FontAwesome5
            name="credit-card"
            size={20}
            color={paymentMethod === "card" ? tierColor : "#6B7280"}
          />
          <Text
            style={[
              s.payBtnText,
              paymentMethod === "card" && { color: tierColor },
            ]}
          >
            Credit / Debit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.payBtn,
            paymentMethod === "paypal" && {
              borderColor: "#009CDE",
              borderWidth: 2,
            },
          ]}
          onPress={() => onSelect("paypal")}
          activeOpacity={0.8}
        >
          <FontAwesome5
            name="paypal"
            size={20}
            color={paymentMethod === "paypal" ? "#009CDE" : "#6B7280"}
          />
          <Text
            style={[
              s.payBtnText,
              paymentMethod === "paypal" && { color: "#009CDE" },
            ]}
          >
            PayPal
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const s = StyleSheet.create({
  sectionLabel: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  payMethodRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  payBtn: {
    flex: 1,
    backgroundColor: "#1F2937",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    borderColor: "transparent",
  },
  payBtnText: { color: "#6B7280", fontSize: 12, fontWeight: "600" },
});

export default PaymentMethodSelector;
