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

type RepaymentFrequency = "monthly" | "biweekly" | "weekly";

interface Currency {
  code: string;
  symbol: string;
  label: string;
  flag: string;
}

interface LoanResult {
  payment: number;
  totalPayment: number;
  totalInterest: number;
  principalAmount: number;
  effectiveRate: number;
  numPayments: number;
}

const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", label: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", label: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", label: "British Pound", flag: "🇬🇧" },
  { code: "NGN", symbol: "₦", label: "Nigerian Naira", flag: "🇳🇬" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar", flag: "🇨🇦" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar", flag: "🇦🇺" },
];

const TERM_PRESETS = [1, 2, 3, 5, 10, 15, 20, 30];

const LoanCalculator: React.FC = () => {
  const [currency, setCurrency] = useState<Currency>(CURRENCIES[0]);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [loanTerm, setLoanTerm] = useState("");
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [frequency, setFrequency] = useState<RepaymentFrequency>("monthly");
  const [result, setResult] = useState<LoanResult | null>(null);

  const isFormValid =
    loanAmount.trim() !== "" &&
    interestRate.trim() !== "" &&
    (loanTerm.trim() !== "" || selectedTerm !== null);

  const getFrequencyConfig = (freq: RepaymentFrequency) => {
    switch (freq) {
      case "monthly":
        return { label: "Monthly", periods: 12, icon: "calendar-outline" };
      case "biweekly":
        return { label: "Bi-Weekly", periods: 26, icon: "today-outline" };
      case "weekly":
        return { label: "Weekly", periods: 52, icon: "time-outline" };
    }
  };

  const calculate = () => {
    const principal = parseFloat(loanAmount);
    const annualRate = parseFloat(interestRate);
    const years = selectedTerm !== null ? selectedTerm : parseFloat(loanTerm);

    if (!principal || !annualRate || !years || principal <= 0 || years <= 0)
      return;

    const config = getFrequencyConfig(frequency);
    const periodicRate = annualRate / 100 / config.periods;
    const numPayments = years * config.periods;

    let payment: number;
    if (periodicRate === 0) {
      payment = principal / numPayments;
    } else {
      payment =
        (principal * (periodicRate * Math.pow(1 + periodicRate, numPayments))) /
        (Math.pow(1 + periodicRate, numPayments) - 1);
    }

    const totalPayment = payment * numPayments;
    const totalInterest = totalPayment - principal;

    setResult({
      payment,
      totalPayment,
      totalInterest,
      principalAmount: principal,
      effectiveRate: annualRate,
      numPayments,
    });
  };

  const clearAll = () => {
    setLoanAmount("");
    setInterestRate("");
    setLoanTerm("");
    setSelectedTerm(null);
    setResult(null);
  };

  const handleTermPreset = (term: number) => {
    setSelectedTerm(term);
    setLoanTerm("");
    setResult(null);
  };

  const handleCustomTerm = (val: string) => {
    setLoanTerm(val);
    setSelectedTerm(null);
    setResult(null);
  };

  const fmt = (val: number) =>
    val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const fmtK = (val: number) => {
    const sym = currency.symbol;
    if (val >= 1000000) return `${sym}${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `${sym}${(val / 1000).toFixed(1)}K`;
    return `${sym}${fmt(val)}`;
  };

  const interestPercent = result
    ? ((result.totalInterest / result.totalPayment) * 100).toFixed(1)
    : "0";

  const principalPercent = result
    ? ((result.principalAmount / result.totalPayment) * 100).toFixed(1)
    : "0";

  const freqConfig = getFrequencyConfig(frequency);

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
        <Text style={styles.headerText}>Loan Calculator</Text>
        <Text style={styles.subheaderText}>Plan your repayments clearly</Text>
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

      {/* Loan Amount */}
      <View style={styles.section}>
        <Text style={styles.label}>Loan Amount</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.currencySymbolInput}>{currency.symbol}</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="0.00"
            placeholderTextColor="#64748B"
            value={loanAmount}
            onChangeText={(v) => {
              setLoanAmount(v);
              setResult(null);
            }}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Interest Rate */}
      <View style={styles.section}>
        <Text style={styles.label}>Annual Interest Rate</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="trending-up-outline"
            size={20}
            color="#64748B"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g. 6.5"
            placeholderTextColor="#64748B"
            value={interestRate}
            onChangeText={(v) => {
              setInterestRate(v);
              setResult(null);
            }}
            keyboardType="decimal-pad"
          />
          <Text style={styles.unitSymbol}>%</Text>
        </View>
      </View>

      {/* Loan Term */}
      <View style={styles.section}>
        <Text style={styles.label}>Loan Term (Years)</Text>
        <View style={styles.termGrid}>
          {TERM_PRESETS.map((term) => (
            <TouchableOpacity
              key={term}
              style={[
                styles.termButton,
                selectedTerm === term && styles.termButtonActive,
              ]}
              onPress={() => handleTermPreset(term)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.termButtonText,
                  selectedTerm === term && styles.termButtonTextActive,
                ]}
              >
                {term}yr
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="hourglass-outline"
            size={20}
            color="#64748B"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.fieldInput}
            placeholder="Custom years"
            placeholderTextColor="#64748B"
            value={loanTerm}
            onChangeText={handleCustomTerm}
            keyboardType="decimal-pad"
          />
          <Text style={styles.unitSymbol}>yrs</Text>
        </View>
      </View>

      {/* Repayment Frequency */}
      <View style={styles.section}>
        <Text style={styles.label}>Repayment Frequency</Text>
        <View style={styles.frequencyRow}>
          {(["monthly", "biweekly", "weekly"] as RepaymentFrequency[]).map(
            (freq) => {
              const cfg = getFrequencyConfig(freq);
              const isActive = frequency === freq;
              return (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.frequencyButton,
                    isActive && styles.frequencyButtonActive,
                  ]}
                  onPress={() => {
                    setFrequency(freq);
                    setResult(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={cfg.icon as any}
                    size={16}
                    color={isActive ? "#fff" : "#64748B"}
                  />
                  <Text
                    style={[
                      styles.frequencyText,
                      isActive && styles.frequencyTextActive,
                    ]}
                  >
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
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

      {/* Results */}
      {result !== null && (
        <View style={styles.resultSection}>
          {/* Payment Banner */}
          <View style={styles.paymentBanner}>
            <View style={styles.paymentBannerInner}>
              <Text style={styles.paymentBannerLabel}>
                {freqConfig.label} Payment
              </Text>
              <Text style={styles.paymentBannerValue}>
                {currency.symbol}
                {fmt(result.payment)}
              </Text>
            </View>
            <View style={styles.paymentBannerDivider} />
            <View style={styles.paymentBannerInner}>
              <Text style={styles.paymentBannerLabel}>Total Payments</Text>
              <Text style={styles.paymentBannerSub}>{result.numPayments}</Text>
            </View>
          </View>

          {/* Breakdown Card */}
          <View style={styles.resultCard}>
            <Text style={styles.resultCardTitle}>Payment Breakdown</Text>

            <View style={styles.resultRow}>
              <Text style={styles.resultRowLabel}>Loan Principal</Text>
              <Text style={styles.resultRowValue}>
                {fmtK(result.principalAmount)}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultRowLabel}>Total Interest</Text>
              <Text style={[styles.resultRowValue, { color: "#F59E0B" }]}>
                +{fmtK(result.totalInterest)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.resultRow}>
              <Text style={styles.resultRowLabel}>Total Cost</Text>
              <Text style={[styles.resultRowValue, styles.totalText]}>
                {fmtK(result.totalPayment)}
              </Text>
            </View>

            {/* Visual Bar */}
            <View style={styles.barSection}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barPrincipal,
                    { flex: result.principalAmount / result.totalPayment },
                  ]}
                />
                <View
                  style={[
                    styles.barInterest,
                    { flex: result.totalInterest / result.totalPayment },
                  ]}
                />
              </View>
              <View style={styles.barLegend}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#10B981" }]}
                  />
                  <Text style={styles.legendText}>
                    Principal {principalPercent}%
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#F59E0B" }]}
                  />
                  <Text style={styles.legendText}>
                    Interest {interestPercent}%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Summary Tiles */}
          <View style={styles.tilesRow}>
            <View style={styles.tile}>
              <Ionicons name="trending-up-outline" size={20} color="#3B82F6" />
              <Text style={styles.tileValue}>{result.effectiveRate}%</Text>
              <Text style={styles.tileLabel}>Annual Rate</Text>
            </View>
            <View style={styles.tile}>
              <Ionicons name="time-outline" size={20} color="#8B5CF6" />
              <Text style={styles.tileValue}>
                {selectedTerm !== null ? selectedTerm : parseFloat(loanTerm)}yr
              </Text>
              <Text style={styles.tileLabel}>Loan Term</Text>
            </View>
            <View style={styles.tile}>
              <Ionicons name="cash-outline" size={20} color="#F59E0B" />
              <Text style={styles.tileValue}>{fmtK(result.totalInterest)}</Text>
              <Text style={styles.tileLabel}>Interest Paid</Text>
            </View>
          </View>

          {/* Clear */}
          <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Uses the standard amortisation formula. Results are estimates,
            actual repayments may vary by lender.
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#10B981" />
          <Text style={styles.infoText}>
            Bi-weekly payments (26/year) can reduce total interest significantly
            compared to monthly (12/year).
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default LoanCalculator;

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
  header: {
    marginBottom: 24,
  },
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
  section: {
    marginBottom: 22,
  },
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
  currencyFlag: {
    fontSize: 24,
  },
  currencySelectorInfo: {
    flex: 1,
  },
  currencyCode: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  currencyLabel: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },
  currencySelectorRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currencySymbolPreview: {
    color: "#10B981",
    fontSize: 18,
    fontWeight: "700",
  },

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
  modalTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    gap: 12,
  },
  modalItemActive: {
    backgroundColor: "#10B98112",
  },
  modalItemFlag: {
    fontSize: 22,
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemCode: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "700",
  },
  modalItemCodeActive: {
    color: "#10B981",
  },
  modalItemLabel: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },
  modalItemSymbol: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "600",
  },
  modalItemSymbolActive: {
    color: "#10B981",
  },

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
  currencySymbolInput: {
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
  inputIcon: {
    marginRight: 8,
  },
  fieldInput: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    paddingVertical: 14,
  },
  unitSymbol: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "600",
  },

  // ── Term ──
  termGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  termButton: {
    width: "22%",
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
  },
  termButtonActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  termButtonText: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "600",
  },
  termButtonTextActive: {
    color: "#fff",
  },

  // ── Frequency ──
  frequencyRow: {
    flexDirection: "row",
    gap: 10,
  },
  frequencyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  frequencyButtonActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  frequencyText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  frequencyTextActive: {
    color: "#fff",
  },

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
  calculateButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  buttonDisabled: {
    backgroundColor: "#334155",
    opacity: 0.5,
  },

  // ── Results ──
  resultSection: {
    gap: 12,
    marginBottom: 24,
  },
  paymentBanner: {
    backgroundColor: "#0D2E22",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#10B981",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  paymentBannerInner: {
    flex: 1,
    alignItems: "center",
  },
  paymentBannerDivider: {
    width: 1,
    height: 50,
    backgroundColor: "#134E35",
  },
  paymentBannerLabel: {
    color: "#6EE7B7",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  paymentBannerValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  paymentBannerSub: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  resultCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  resultCardTitle: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 14,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  resultRowLabel: {
    color: "#94A3B8",
    fontSize: 15,
  },
  resultRowValue: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "600",
  },
  totalText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: 6,
  },
  barSection: {
    marginTop: 16,
  },
  barTrack: {
    height: 10,
    borderRadius: 5,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 10,
  },
  barPrincipal: {
    backgroundColor: "#10B981",
    height: "100%",
  },
  barInterest: {
    backgroundColor: "#F59E0B",
    height: "100%",
  },
  barLegend: {
    flexDirection: "row",
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  tilesRow: {
    flexDirection: "row",
    gap: 10,
  },
  tile: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  tileValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  tileLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  clearButton: {
    backgroundColor: "#334155",
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

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
  infoText: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
  },
});

// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   Platform,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import VersionBadge from "../../../component/VersionBadge";

// type RepaymentFrequency = "monthly" | "biweekly" | "weekly";

// interface LoanResult {
//   payment: number;
//   totalPayment: number;
//   totalInterest: number;
//   principalAmount: number;
//   effectiveRate: number;
//   numPayments: number;
// }

// const TERM_PRESETS = [1, 2, 3, 5, 10, 15, 20, 30];

// const LoanCalculator: React.FC = () => {
//   const [loanAmount, setLoanAmount] = useState("");
//   const [interestRate, setInterestRate] = useState("");
//   const [loanTerm, setLoanTerm] = useState("");
//   const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
//   const [frequency, setFrequency] = useState<RepaymentFrequency>("monthly");
//   const [result, setResult] = useState<LoanResult | null>(null);

//   const isFormValid =
//     loanAmount.trim() !== "" &&
//     interestRate.trim() !== "" &&
//     (loanTerm.trim() !== "" || selectedTerm !== null);

//   const getFrequencyConfig = (freq: RepaymentFrequency) => {
//     switch (freq) {
//       case "monthly":
//         return { label: "Monthly", periods: 12, icon: "calendar-outline" };
//       case "biweekly":
//         return { label: "Bi-Weekly", periods: 26, icon: "today-outline" };
//       case "weekly":
//         return { label: "Weekly", periods: 52, icon: "time-outline" };
//     }
//   };

//   const calculate = () => {
//     const principal = parseFloat(loanAmount);
//     const annualRate = parseFloat(interestRate);
//     const years = selectedTerm !== null ? selectedTerm : parseFloat(loanTerm);

//     if (!principal || !annualRate || !years || principal <= 0 || years <= 0)
//       return;

//     const config = getFrequencyConfig(frequency);
//     const periodicRate = annualRate / 100 / config.periods;
//     const numPayments = years * config.periods;

//     let payment: number;
//     if (periodicRate === 0) {
//       payment = principal / numPayments;
//     } else {
//       payment =
//         (principal * (periodicRate * Math.pow(1 + periodicRate, numPayments))) /
//         (Math.pow(1 + periodicRate, numPayments) - 1);
//     }

//     const totalPayment = payment * numPayments;
//     const totalInterest = totalPayment - principal;

//     setResult({
//       payment,
//       totalPayment,
//       totalInterest,
//       principalAmount: principal,
//       effectiveRate: annualRate,
//       numPayments,
//     });
//   };

//   const clearAll = () => {
//     setLoanAmount("");
//     setInterestRate("");
//     setLoanTerm("");
//     setSelectedTerm(null);
//     setResult(null);
//   };

//   const handleTermPreset = (term: number) => {
//     setSelectedTerm(term);
//     setLoanTerm("");
//     setResult(null);
//   };

//   const handleCustomTerm = (val: string) => {
//     setLoanTerm(val);
//     setSelectedTerm(null);
//     setResult(null);
//   };

//   const fmt = (val: number) =>
//     val.toLocaleString("en-US", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });

//   const fmtK = (val: number) => {
//     if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
//     if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
//     return `$${fmt(val)}`;
//   };

//   const interestPercent = result
//     ? ((result.totalInterest / result.totalPayment) * 100).toFixed(1)
//     : "0";

//   const principalPercent = result
//     ? ((result.principalAmount / result.totalPayment) * 100).toFixed(1)
//     : "0";

//   const freqConfig = getFrequencyConfig(frequency);

//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={styles.contentContainer}
//     >
//       <View>
//         <VersionBadge version="0.03" />
//       </View>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerText}>Loan Calculator</Text>
//         <Text style={styles.subheaderText}>Plan your repayments clearly</Text>
//       </View>

//       {/* Loan Amount */}
//       <View style={styles.section}>
//         <Text style={styles.label}>Loan Amount</Text>
//         <View style={styles.inputWrapper}>
//           <Text style={styles.currencySymbol}>$</Text>
//           <TextInput
//             style={styles.priceInput}
//             placeholder="0.00"
//             placeholderTextColor="#64748B"
//             value={loanAmount}
//             onChangeText={(v) => {
//               setLoanAmount(v);
//               setResult(null);
//             }}
//             keyboardType="decimal-pad"
//           />
//         </View>
//       </View>

//       {/* Interest Rate */}
//       <View style={styles.section}>
//         <Text style={styles.label}>Annual Interest Rate</Text>
//         <View style={styles.inputWrapper}>
//           <Ionicons
//             name="trending-up-outline"
//             size={20}
//             color="#64748B"
//             style={styles.inputIcon}
//           />
//           <TextInput
//             style={styles.fieldInput}
//             placeholder="e.g. 6.5"
//             placeholderTextColor="#64748B"
//             value={interestRate}
//             onChangeText={(v) => {
//               setInterestRate(v);
//               setResult(null);
//             }}
//             keyboardType="decimal-pad"
//           />
//           <Text style={styles.unitSymbol}>%</Text>
//         </View>
//       </View>

//       {/* Loan Term */}
//       <View style={styles.section}>
//         <Text style={styles.label}>Loan Term (Years)</Text>
//         <View style={styles.termGrid}>
//           {TERM_PRESETS.map((term) => (
//             <TouchableOpacity
//               key={term}
//               style={[
//                 styles.termButton,
//                 selectedTerm === term && styles.termButtonActive,
//               ]}
//               onPress={() => handleTermPreset(term)}
//               activeOpacity={0.7}
//             >
//               <Text
//                 style={[
//                   styles.termButtonText,
//                   selectedTerm === term && styles.termButtonTextActive,
//                 ]}
//               >
//                 {term}yr
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//         <View style={styles.inputWrapper}>
//           <Ionicons
//             name="hourglass-outline"
//             size={20}
//             color="#64748B"
//             style={styles.inputIcon}
//           />
//           <TextInput
//             style={styles.fieldInput}
//             placeholder="Custom years"
//             placeholderTextColor="#64748B"
//             value={loanTerm}
//             onChangeText={handleCustomTerm}
//             keyboardType="decimal-pad"
//           />
//           <Text style={styles.unitSymbol}>yrs</Text>
//         </View>
//       </View>

//       {/* Repayment Frequency */}
//       <View style={styles.section}>
//         <Text style={styles.label}>Repayment Frequency</Text>
//         <View style={styles.frequencyRow}>
//           {(["monthly", "biweekly", "weekly"] as RepaymentFrequency[]).map(
//             (freq) => {
//               const cfg = getFrequencyConfig(freq);
//               const isActive = frequency === freq;
//               return (
//                 <TouchableOpacity
//                   key={freq}
//                   style={[
//                     styles.frequencyButton,
//                     isActive && styles.frequencyButtonActive,
//                   ]}
//                   onPress={() => {
//                     setFrequency(freq);
//                     setResult(null);
//                   }}
//                   activeOpacity={0.7}
//                 >
//                   <Ionicons
//                     name={cfg.icon as any}
//                     size={16}
//                     color={isActive ? "#fff" : "#64748B"}
//                   />
//                   <Text
//                     style={[
//                       styles.frequencyText,
//                       isActive && styles.frequencyTextActive,
//                     ]}
//                   >
//                     {cfg.label}
//                   </Text>
//                 </TouchableOpacity>
//               );
//             },
//           )}
//         </View>
//       </View>

//       {/* Calculate Button */}
//       <TouchableOpacity
//         style={[styles.calculateButton, !isFormValid && styles.buttonDisabled]}
//         onPress={calculate}
//         disabled={!isFormValid}
//         activeOpacity={0.8}
//       >
//         <Ionicons name="calculator-outline" size={22} color="#fff" />
//         <Text style={styles.calculateButtonText}>Calculate</Text>
//       </TouchableOpacity>

//       {/* Results */}
//       {result !== null && (
//         <View style={styles.resultSection}>
//           {/* Payment Banner */}
//           <View style={styles.paymentBanner}>
//             <View style={styles.paymentBannerInner}>
//               <Text style={styles.paymentBannerLabel}>
//                 {freqConfig.label} Payment
//               </Text>
//               <Text style={styles.paymentBannerValue}>
//                 ${fmt(result.payment)}
//               </Text>
//             </View>
//             <View style={styles.paymentBannerDivider} />
//             <View style={styles.paymentBannerInner}>
//               <Text style={styles.paymentBannerLabel}>Total Payments</Text>
//               <Text style={styles.paymentBannerSub}>{result.numPayments}</Text>
//             </View>
//           </View>

//           {/* Breakdown Card */}
//           <View style={styles.resultCard}>
//             <Text style={styles.resultCardTitle}>Payment Breakdown</Text>

//             <View style={styles.resultRow}>
//               <Text style={styles.resultRowLabel}>Loan Principal</Text>
//               <Text style={styles.resultRowValue}>
//                 {fmtK(result.principalAmount)}
//               </Text>
//             </View>
//             <View style={styles.resultRow}>
//               <Text style={styles.resultRowLabel}>Total Interest</Text>
//               <Text style={[styles.resultRowValue, { color: "#F59E0B" }]}>
//                 +{fmtK(result.totalInterest)}
//               </Text>
//             </View>

//             <View style={styles.divider} />

//             <View style={styles.resultRow}>
//               <Text style={styles.resultRowLabel}>Total Cost</Text>
//               <Text style={[styles.resultRowValue, styles.totalText]}>
//                 {fmtK(result.totalPayment)}
//               </Text>
//             </View>

//             {/* Visual Bar */}
//             <View style={styles.barSection}>
//               <View style={styles.barTrack}>
//                 <View
//                   style={[
//                     styles.barPrincipal,
//                     { flex: result.principalAmount / result.totalPayment },
//                   ]}
//                 />
//                 <View
//                   style={[
//                     styles.barInterest,
//                     { flex: result.totalInterest / result.totalPayment },
//                   ]}
//                 />
//               </View>
//               <View style={styles.barLegend}>
//                 <View style={styles.legendItem}>
//                   <View
//                     style={[styles.legendDot, { backgroundColor: "#10B981" }]}
//                   />
//                   <Text style={styles.legendText}>
//                     Principal {principalPercent}%
//                   </Text>
//                 </View>
//                 <View style={styles.legendItem}>
//                   <View
//                     style={[styles.legendDot, { backgroundColor: "#F59E0B" }]}
//                   />
//                   <Text style={styles.legendText}>
//                     Interest {interestPercent}%
//                   </Text>
//                 </View>
//               </View>
//             </View>
//           </View>

//           {/* Summary Tiles */}
//           <View style={styles.tilesRow}>
//             <View style={styles.tile}>
//               <Ionicons name="trending-up-outline" size={20} color="#3B82F6" />
//               <Text style={styles.tileValue}>{result.effectiveRate}%</Text>
//               <Text style={styles.tileLabel}>Annual Rate</Text>
//             </View>
//             <View style={styles.tile}>
//               <Ionicons name="time-outline" size={20} color="#8B5CF6" />
//               <Text style={styles.tileValue}>
//                 {selectedTerm !== null ? selectedTerm : parseFloat(loanTerm)}yr
//               </Text>
//               <Text style={styles.tileLabel}>Loan Term</Text>
//             </View>
//             <View style={styles.tile}>
//               <Ionicons name="cash-outline" size={20} color="#F59E0B" />
//               <Text style={styles.tileValue}>{fmtK(result.totalInterest)}</Text>
//               <Text style={styles.tileLabel}>Interest Paid</Text>
//             </View>
//           </View>

//           {/* Clear */}
//           <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
//             <Ionicons name="trash-outline" size={20} color="#fff" />
//             <Text style={styles.clearButtonText}>Clear All</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* Info Card */}
//       <View style={styles.infoCard}>
//         <View style={styles.infoRow}>
//           <Ionicons name="information-circle" size={20} color="#3B82F6" />
//           <Text style={styles.infoText}>
//             Uses the standard amortisation formula. Results are estimates,
//             actual repayments may vary by lender.
//           </Text>
//         </View>
//         <View style={styles.infoRow}>
//           <Ionicons name="calendar-outline" size={20} color="#10B981" />
//           <Text style={styles.infoText}>
//             Bi-weekly payments (26/year) can reduce total interest significantly
//             compared to monthly (12/year).
//           </Text>
//         </View>
//       </View>
//     </ScrollView>
//   );
// };

// export default LoanCalculator;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#101828",
//   },
//   contentContainer: {
//     padding: 20,
//     paddingTop: Platform.OS === "android" ? 40 : 60,
//     paddingBottom: 40,
//   },
//   header: {
//     marginBottom: 24,
//   },
//   headerText: {
//     fontSize: 28,
//     fontWeight: "700",
//     color: "#fff",
//     textAlign: "center",
//     marginBottom: 8,
//   },
//   subheaderText: {
//     fontSize: 16,
//     color: "#CBD5E1",
//     textAlign: "center",
//   },
//   section: {
//     marginBottom: 22,
//   },
//   label: {
//     color: "#E2E8F0",
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 10,
//   },
//   inputWrapper: {
//     backgroundColor: "#1E293B",
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#334155",
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 16,
//   },
//   currencySymbol: {
//     color: "#10B981",
//     fontSize: 22,
//     fontWeight: "700",
//     marginRight: 8,
//   },
//   priceInput: {
//     flex: 1,
//     color: "#fff",
//     fontSize: 24,
//     fontWeight: "600",
//     paddingVertical: 14,
//   },
//   inputIcon: {
//     marginRight: 8,
//   },
//   fieldInput: {
//     flex: 1,
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "600",
//     paddingVertical: 14,
//   },
//   unitSymbol: {
//     color: "#64748B",
//     fontSize: 15,
//     fontWeight: "600",
//   },
//   termGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 10,
//     marginBottom: 12,
//   },
//   termButton: {
//     width: "22%",
//     paddingVertical: 13,
//     borderRadius: 12,
//     backgroundColor: "#1E293B",
//     borderWidth: 1,
//     borderColor: "#334155",
//     alignItems: "center",
//   },
//   termButtonActive: {
//     backgroundColor: "#10B981",
//     borderColor: "#10B981",
//   },
//   termButtonText: {
//     color: "#CBD5E1",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   termButtonTextActive: {
//     color: "#fff",
//   },
//   frequencyRow: {
//     flexDirection: "row",
//     gap: 10,
//   },
//   frequencyButton: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 6,
//     paddingVertical: 13,
//     borderRadius: 12,
//     backgroundColor: "#1E293B",
//     borderWidth: 1,
//     borderColor: "#334155",
//   },
//   frequencyButtonActive: {
//     backgroundColor: "#10B981",
//     borderColor: "#10B981",
//   },
//   frequencyText: {
//     color: "#64748B",
//     fontSize: 13,
//     fontWeight: "600",
//   },
//   frequencyTextActive: {
//     color: "#fff",
//   },
//   calculateButton: {
//     backgroundColor: "#10B981",
//     flexDirection: "row",
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//     marginBottom: 24,
//   },
//   calculateButtonText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "700",
//   },
//   buttonDisabled: {
//     backgroundColor: "#334155",
//     opacity: 0.5,
//   },
//   resultSection: {
//     gap: 12,
//     marginBottom: 24,
//   },
//   paymentBanner: {
//     backgroundColor: "#0D2E22",
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: "#10B981",
//     padding: 20,
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   paymentBannerInner: {
//     flex: 1,
//     alignItems: "center",
//   },
//   paymentBannerDivider: {
//     width: 1,
//     height: 50,
//     backgroundColor: "#134E35",
//   },
//   paymentBannerLabel: {
//     color: "#6EE7B7",
//     fontSize: 12,
//     fontWeight: "600",
//     textTransform: "uppercase",
//     letterSpacing: 0.8,
//     marginBottom: 4,
//   },
//   paymentBannerValue: {
//     color: "#fff",
//     fontSize: 30,
//     fontWeight: "700",
//   },
//   paymentBannerSub: {
//     color: "#fff",
//     fontSize: 26,
//     fontWeight: "700",
//   },
//   resultCard: {
//     backgroundColor: "#1E293B",
//     borderRadius: 16,
//     padding: 20,
//     borderWidth: 1,
//     borderColor: "#334155",
//   },
//   resultCardTitle: {
//     color: "#E2E8F0",
//     fontSize: 15,
//     fontWeight: "700",
//     marginBottom: 14,
//   },
//   resultRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 8,
//   },
//   resultRowLabel: {
//     color: "#94A3B8",
//     fontSize: 15,
//   },
//   resultRowValue: {
//     color: "#E2E8F0",
//     fontSize: 15,
//     fontWeight: "600",
//   },
//   totalText: {
//     color: "#fff",
//     fontSize: 20,
//     fontWeight: "700",
//   },
//   divider: {
//     height: 1,
//     backgroundColor: "#334155",
//     marginVertical: 6,
//   },
//   barSection: {
//     marginTop: 16,
//   },
//   barTrack: {
//     height: 10,
//     borderRadius: 5,
//     flexDirection: "row",
//     overflow: "hidden",
//     marginBottom: 10,
//   },
//   barPrincipal: {
//     backgroundColor: "#10B981",
//     height: "100%",
//   },
//   barInterest: {
//     backgroundColor: "#F59E0B",
//     height: "100%",
//   },
//   barLegend: {
//     flexDirection: "row",
//     gap: 20,
//   },
//   legendItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//   },
//   legendDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//   },
//   legendText: {
//     color: "#94A3B8",
//     fontSize: 12,
//   },
//   tilesRow: {
//     flexDirection: "row",
//     gap: 10,
//   },
//   tile: {
//     flex: 1,
//     backgroundColor: "#1E293B",
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: "#334155",
//     padding: 14,
//     alignItems: "center",
//     gap: 6,
//   },
//   tileValue: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   tileLabel: {
//     color: "#64748B",
//     fontSize: 11,
//     fontWeight: "500",
//     textAlign: "center",
//   },
//   clearButton: {
//     backgroundColor: "#334155",
//     flexDirection: "row",
//     paddingVertical: 14,
//     borderRadius: 12,
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//   },
//   clearButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   infoCard: {
//     backgroundColor: "#1E293B",
//     borderRadius: 16,
//     padding: 20,
//     borderWidth: 1,
//     borderColor: "#334155",
//   },
//   infoRow: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: 12,
//     marginBottom: 12,
//   },
//   infoText: {
//     flex: 1,
//     color: "#CBD5E1",
//     fontSize: 14,
//     lineHeight: 20,
//   },
// });
