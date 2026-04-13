import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import VersionBadge from "../../../component/VersionBadge";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", label: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", label: "British Pound", flag: "🇬🇧" },
  {
    code: "JPY",
    symbol: "¥",
    label: "Japanese Yen",
    flag: "🇯🇵",
    noDecimals: true,
  },
  { code: "CNY", symbol: "¥", label: "Chinese Yuan", flag: "🇨🇳" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar", flag: "🇨🇦" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar", flag: "🇦🇺" },
  { code: "CHF", symbol: "Fr", label: "Swiss Franc", flag: "🇨🇭" },
  { code: "INR", symbol: "₹", label: "Indian Rupee", flag: "🇮🇳" },
  { code: "BRL", symbol: "R$", label: "Brazilian Real", flag: "🇧🇷" },
  { code: "MXN", symbol: "MX$", label: "Mexican Peso", flag: "🇲🇽" },
  { code: "NGN", symbol: "₦", label: "Nigerian Naira", flag: "🇳🇬" },
  { code: "ZAR", symbol: "R", label: "South African Rand", flag: "🇿🇦" },
  {
    code: "KRW",
    symbol: "₩",
    label: "South Korean Won",
    flag: "🇰🇷",
    noDecimals: true,
  },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar", flag: "🇸🇬" },
  { code: "HKD", symbol: "HK$", label: "Hong Kong Dollar", flag: "🇭🇰" },
  { code: "NOK", symbol: "kr", label: "Norwegian Krone", flag: "🇳🇴" },
  { code: "SEK", symbol: "kr", label: "Swedish Krona", flag: "🇸🇪" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham", flag: "🇦🇪" },
  { code: "SAR", symbol: "﷼", label: "Saudi Riyal", flag: "🇸🇦" },
  { code: "TRY", symbol: "₺", label: "Turkish Lira", flag: "🇹🇷" },
  { code: "THB", symbol: "฿", label: "Thai Baht", flag: "🇹🇭" },
  {
    code: "IDR",
    symbol: "Rp",
    label: "Indonesian Rupiah",
    flag: "🇮🇩",
    noDecimals: true,
  },
  { code: "PHP", symbol: "₱", label: "Philippine Peso", flag: "🇵🇭" },
  { code: "MYR", symbol: "RM", label: "Malaysian Ringgit", flag: "🇲🇾" },
  { code: "NZD", symbol: "NZ$", label: "New Zealand Dollar", flag: "🇳🇿" },
  { code: "ILS", symbol: "₪", label: "Israeli Shekel", flag: "🇮🇱" },
  { code: "PLN", symbol: "zł", label: "Polish Złoty", flag: "🇵🇱" },
];

const PRESET_TIPS = [10, 15, 20, 25];

export default function TipCalculator() {
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [bill, setBill] = useState("");
  const [tipPercent, setTipPercent] = useState<number>(15);
  const [customTip, setCustomTip] = useState("");
  const [split, setSplit] = useState(1);

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
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <VersionBadge version="0.03" />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Tip Calculator</Text>
        <Text style={styles.subheaderText}>Split bills with ease</Text>
      </View>

      {/* Currency Selector */}
      <View style={styles.section}>
        <Text style={styles.label}>Currency</Text>
        <TouchableOpacity
          style={styles.currencySelector}
          onPress={() => setShowCurrencyModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.currencyFlag}>{currency.flag}</Text>
          <View style={styles.currencySelectorInfo}>
            <Text style={styles.currencyCode}>{currency.code}</Text>
            <Text style={styles.currencyLabel}>{currency.label}</Text>
          </View>
          <View style={styles.currencySelectorRight}>
            <Text style={styles.currencySymbolPreview}>{currency.symbol}</Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Currency Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCurrencyModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {CURRENCIES.map((cur, index) => {
                const isSelected = cur.code === currency.code;
                return (
                  <TouchableOpacity
                    key={cur.code}
                    style={[
                      styles.modalItem,
                      isSelected && styles.modalItemActive,
                      index === CURRENCIES.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                    onPress={() => {
                      setCurrency(cur);
                      setShowCurrencyModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalItemFlag}>{cur.flag}</Text>
                    <View style={styles.modalItemInfo}>
                      <Text
                        style={[
                          styles.modalItemCode,
                          isSelected && styles.modalItemCodeActive,
                        ]}
                      >
                        {cur.code}
                      </Text>
                      <Text style={styles.modalItemLabel}>{cur.label}</Text>
                    </View>
                    <Text
                      style={[
                        styles.modalItemSymbol,
                        isSelected && styles.modalItemSymbolActive,
                      ]}
                    >
                      {cur.symbol}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#3B82F6"
                        style={{ marginLeft: 8 }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bill Amount */}
      <View style={styles.section}>
        <Text style={styles.label}>Bill Amount</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputCurrencySymbol}>{currency.symbol}</Text>
          <TextInput
            style={styles.priceInput}
            keyboardType="decimal-pad"
            value={bill}
            onChangeText={setBill}
            placeholder="0.00"
            placeholderTextColor="#475569"
          />
        </View>
      </View>

      {/* Tip Presets */}
      <View style={styles.section}>
        <Text style={styles.label}>Tip Percentage</Text>
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
        <View style={styles.inputWrapper}>
          <Ionicons
            name="pencil-outline"
            size={18}
            color="#64748B"
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.fieldInput}
            keyboardType="decimal-pad"
            value={customTip}
            onChangeText={(val) => {
              setCustomTip(val);
              if (val !== "") setTipPercent(parseFloat(val) || 0);
            }}
            placeholder="Custom tip"
            placeholderTextColor="#475569"
          />
          <Text style={styles.unitSuffix}>%</Text>
        </View>
      </View>

      {/* Split */}
      <View style={styles.section}>
        <Text style={styles.label}>Split Between</Text>
        <View style={styles.splitRow}>
          <TouchableOpacity
            style={styles.splitBtn}
            onPress={() => setSplit(Math.max(1, split - 1))}
            activeOpacity={0.7}
          >
            <Text style={styles.splitBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.splitCountWrap}>
            <Text style={styles.splitCount}>{split}</Text>
            <Text style={styles.splitLabel}>
              {split === 1 ? "person" : "people"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.splitBtn}
            onPress={() => setSplit(split + 1)}
            activeOpacity={0.7}
          >
            <Text style={styles.splitBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      <View style={styles.resultCard}>
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
          <Text style={[styles.resultValue, { color: "#3B82F6" }]}>
            {billAmount ? fmt(tipAmount) : "—"}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.resultRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <View style={styles.totalRight}>
            <Text style={styles.totalValue}>
              {billAmount ? fmt(total) : "—"}
            </Text>
            {perPerson !== null && billAmount > 0 && (
              <Text style={styles.perPerson}>{fmt(perPerson)} per person</Text>
            )}
          </View>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Select a tip preset or enter a custom percentage. Use the split
            controls to divide the total among multiple people.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101828",
  },
  contentContainer: {
    padding: 20,
    paddingTop: Platform.OS === "android" ? 40 : 60,
    paddingBottom: 40,
  },

  header: { marginBottom: 24 },
  headerText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subheaderText: {
    fontSize: 16,
    color: "#CBD5E1",
    textAlign: "center",
  },

  section: { marginBottom: 22 },
  label: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },

  // ── Currency Selector ──
  currencySelector: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  currencyFlag: { fontSize: 24 },
  currencySelectorInfo: { flex: 1 },
  currencyCode: { color: "#fff", fontSize: 16, fontWeight: "700" },
  currencyLabel: { color: "#64748B", fontSize: 12, marginTop: 2 },
  currencySelectorRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  currencySymbolPreview: { color: "#3B82F6", fontSize: 18, fontWeight: "700" },

  // ── Currency Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000099",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: "100%",
    maxHeight: "75%",
    backgroundColor: "#1E293B",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  modalTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    gap: 12,
  },
  modalItemActive: { backgroundColor: "#3B82F612" },
  modalItemFlag: { fontSize: 22 },
  modalItemInfo: { flex: 1 },
  modalItemCode: { color: "#E2E8F0", fontSize: 15, fontWeight: "700" },
  modalItemCodeActive: { color: "#3B82F6" },
  modalItemLabel: { color: "#64748B", fontSize: 12, marginTop: 2 },
  modalItemSymbol: { color: "#475569", fontSize: 16, fontWeight: "600" },
  modalItemSymbolActive: { color: "#3B82F6" },

  // ── Inputs ──
  inputWrapper: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  inputCurrencySymbol: {
    color: "#3B82F6",
    fontSize: 22,
    fontWeight: "700",
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
    paddingVertical: 14,
  },
  fieldInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 14,
  },
  unitSuffix: { color: "#64748B", fontSize: 15, fontWeight: "600" },

  // ── Tip Presets ──
  tipGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  tipBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
  },
  tipBtnActive: {
    backgroundColor: "#1D4ED8",
    borderColor: "#3B82F6",
  },
  tipBtnText: { color: "#94A3B8", fontSize: 15, fontWeight: "600" },
  tipBtnTextActive: { color: "#DBEAFE", fontWeight: "700" },

  // ── Split ──
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  splitBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  splitBtnText: { fontSize: 22, color: "#E2E8F0", lineHeight: 26 },
  splitCountWrap: { flex: 1, alignItems: "center" },
  splitCount: { fontSize: 28, fontWeight: "700", color: "#fff" },
  splitLabel: { fontSize: 13, color: "#64748B", marginTop: 2 },

  // ── Results ──
  resultCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 20,
    gap: 12,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultLabel: { color: "#94A3B8", fontSize: 15 },
  resultValue: { color: "#E2E8F0", fontSize: 15, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#334155" },
  totalLabel: { color: "#fff", fontSize: 16, fontWeight: "700" },
  totalRight: { alignItems: "flex-end" },
  totalValue: { fontSize: 28, fontWeight: "800", color: "#3B82F6" },
  perPerson: { fontSize: 13, color: "#64748B", marginTop: 4 },

  // ── Info ──
  infoCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoText: { flex: 1, color: "#CBD5E1", fontSize: 14, lineHeight: 20 },
});
