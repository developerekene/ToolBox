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

type UnitSystem = "metric" | "imperial";

interface BMICategory {
  label: string;
  range: string;
  color: string;
  icon: string;
}

const bmiCategories: BMICategory[] = [
  {
    label: "Underweight",
    range: "< 18.5",
    color: "#60A5FA",
    icon: "arrow-down-circle-outline",
  },
  {
    label: "Normal weight",
    range: "18.5 – 24.9",
    color: "#10B981",
    icon: "checkmark-circle-outline",
  },
  {
    label: "Overweight",
    range: "25 – 29.9",
    color: "#F59E0B",
    icon: "alert-circle-outline",
  },
  {
    label: "Obese",
    range: "≥ 30",
    color: "#EF4444",
    icon: "close-circle-outline",
  },
];

const getBMICategory = (bmi: number): BMICategory => {
  if (bmi < 18.5) return bmiCategories[0];
  if (bmi < 25) return bmiCategories[1];
  if (bmi < 30) return bmiCategories[2];
  return bmiCategories[3];
};

const getBarWidth = (bmi: number): number => {
  // Map BMI 10–40 to 0–100%
  const clamped = Math.min(Math.max(bmi, 10), 40);
  return ((clamped - 10) / 30) * 100;
};

const BMICalculator: React.FC = () => {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState<BMICategory | null>(null);

  const calculate = () => {
    let weightKg = parseFloat(weight);
    let heightM = 0;

    if (unitSystem === "metric") {
      heightM = parseFloat(height) / 100;
    } else {
      // Imperial: weight in lbs, height in ft + in
      weightKg = parseFloat(weight) * 0.453592;
      const totalInches =
        parseFloat(heightFt || "0") * 12 + parseFloat(heightIn || "0");
      heightM = totalInches * 0.0254;
    }

    if (!weightKg || !heightM || heightM <= 0 || weightKg <= 0) return;

    const bmiValue = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
    setBmi(bmiValue);
    setCategory(getBMICategory(bmiValue));
  };

  const clearAll = () => {
    setWeight("");
    setHeight("");
    setHeightFt("");
    setHeightIn("");
    setBmi(null);
    setCategory(null);
  };

  const isFormValid =
    unitSystem === "metric"
      ? weight.trim() !== "" && height.trim() !== ""
      : weight.trim() !== "" &&
        (heightFt.trim() !== "" || heightIn.trim() !== "");

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>BMI Calculator</Text>
        <Text style={styles.subheaderText}>Calculate your Body Mass Index</Text>
      </View>

      {/* Unit Toggle */}
      <View style={styles.toggleSection}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            unitSystem === "metric" && styles.toggleButtonActive,
          ]}
          onPress={() => {
            setUnitSystem("metric");
            clearAll();
          }}
        >
          <Text
            style={[
              styles.toggleText,
              unitSystem === "metric" && styles.toggleTextActive,
            ]}
          >
            Metric (kg / cm)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            unitSystem === "imperial" && styles.toggleButtonActive,
          ]}
          onPress={() => {
            setUnitSystem("imperial");
            clearAll();
          }}
        >
          <Text
            style={[
              styles.toggleText,
              unitSystem === "imperial" && styles.toggleTextActive,
            ]}
          >
            Imperial (lbs / ft)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        {/* Weight */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Weight ({unitSystem === "metric" ? "kg" : "lbs"})
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="barbell-outline"
              size={20}
              color="#64748B"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder={unitSystem === "metric" ? "e.g. 70" : "e.g. 154"}
              placeholderTextColor="#64748B"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
            <Text style={styles.inputUnit}>
              {unitSystem === "metric" ? "kg" : "lbs"}
            </Text>
          </View>
        </View>

        {/* Height - Metric */}
        {unitSystem === "metric" && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Height (cm)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="resize-outline"
                size={20}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. 175"
                placeholderTextColor="#64748B"
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputUnit}>cm</Text>
            </View>
          </View>
        )}

        {/* Height - Imperial */}
        {unitSystem === "imperial" && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Height (ft / in)</Text>
            <View style={styles.imperialHeightRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Ionicons
                  name="resize-outline"
                  size={20}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="5"
                  placeholderTextColor="#64748B"
                  value={heightFt}
                  onChangeText={setHeightFt}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.inputUnit}>ft</Text>
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <TextInput
                  style={[styles.input, { paddingLeft: 16 }]}
                  placeholder="9"
                  placeholderTextColor="#64748B"
                  value={heightIn}
                  onChangeText={setHeightIn}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.inputUnit}>in</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Calculate Button */}
      <TouchableOpacity
        style={[styles.calculateButton, !isFormValid && styles.buttonDisabled]}
        onPress={calculate}
        disabled={!isFormValid}
      >
        <Ionicons name="calculator-outline" size={24} color="#fff" />
        <Text style={styles.calculateButtonText}>Calculate BMI</Text>
      </TouchableOpacity>

      {/* Result */}
      {bmi !== null && category !== null && (
        <View style={styles.resultSection}>
          {/* BMI Score */}
          <View style={[styles.resultCard, { borderColor: category.color }]}>
            <Text style={styles.resultLabel}>Your BMI</Text>
            <Text style={[styles.bmiValue, { color: category.color }]}>
              {bmi}
            </Text>
            <View style={styles.categoryRow}>
              <Ionicons
                name={category.icon as any}
                size={20}
                color={category.color}
              />
              <Text style={[styles.categoryText, { color: category.color }]}>
                {category.label}
              </Text>
            </View>

            {/* BMI Bar */}
            <View style={styles.barContainer}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${getBarWidth(bmi)}%` as any,
                      backgroundColor: category.color,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.barIndicator,
                    { left: `${getBarWidth(bmi)}%` as any },
                  ]}
                />
              </View>
              <View style={styles.barLabels}>
                <Text style={styles.barLabel}>10</Text>
                <Text style={styles.barLabel}>18.5</Text>
                <Text style={styles.barLabel}>25</Text>
                <Text style={styles.barLabel}>30</Text>
                <Text style={styles.barLabel}>40</Text>
              </View>
            </View>
          </View>

          {/* Clear Button */}
          <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* BMI Categories Reference */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>BMI Categories</Text>
        {bmiCategories.map((cat) => (
          <View key={cat.label} style={styles.categoryItem}>
            <View
              style={[styles.categoryDot, { backgroundColor: cat.color }]}
            />
            <Text style={styles.categoryItemLabel}>{cat.label}</Text>
            <Text style={styles.categoryItemRange}>{cat.range}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            BMI is a screening tool, not a diagnostic measure. Consult a
            healthcare professional for a full assessment.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default BMICalculator;

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

  // Unit Toggle
  toggleSection: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#10B981",
  },
  toggleText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  toggleTextActive: {
    color: "#fff",
  },

  // Inputs
  inputSection: {
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "600",
  },
  inputWrapper: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 16,
  },
  inputIcon: {
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 14,
  },
  inputUnit: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  imperialHeightRow: {
    flexDirection: "row",
    gap: 12,
  },

  // Calculate Button
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

  // Result
  resultSection: {
    marginBottom: 24,
    gap: 12,
  },
  resultCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    alignItems: "center",
  },
  resultLabel: {
    color: "#CBD5E1",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  bmiValue: {
    fontSize: 64,
    fontWeight: "700",
    lineHeight: 72,
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  categoryText: {
    fontSize: 18,
    fontWeight: "600",
  },

  // BMI Bar
  barContainer: {
    width: "100%",
  },
  barTrack: {
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 4,
    marginBottom: 6,
    position: "relative",
    overflow: "visible",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  barIndicator: {
    position: "absolute",
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginLeft: -8,
    borderWidth: 2,
    borderColor: "#101828",
  },
  barLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  barLabel: {
    color: "#64748B",
    fontSize: 11,
  },

  // Clear Button
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

  // Info Card
  infoCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  infoTitle: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryItemLabel: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 14,
  },
  categoryItemRange: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
  },
});
