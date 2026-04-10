import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import VersionBadge from "../../../component/VersionBadge";

type DiscountMode = "percentage" | "fixed";

interface Currency {
  code: string;
  symbol: string;
  label: string;
  flag: string;
}

const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", label: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", label: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", label: "British Pound", flag: "🇬🇧" },
  { code: "NGN", symbol: "₦", label: "Nigerian Naira", flag: "🇳🇬" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar", flag: "🇨🇦" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar", flag: "🇦🇺" },
];

const PRESET_DISCOUNTS = [5, 10, 15, 20, 25, 30, 40, 50];

const DiscountCalc: React.FC = () => {
  const [currency, setCurrency] = useState<Currency>(CURRENCIES[0]);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  const [originalPrice, setOriginalPrice] = useState("");
  const [discountMode, setDiscountMode] = useState<DiscountMode>("percentage");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customDiscount, setCustomDiscount] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [result, setResult] = useState<{
    discountAmount: number;
    finalPrice: number;
    savings: number;
    taxAmount: number;
    totalWithTax: number;
  } | null>(null);

  const discountValue =
    customDiscount !== ""
      ? parseFloat(customDiscount)
      : selectedPreset !== null
        ? selectedPreset
        : 0;

  const price = parseFloat(originalPrice) || 0;
  const tax = parseFloat(taxRate) || 0;
  const isFormValid = originalPrice.trim() !== "" && discountValue > 0;

  const sym = currency.symbol;

  const fmt = (val: number) =>
    val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const calculate = () => {
    if (!isFormValid) return;

    let discountAmount = 0;
    if (discountMode === "percentage") {
      discountAmount = (price * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }

    const finalPrice = Math.max(price - discountAmount, 0);
    const taxAmount = (finalPrice * tax) / 100;
    const totalWithTax = finalPrice + taxAmount;
    const savings = price - finalPrice;

    setResult({ discountAmount, finalPrice, savings, taxAmount, totalWithTax });
  };

  const clearAll = () => {
    setOriginalPrice("");
    setSelectedPreset(null);
    setCustomDiscount("");
    setTaxRate("");
    setResult(null);
  };

  const handlePreset = (val: number) => {
    setSelectedPreset(val);
    setCustomDiscount("");
    setResult(null);
  };

  const handleCustomDiscount = (val: string) => {
    setCustomDiscount(val);
    setSelectedPreset(null);
    setResult(null);
  };

  const savingsPercent =
    price > 0 && result ? ((result.savings / price) * 100).toFixed(1) : "0";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View>
        <VersionBadge version="0.03" />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Discount Calculator</Text>
        <Text style={styles.subheaderText}>Find out how much you save</Text>
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

            {CURRENCIES.map((cur, index) => {
              const isSelected = cur.code === currency.code;
              return (
                <TouchableOpacity
                  key={cur.code}
                  style={[
                    styles.modalItem,
                    isSelected && styles.modalItemActive,
                    index === CURRENCIES.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => {
                    setCurrency(cur);
                    setShowCurrencyModal(false);
                    setResult(null);
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
                      color="#10B981"
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Original Price */}
      <View style={styles.section}>
        <Text style={styles.label}>Original Price</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.currencySymbol}>{sym}</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="0.00"
            placeholderTextColor="#64748B"
            value={originalPrice}
            onChangeText={(v) => {
              setOriginalPrice(v);
              setResult(null);
            }}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Discount Mode Toggle */}
      <View style={styles.section}>
        <Text style={styles.label}>Discount Type</Text>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              discountMode === "percentage" && styles.modeButtonActive,
            ]}
            onPress={() => {
              setDiscountMode("percentage");
              setCustomDiscount("");
              setSelectedPreset(null);
              setResult(null);
            }}
          >
            <Ionicons
              name="pricetag-outline"
              size={16}
              color={discountMode === "percentage" ? "#fff" : "#64748B"}
            />
            <Text
              style={[
                styles.modeText,
                discountMode === "percentage" && styles.modeTextActive,
              ]}
            >
              Percentage (%)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              discountMode === "fixed" && styles.modeButtonActive,
            ]}
            onPress={() => {
              setDiscountMode("fixed");
              setCustomDiscount("");
              setSelectedPreset(null);
              setResult(null);
            }}
          >
            <Ionicons
              name="cash-outline"
              size={16}
              color={discountMode === "fixed" ? "#fff" : "#64748B"}
            />
            <Text
              style={[
                styles.modeText,
                discountMode === "fixed" && styles.modeTextActive,
              ]}
            >
              Fixed Amount ({sym})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Discount Value */}
      <View style={styles.section}>
        <Text style={styles.label}>
          {discountMode === "percentage"
            ? "Discount Percentage"
            : "Discount Amount"}
        </Text>

        {discountMode === "percentage" && (
          <View style={styles.presetGrid}>
            {PRESET_DISCOUNTS.map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.presetButton,
                  selectedPreset === val && styles.presetButtonActive,
                ]}
                onPress={() => handlePreset(val)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.presetText,
                    selectedPreset === val && styles.presetTextActive,
                  ]}
                >
                  {val}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.inputWrapper}>
          {discountMode === "fixed" && (
            <Text style={styles.currencySymbol}>{sym}</Text>
          )}
          <TextInput
            style={styles.discountInput}
            placeholder={
              discountMode === "percentage" ? "Custom %" : "Enter amount"
            }
            placeholderTextColor="#64748B"
            value={customDiscount}
            onChangeText={handleCustomDiscount}
            keyboardType="decimal-pad"
          />
          {discountMode === "percentage" && (
            <Text style={styles.discountSymbol}>%</Text>
          )}
        </View>
      </View>

      {/* Tax Rate */}
      <View style={styles.section}>
        <Text style={styles.label}>
          Tax Rate <Text style={styles.optionalTag}>(optional)</Text>
        </Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="receipt-outline"
            size={18}
            color="#64748B"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.taxInput}
            placeholder="e.g. 7.5"
            placeholderTextColor="#64748B"
            value={taxRate}
            onChangeText={(v) => {
              setTaxRate(v);
              setResult(null);
            }}
            keyboardType="decimal-pad"
          />
          <Text style={styles.discountSymbol}>%</Text>
        </View>
      </View>

      {/* Calculate Button */}
      <TouchableOpacity
        style={[styles.calculateButton, !isFormValid && styles.buttonDisabled]}
        onPress={calculate}
        disabled={!isFormValid}
        activeOpacity={0.8}
      >
        <Ionicons name="calculator-outline" size={22} color="#fff" />
        <Text style={styles.calculateButtonText}>Calculate</Text>
      </TouchableOpacity>

      {/* Result Card */}
      {result !== null && (
        <View style={styles.resultSection}>
          <View style={styles.savingsBanner}>
            <Ionicons name="trending-down-outline" size={24} color="#10B981" />
            <View style={styles.savingsBannerText}>
              <Text style={styles.savingsBannerLabel}>You Save</Text>
              <Text style={styles.savingsBannerValue}>
                {sym}
                {fmt(result.savings)}{" "}
                <Text style={styles.savingsBannerPercent}>
                  ({savingsPercent}% off)
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.resultCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultRowLabel}>Original Price</Text>
              <Text style={styles.resultRowValue}>
                {sym}
                {fmt(price)}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultRowLabel}>
                Discount (
                {discountMode === "percentage"
                  ? `${discountValue}%`
                  : `${sym}${fmt(discountValue)}`}
                )
              </Text>
              <Text style={[styles.resultRowValue, { color: "#10B981" }]}>
                −{sym}
                {fmt(result.discountAmount)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.resultRow}>
              <Text style={styles.resultRowLabel}>Price After Discount</Text>
              <Text style={[styles.resultRowValue, styles.finalPriceText]}>
                {sym}
                {fmt(result.finalPrice)}
              </Text>
            </View>

            {tax > 0 && (
              <>
                <View style={styles.resultRow}>
                  <Text style={styles.resultRowLabel}>Tax ({tax}%)</Text>
                  <Text style={[styles.resultRowValue, { color: "#F59E0B" }]}>
                    +{sym}
                    {fmt(result.taxAmount)}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.resultRow}>
                  <Text style={styles.resultRowLabel}>Total (with tax)</Text>
                  <Text style={[styles.resultRowValue, styles.totalText]}>
                    {sym}
                    {fmt(result.totalWithTax)}
                  </Text>
                </View>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="pricetag-outline" size={20} color="#10B981" />
          <Text style={styles.infoText}>
            Use percentage mode for sales like "20% off", or fixed mode for
            vouchers like "{sym}15 off".
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="receipt-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Add an optional tax rate to see the final total including tax after
            the discount.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default DiscountCalc;

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
  optionalTag: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "400",
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
  currencySymbolPreview: { color: "#10B981", fontSize: 18, fontWeight: "700" },

  // ── Currency Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#1E293B",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
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
  modalItemActive: { backgroundColor: "#10B98112" },
  modalItemFlag: { fontSize: 22 },
  modalItemInfo: { flex: 1 },
  modalItemCode: { color: "#E2E8F0", fontSize: 15, fontWeight: "700" },
  modalItemCodeActive: { color: "#10B981" },
  modalItemLabel: { color: "#64748B", fontSize: 12, marginTop: 2 },
  modalItemSymbol: { color: "#475569", fontSize: 16, fontWeight: "600" },
  modalItemSymbolActive: { color: "#10B981" },

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
  currencySymbol: {
    color: "#10B981",
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
  discountInput: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    paddingVertical: 14,
  },
  discountSymbol: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },
  inputIcon: { marginRight: 8 },
  taxInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 14,
  },

  // ── Mode Toggle ──
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 4,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  modeButtonActive: { backgroundColor: "#10B981" },
  modeText: { color: "#64748B", fontSize: 13, fontWeight: "600" },
  modeTextActive: { color: "#fff" },

  // ── Preset Grid ──
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  presetButton: {
    width: "22%",
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
  },
  presetButtonActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
  presetText: { color: "#CBD5E1", fontSize: 15, fontWeight: "600" },
  presetTextActive: { color: "#fff" },

  // ── Calculate ──
  calculateButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  calculateButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  buttonDisabled: { backgroundColor: "#334155", opacity: 0.5 },

  // ── Results ──
  resultSection: { marginBottom: 24, gap: 12 },
  savingsBanner: {
    backgroundColor: "#0D2E22",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#10B981",
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  savingsBannerText: { flex: 1 },
  savingsBannerLabel: {
    color: "#6EE7B7",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  savingsBannerValue: { color: "#fff", fontSize: 24, fontWeight: "700" },
  savingsBannerPercent: { color: "#10B981", fontSize: 16, fontWeight: "600" },
  resultCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
  },
  resultRowLabel: { color: "#94A3B8", fontSize: 15 },
  resultRowValue: { color: "#E2E8F0", fontSize: 15, fontWeight: "600" },
  finalPriceText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  totalText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#334155", marginVertical: 6 },

  clearButton: {
    backgroundColor: "#334155",
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  clearButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

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
    marginBottom: 12,
  },
  infoText: { flex: 1, color: "#CBD5E1", fontSize: 14, lineHeight: 20 },
});
