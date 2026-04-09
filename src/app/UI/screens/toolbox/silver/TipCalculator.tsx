import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import VersionBadge from "../../../component/VersionBadge";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "$ USD" },
  { code: "EUR", symbol: "€", label: "€ EUR" },
  { code: "GBP", symbol: "£", label: "£ GBP" },
  { code: "JPY", symbol: "¥", label: "¥ JPY", noDecimals: true },
  { code: "CNY", symbol: "¥", label: "¥ CNY" },
  { code: "CAD", symbol: "$", label: "$ CAD" },
  { code: "AUD", symbol: "$", label: "$ AUD" },
  { code: "CHF", symbol: "Fr", label: "Fr CHF" },
  { code: "INR", symbol: "₹", label: "₹ INR" },
  { code: "BRL", symbol: "R$", label: "R$ BRL" },
  { code: "MXN", symbol: "$", label: "$ MXN" },
  { code: "NGN", symbol: "₦", label: "₦ NGN" },
  { code: "ZAR", symbol: "R", label: "R ZAR" },
  { code: "KRW", symbol: "₩", label: "₩ KRW", noDecimals: true },
  { code: "SGD", symbol: "$", label: "$ SGD" },
  { code: "HKD", symbol: "$", label: "$ HKD" },
  { code: "NOK", symbol: "kr", label: "kr NOK" },
  { code: "SEK", symbol: "kr", label: "kr SEK" },
  { code: "AED", symbol: "د.إ", label: "د.إ AED" },
  { code: "SAR", symbol: "﷼", label: "﷼ SAR" },
  { code: "TRY", symbol: "₺", label: "₺ TRY" },
  { code: "THB", symbol: "฿", label: "฿ THB" },
  { code: "IDR", symbol: "Rp", label: "Rp IDR", noDecimals: true },
  { code: "PHP", symbol: "₱", label: "₱ PHP" },
  { code: "MYR", symbol: "RM", label: "RM MYR" },
  { code: "NZD", symbol: "$", label: "$ NZD" },
  { code: "ILS", symbol: "₪", label: "₪ ILS" },
  { code: "PLN", symbol: "zł", label: "zł PLN" },
];

const PRESET_TIPS = [10, 15, 20, 25];

export default function App() {
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [bill, setBill] = useState("");
  const [tipPercent, setTipPercent] = useState<number>(15);
  const [customTip, setCustomTip] = useState("");
  const [split, setSplit] = useState(1);

  const currency = CURRENCIES.find((c) => c.code === currencyCode)!;
  const billAmount = parseFloat(bill) || 0;
  const activeTip = customTip !== "" ? parseFloat(customTip) || 0 : tipPercent;
  const tipAmount = (billAmount * activeTip) / 100;
  const total = billAmount + tipAmount;
  const perPerson = split > 1 ? total / split : null;

  const fmt = (n: number) => {
    const decimals = currency.noDecimals ? 0 : 2;
    return (
      currency.symbol +
      n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    );
  };

  const handlePresetTip = (pct: number) => {
    setTipPercent(pct);
    setCustomTip("");
  };

  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <VersionBadge version="0.03" />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tip Calculator</Text>

        {/* Currency + Bill Row */}
        {/* TODO  change currency bg and text colors */}
        <View style={styles.field}>
          <Text style={styles.label}>Bill amount</Text>
          <View style={styles.billRow}>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={currencyCode}
                onValueChange={(val) => setCurrencyCode(val)}
                style={styles.picker}
                dropdownIconColor={COLORS.text}
              >
                {CURRENCIES.map((c) => (
                  <Picker.Item key={c.code} label={c.label} value={c.code} />
                ))}
              </Picker>
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.currencySymbol}>{currency.symbol}</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={bill}
                onChangeText={setBill}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </View>

        {/* Tip Presets */}
        <View style={styles.field}>
          <Text style={styles.label}>Tip percentage</Text>
          <View style={styles.tipGrid}>
            {PRESET_TIPS.map((pct) => {
              const isActive = customTip === "" && tipPercent === pct;
              return (
                <TouchableOpacity
                  key={pct}
                  style={[styles.tipBtn, isActive && styles.tipBtnActive]}
                  onPress={() => handlePresetTip(pct)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.tipBtnText,
                      isActive && styles.tipBtnTextActive,
                    ]}
                  >
                    {pct}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.customWrap}>
            <TextInput
              style={styles.customInput}
              keyboardType="decimal-pad"
              value={customTip}
              onChangeText={(val) => {
                setCustomTip(val);
                if (val !== "") setTipPercent(parseFloat(val) || 0);
              }}
              placeholder="Custom"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.pctLabel}>%</Text>
          </View>
        </View>

        {/* Split */}
        <View style={styles.field}>
          <Text style={styles.label}>Split between</Text>
          <View style={styles.splitRow}>
            <TouchableOpacity
              style={styles.splitBtn}
              onPress={() => setSplit(Math.max(1, split - 1))}
            >
              <Text style={styles.splitBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.splitCount}>{split}</Text>
            <TouchableOpacity
              style={styles.splitBtn}
              onPress={() => setSplit(split + 1)}
            >
              <Text style={styles.splitBtnText}>+</Text>
            </TouchableOpacity>
            <Text style={styles.splitLabel}>
              {split === 1 ? "person" : "people"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Results */}
        <View style={styles.results}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Subtotal</Text>
            <Text style={styles.resultValue}>
              {billAmount ? fmt(billAmount) : "—"}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>
              Tip ({activeTip.toFixed(activeTip % 1 === 0 ? 0 : 1)}%)
            </Text>
            <Text style={styles.resultValue}>
              {billAmount ? fmt(tipAmount) : "—"}
            </Text>
          </View>
          <View style={[styles.resultRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <View style={styles.totalRight}>
              <Text style={styles.totalValue}>
                {billAmount ? fmt(total) : "—"}
              </Text>
              {perPerson !== null && billAmount > 0 && (
                <Text style={styles.perPerson}>
                  {fmt(perPerson)} per person
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const COLORS = {
  bg: "#0F172A",
  surface: "#1E293B",
  border: "#334155",
  borderActive: "#60A5FA",
  text: "#F1F5F9",
  muted: "#94A3B8",
  accent: "#3B82F6", // vibrant blue
  accentBg: "#1D4ED8",
  accentText: "#DBEAFE",
};

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: "black",
    padding: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 24,
  },
  field: { marginBottom: 20 },
  label: { fontSize: 13, color: COLORS.text, marginBottom: 8 },
  billRow: { flexDirection: "row", gap: 8, alignItems: "stretch" },
  pickerWrap: {
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    overflow: "hidden",
    minWidth: 110,
  },
  picker: { color: COLORS.text, fontSize: 14 },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
  },
  currencySymbol: { fontSize: 16, color: COLORS.muted, marginRight: 4 },
  input: { flex: 1, fontSize: 16, color: COLORS.text, paddingVertical: 10 },
  tipGrid: { flexDirection: "row", gap: 8, marginBottom: 8 },
  tipBtn: {
    flex: 1,
    paddingVertical: 9,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: COLORS.bg,
  },
  tipBtnActive: {
    backgroundColor: COLORS.accentBg,
    borderColor: COLORS.borderActive,
  },
  tipBtnText: { fontSize: 14, color: COLORS.muted },
  tipBtnTextActive: { fontWeight: "500", color: COLORS.accentText },
  customWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bg,
  },
  customInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 9,
  },
  pctLabel: { fontSize: 13, color: COLORS.muted },
  splitRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  splitBtn: {
    width: 32,
    height: 32,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg,
  },
  splitBtnText: { fontSize: 18, color: COLORS.muted, lineHeight: 22 },
  splitCount: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
    minWidth: 20,
    textAlign: "center",
  },
  splitLabel: { fontSize: 14, color: COLORS.muted },
  divider: {
    height: 0.5,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },
  results: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 16,
    gap: 12,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultLabel: { fontSize: 14, color: COLORS.muted },
  resultValue: { fontSize: 15, fontWeight: "500", color: COLORS.text },
  totalRow: {
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  totalLabel: { fontSize: 15, fontWeight: "500", color: COLORS.text },
  totalRight: { alignItems: "flex-end" },
  totalValue: { fontSize: 22, fontWeight: "500", color: COLORS.accent },
  perPerson: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
});

// import React, { useState } from "react";
// import { View, Text, TextInput, Button, StyleSheet } from "react-native";

// export default function App() {
//   const [bill, setBill] = useState("");
//   const [tipPercent, setTipPercent] = useState(15);
//   const [tip, setTip] = useState(0);
//   const [total, setTotal] = useState(0);

//   const calculateTip = () => {
//     const billAmount = parseFloat(bill);
//     if (isNaN(billAmount)) {
//       setTip(0);
//       setTotal(0);
//       return;
//     }

//     const tipAmount = (billAmount * tipPercent) / 100;
//     setTip(tipAmount);
//     setTotal(billAmount + tipAmount);
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Tip Calculator</Text>

//       <Text>Bill Amount ($):</Text>
//       <TextInput
//         style={styles.input}
//         keyboardType="numeric"
//         value={bill}
//         onChangeText={setBill}
//         placeholder="Enter bill amount"
//       />

//       <Text>Tip Percentage: {tipPercent}%</Text>
//       <View style={styles.buttonRow}>
//         <Button title="10%" onPress={() => setTipPercent(10)} />
//         <Button title="15%" onPress={() => setTipPercent(15)} />
//         <Button title="20%" onPress={() => setTipPercent(20)} />
//       </View>

//       <Button title="Calculate Tip" onPress={calculateTip} />

//       <Text style={styles.result}>Tip: ${tip.toFixed(2)}</Text>
//       <Text style={styles.result}>Total: ${total.toFixed(2)}</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     justifyContent: "center",
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 20,
//     textAlign: "center",
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     padding: 10,
//     marginVertical: 10,
//     borderRadius: 5,
//   },
//   buttonRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginVertical: 10,
//   },
//   result: {
//     fontSize: 18,
//     marginTop: 10,
//   },
// });
