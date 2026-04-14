import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  value: string;
  error?: string;
  paymentMethod: "card" | "paypal";
  onChange: (val: string) => void;
  onSwitchToCard: () => void;
}

const EmailInput: React.FC<Props> = ({
  value,
  error,
  paymentMethod,
  onChange,
  onSwitchToCard,
}) => {
  if (paymentMethod === "paypal") {
    return (
      <View style={s.paypalDisabledBox}>
        <Ionicons name="time-outline" size={32} color="#4B5563" />
        <Text style={s.paypalDisabledTitle}>PayPal not active yet</Text>
        <Text style={s.paypalDisabledText}>
          Coming soon. Please use Credit / Debit card to complete your purchase.
        </Text>
        <TouchableOpacity onPress={onSwitchToCard} style={s.switchToCardBtn}>
          <Text style={s.switchToCardText}>Switch to Card</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.cardForm}>
      <View style={s.inputGroup}>
        <Text style={s.inputLabel}>Email</Text>
        <TextInput
          style={[s.input, error && s.inputError]}
          placeholder="Enter your email address"
          placeholderTextColor="#4B5563"
          value={value}
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={onChange}
        />
        {error && <Text style={s.errorText}>{error}</Text>}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  cardForm: { marginBottom: 4 },
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1F2937",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: "#374151",
  },
  inputError: { borderColor: "#EF4444" },
  errorText: { color: "#EF4444", fontSize: 11, marginTop: 4 },
  paypalDisabledBox: {
    backgroundColor: "#1F2937",
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#374151",
    borderStyle: "dashed",
  },
  paypalDisabledTitle: { color: "#9CA3AF", fontSize: 15, fontWeight: "700" },
  paypalDisabledText: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  switchToCardBtn: {
    marginTop: 6,
    backgroundColor: "#374151",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  switchToCardText: { color: "#D1D5DB", fontSize: 13, fontWeight: "600" },
});

export default EmailInput;
