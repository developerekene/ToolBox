import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TIP_PRESETS = [5, 10, 15, 20, 25, 30];

const TipCalculator: React.FC = () => {
  const [billAmount, setBillAmount] = useState("");
  const [selectedTip, setSelectedTip] = useState<number | null>(15);
  const [customTip, setCustomTip] = useState("");
  const [people, setPeople] = useState("1");

  const tipPercent =
    customTip !== ""
      ? parseFloat(customTip)
      : selectedTip !== null
        ? selectedTip
        : 0;

  const bill = parseFloat(billAmount) || 0;
  const numPeople = Math.max(parseInt(people) || 1, 1);
  const tipAmount = (bill * tipPercent) / 100;
  const totalAmount = bill + tipAmount;
  const tipPerPerson = tipAmount / numPeople;
  const totalPerPerson = totalAmount / numPeople;

  const hasResult = bill > 0;

  const handlePresetTip = (tip: number) => {
    setSelectedTip(tip);
    setCustomTip("");
  };

  const handleCustomTip = (val: string) => {
    setCustomTip(val);
    setSelectedTip(null);
  };

  const clearAll = () => {
    setBillAmount("");
    setSelectedTip(15);
    setCustomTip("");
    setPeople("1");
  };

  const incrementPeople = () =>
    setPeople((prev) => (parseInt(prev) + 1).toString());

  const decrementPeople = () =>
    setPeople((prev) => Math.max(parseInt(prev) - 1, 1).toString());

  const fmt = (val: number) =>
    val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Tip Calculator</Text>
        <Text style={styles.subheaderText}>Split the bill with ease</Text>
      </View>

      {/* Bill Amount */}
      <View style={styles.section}>
        <Text style={styles.label}>Bill Amount</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#64748B"
            value={billAmount}
            onChangeText={setBillAmount}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Tip Percentage */}
      <View style={styles.section}>
        <Text style={styles.label}>Tip Percentage</Text>
        <View style={styles.tipGrid}>
          {TIP_PRESETS.map((tip) => (
            <TouchableOpacity
              key={tip}
              style={[
                styles.tipButton,
                selectedTip === tip && styles.tipButtonActive,
              ]}
              onPress={() => handlePresetTip(tip)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tipButtonText,
                  selectedTip === tip && styles.tipButtonTextActive,
                ]}
              >
                {tip}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Tip */}
        <View style={styles.customTipRow}>
          <Text style={styles.customTipLabel}>Custom</Text>
          <View style={styles.customTipWrapper}>
            <TextInput
              style={styles.customTipInput}
              placeholder="Enter %"
              placeholderTextColor="#64748B"
              value={customTip}
              onChangeText={handleCustomTip}
              keyboardType="decimal-pad"
            />
            <Text style={styles.customTipSymbol}>%</Text>
          </View>
        </View>
      </View>

      {/* Number of People */}
      <View style={styles.section}>
        <Text style={styles.label}>Split Between</Text>
        <View style={styles.peopleRow}>
          <TouchableOpacity
            style={[
              styles.peopleButton,
              numPeople <= 1 && styles.peopleButtonDisabled,
            ]}
            onPress={decrementPeople}
            disabled={numPeople <= 1}
          >
            <Ionicons
              name="remove"
              size={22}
              color={numPeople <= 1 ? "#334155" : "#fff"}
            />
          </TouchableOpacity>

          <View style={styles.peopleDisplay}>
            <Ionicons name="people-outline" size={20} color="#10B981" />
            <Text style={styles.peopleCount}>{numPeople}</Text>
            <Text style={styles.peopleLabel}>
              {numPeople === 1 ? "person" : "people"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.peopleButton}
            onPress={incrementPeople}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Ionicons name="receipt-outline" size={20} color="#10B981" />
          <Text style={styles.resultTitle}>Summary</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultRowLabel}>Bill</Text>
          <Text style={styles.resultRowValue}>${fmt(bill)}</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultRowLabel}>Tip ({tipPercent}%)</Text>
          <Text style={[styles.resultRowValue, { color: "#10B981" }]}>
            +${fmt(hasResult ? tipAmount : 0)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.resultRow}>
          <Text style={styles.resultRowLabel}>Total</Text>
          <Text style={[styles.resultRowValue, styles.totalValue]}>
            ${fmt(hasResult ? totalAmount : 0)}
          </Text>
        </View>

        {numPeople > 1 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.perPersonTitle}>Per Person</Text>
            <View style={styles.perPersonGrid}>
              <View style={styles.perPersonCard}>
                <Text style={styles.perPersonCardLabel}>Tip</Text>
                <Text style={[styles.perPersonCardValue, { color: "#10B981" }]}>
                  ${fmt(hasResult ? tipPerPerson : 0)}
                </Text>
              </View>
              <View style={styles.perPersonCard}>
                <Text style={styles.perPersonCardLabel}>Total</Text>
                <Text style={[styles.perPersonCardValue, { color: "#fff" }]}>
                  ${fmt(hasResult ? totalPerPerson : 0)}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Clear Button */}
      <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.clearButtonText}>Clear All</Text>
      </TouchableOpacity>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Standard tipping etiquette: 15% for good service, 20% for great,
            25%+ for exceptional.
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={20} color="#10B981" />
          <Text style={styles.infoText}>
            Use the split feature to divide the bill evenly among your group.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default TipCalculator;

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

  // Header
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

  // Section
  section: {
    marginBottom: 24,
  },
  label: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },

  // Bill Input
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
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
    paddingVertical: 16,
  },

  // Tip Presets
  tipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  tipButton: {
    flex: 1,
    minWidth: "28%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
  },
  tipButtonActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  tipButtonText: {
    color: "#CBD5E1",
    fontSize: 16,
    fontWeight: "600",
  },
  tipButtonTextActive: {
    color: "#fff",
  },

  // Custom Tip
  customTipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  customTipLabel: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "600",
    width: 60,
  },
  customTipWrapper: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  customTipInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 12,
  },
  customTipSymbol: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },

  // People Selector
  peopleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 8,
    gap: 12,
  },
  peopleButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  peopleButtonDisabled: {
    backgroundColor: "#1E293B",
  },
  peopleDisplay: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  peopleCount: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  peopleLabel: {
    color: "#94A3B8",
    fontSize: 15,
  },

  // Result Card
  resultCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  resultTitle: {
    color: "#E2E8F0",
    fontSize: 17,
    fontWeight: "700",
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
    fontSize: 16,
    fontWeight: "600",
  },
  totalValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: 8,
  },
  perPersonTitle: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 12,
  },
  perPersonGrid: {
    flexDirection: "row",
    gap: 12,
  },
  perPersonCard: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  perPersonCardLabel: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  perPersonCardValue: {
    fontSize: 22,
    fontWeight: "700",
  },

  // Clear Button
  clearButton: {
    backgroundColor: "#334155",
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // Info Card
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
