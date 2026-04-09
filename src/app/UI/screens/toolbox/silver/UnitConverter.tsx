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
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import VersionBadge from "../../../component/VersionBadge";

type CategoryKey =
  | "length"
  | "weight"
  | "temperature"
  | "volume"
  | "speed"
  | "area";

interface Unit {
  label: string;
  value: string;
  toBase: (val: number) => number;
  fromBase: (val: number) => number;
}

interface Category {
  label: string;
  icon: string;
  color: string;
  units: Unit[];
}

const categories: Record<CategoryKey, Category> = {
  length: {
    label: "Length",
    icon: "resize-outline",
    color: "#3B82F6",
    units: [
      {
        label: "Millimeter (mm)",
        value: "mm",
        toBase: (v) => v / 1000,
        fromBase: (v) => v * 1000,
      },
      {
        label: "Centimeter (cm)",
        value: "cm",
        toBase: (v) => v / 100,
        fromBase: (v) => v * 100,
      },
      { label: "Meter (m)", value: "m", toBase: (v) => v, fromBase: (v) => v },
      {
        label: "Kilometer (km)",
        value: "km",
        toBase: (v) => v * 1000,
        fromBase: (v) => v / 1000,
      },
      {
        label: "Inch (in)",
        value: "in",
        toBase: (v) => v * 0.0254,
        fromBase: (v) => v / 0.0254,
      },
      {
        label: "Foot (ft)",
        value: "ft",
        toBase: (v) => v * 0.3048,
        fromBase: (v) => v / 0.3048,
      },
      {
        label: "Yard (yd)",
        value: "yd",
        toBase: (v) => v * 0.9144,
        fromBase: (v) => v / 0.9144,
      },
      {
        label: "Mile (mi)",
        value: "mi",
        toBase: (v) => v * 1609.344,
        fromBase: (v) => v / 1609.344,
      },
    ],
  },
  weight: {
    label: "Weight",
    icon: "barbell-outline",
    color: "#10B981",
    units: [
      {
        label: "Milligram (mg)",
        value: "mg",
        toBase: (v) => v / 1e6,
        fromBase: (v) => v * 1e6,
      },
      {
        label: "Gram (g)",
        value: "g",
        toBase: (v) => v / 1000,
        fromBase: (v) => v * 1000,
      },
      {
        label: "Kilogram (kg)",
        value: "kg",
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        label: "Metric Ton (t)",
        value: "t",
        toBase: (v) => v * 1000,
        fromBase: (v) => v / 1000,
      },
      {
        label: "Ounce (oz)",
        value: "oz",
        toBase: (v) => v * 0.0283495,
        fromBase: (v) => v / 0.0283495,
      },
      {
        label: "Pound (lb)",
        value: "lb",
        toBase: (v) => v * 0.453592,
        fromBase: (v) => v / 0.453592,
      },
      {
        label: "Stone (st)",
        value: "st",
        toBase: (v) => v * 6.35029,
        fromBase: (v) => v / 6.35029,
      },
    ],
  },
  temperature: {
    label: "Temperature",
    icon: "thermometer-outline",
    color: "#EF4444",
    units: [
      {
        label: "Celsius (°C)",
        value: "c",
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        label: "Fahrenheit (°F)",
        value: "f",
        toBase: (v) => (v - 32) * (5 / 9),
        fromBase: (v) => v * (9 / 5) + 32,
      },
      {
        label: "Kelvin (K)",
        value: "k",
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      },
    ],
  },
  volume: {
    label: "Volume",
    icon: "water-outline",
    color: "#8B5CF6",
    units: [
      {
        label: "Milliliter (ml)",
        value: "ml",
        toBase: (v) => v / 1000,
        fromBase: (v) => v * 1000,
      },
      { label: "Liter (L)", value: "L", toBase: (v) => v, fromBase: (v) => v },
      {
        label: "Cubic meter (m³)",
        value: "m3",
        toBase: (v) => v * 1000,
        fromBase: (v) => v / 1000,
      },
      {
        label: "Teaspoon (tsp)",
        value: "tsp",
        toBase: (v) => v * 0.00492892,
        fromBase: (v) => v / 0.00492892,
      },
      {
        label: "Tablespoon (tbsp)",
        value: "tbsp",
        toBase: (v) => v * 0.0147868,
        fromBase: (v) => v / 0.0147868,
      },
      {
        label: "Fluid Ounce (fl oz)",
        value: "floz",
        toBase: (v) => v * 0.0295735,
        fromBase: (v) => v / 0.0295735,
      },
      {
        label: "Cup (cup)",
        value: "cup",
        toBase: (v) => v * 0.236588,
        fromBase: (v) => v / 0.236588,
      },
      {
        label: "Gallon (gal)",
        value: "gal",
        toBase: (v) => v * 3.78541,
        fromBase: (v) => v / 3.78541,
      },
    ],
  },
  speed: {
    label: "Speed",
    icon: "speedometer-outline",
    color: "#F59E0B",
    units: [
      { label: "m/s", value: "ms", toBase: (v) => v, fromBase: (v) => v },
      {
        label: "km/h",
        value: "kmh",
        toBase: (v) => v / 3.6,
        fromBase: (v) => v * 3.6,
      },
      {
        label: "Miles/hour (mph)",
        value: "mph",
        toBase: (v) => v * 0.44704,
        fromBase: (v) => v / 0.44704,
      },
      {
        label: "Knot (kn)",
        value: "kn",
        toBase: (v) => v * 0.514444,
        fromBase: (v) => v / 0.514444,
      },
      {
        label: "Mach",
        value: "mach",
        toBase: (v) => v * 340.29,
        fromBase: (v) => v / 340.29,
      },
    ],
  },
  area: {
    label: "Area",
    icon: "square-outline",
    color: "#EC4899",
    units: [
      {
        label: "Square mm (mm²)",
        value: "mm2",
        toBase: (v) => v / 1e6,
        fromBase: (v) => v * 1e6,
      },
      {
        label: "Square cm (cm²)",
        value: "cm2",
        toBase: (v) => v / 1e4,
        fromBase: (v) => v * 1e4,
      },
      {
        label: "Square meter (m²)",
        value: "m2",
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        label: "Hectare (ha)",
        value: "ha",
        toBase: (v) => v * 1e4,
        fromBase: (v) => v / 1e4,
      },
      {
        label: "Square km (km²)",
        value: "km2",
        toBase: (v) => v * 1e6,
        fromBase: (v) => v / 1e6,
      },
      {
        label: "Square inch (in²)",
        value: "in2",
        toBase: (v) => v * 0.00064516,
        fromBase: (v) => v / 0.00064516,
      },
      {
        label: "Square foot (ft²)",
        value: "ft2",
        toBase: (v) => v * 0.092903,
        fromBase: (v) => v / 0.092903,
      },
      {
        label: "Acre",
        value: "acre",
        toBase: (v) => v * 4046.86,
        fromBase: (v) => v / 4046.86,
      },
    ],
  },
};

const categoryKeys = Object.keys(categories) as CategoryKey[];

const formatResult = (val: number): string => {
  if (!isFinite(val)) return "Error";
  if (val === 0) return "0";
  if (Math.abs(val) >= 1e9 || (Math.abs(val) < 0.0001 && val !== 0)) {
    return val.toExponential(4);
  }
  return parseFloat(val.toPrecision(8)).toString();
};

const UnitConverter: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("length");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("ft");
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const cat = categories[activeCategory];

  const handleCategoryChange = (key: CategoryKey) => {
    setActiveCategory(key);
    const units = categories[key].units;
    setFromUnit(units[0].value);
    setToUnit(units[1].value);
    setInputValue("");
    setResult(null);
  };

  const convert = () => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) return;

    const from = cat.units.find((u) => u.value === fromUnit);
    const to = cat.units.find((u) => u.value === toUnit);
    if (!from || !to) return;

    const base = from.toBase(val);
    const converted = to.fromBase(base);
    setResult(formatResult(converted));
  };

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    setResult(null);
    setInputValue(result ?? "");
  };

  const clearAll = () => {
    setInputValue("");
    setResult(null);
  };

  const fromLabel = cat.units.find((u) => u.value === fromUnit)?.label ?? "";
  const toLabel = cat.units.find((u) => u.value === toUnit)?.label ?? "";

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
        <Text style={styles.headerText}>Unit Converter</Text>
        <Text style={styles.subheaderText}>
          Convert between units instantly
        </Text>
      </View>

      {/* Category Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {categoryKeys.map((key) => {
          const c = categories[key];
          const isActive = activeCategory === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.categoryChip,
                isActive && { backgroundColor: c.color, borderColor: c.color },
              ]}
              onPress={() => handleCategoryChange(key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={c.icon as any}
                size={16}
                color={isActive ? "#fff" : "#94A3B8"}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  isActive && styles.categoryChipTextActive,
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Conversion Panel */}
      <View style={styles.conversionPanel}>
        {/* From */}
        <View style={styles.unitBlock}>
          <Text style={styles.label}>From</Text>
          <View style={styles.pickerWrapper}>
            <Ionicons
              name={cat.icon as any}
              size={18}
              color={cat.color}
              style={styles.pickerIcon}
            />
            <Picker
              selectedValue={fromUnit}
              onValueChange={(v) => {
                setFromUnit(v);
                setResult(null);
              }}
              style={styles.picker}
              dropdownIconColor="#fff"
            >
              {cat.units.map((u) => (
                <Picker.Item key={u.value} label={u.label} value={u.value} />
              ))}
            </Picker>
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.valueInput}
              placeholder="Enter value"
              placeholderTextColor="#64748B"
              value={inputValue}
              onChangeText={(v) => {
                setInputValue(v);
                setResult(null);
              }}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Swap */}
        <TouchableOpacity style={styles.swapButton} onPress={swapUnits}>
          <Ionicons name="swap-vertical" size={22} color="#fff" />
        </TouchableOpacity>

        {/* To */}
        <View style={styles.unitBlock}>
          <Text style={styles.label}>To</Text>
          <View style={styles.pickerWrapper}>
            <Ionicons
              name={cat.icon as any}
              size={18}
              color={cat.color}
              style={styles.pickerIcon}
            />
            <Picker
              selectedValue={toUnit}
              onValueChange={(v) => {
                setToUnit(v);
                setResult(null);
              }}
              style={styles.picker}
              dropdownIconColor="#fff"
            >
              {cat.units.map((u) => (
                <Picker.Item key={u.value} label={u.label} value={u.value} />
              ))}
            </Picker>
          </View>

          <View style={[styles.inputWrapper, styles.resultWrapper]}>
            <Text style={[styles.valueInput, styles.resultText]}>
              {result ?? "—"}
            </Text>
          </View>
        </View>
      </View>

      {/* Convert Button */}
      <TouchableOpacity
        style={[
          styles.convertButton,
          { backgroundColor: cat.color },
          !inputValue.trim() && styles.buttonDisabled,
        ]}
        onPress={convert}
        disabled={!inputValue.trim()}
        activeOpacity={0.8}
      >
        <Ionicons name="sync-outline" size={22} color="#fff" />
        <Text style={styles.convertButtonText}>Convert</Text>
      </TouchableOpacity>

      {/* Result Card */}
      {result !== null && (
        <View style={[styles.resultCard, { borderColor: cat.color }]}>
          <Text style={styles.resultCardLabel}>Result</Text>
          <Text style={styles.resultCardExpression}>
            {inputValue} {fromLabel.split(" ")[0]}
          </Text>
          <View style={styles.resultCardRow}>
            <Ionicons name="arrow-forward" size={20} color={cat.color} />
          </View>
          <Text style={[styles.resultCardValue, { color: cat.color }]}>
            {result}
          </Text>
          <Text style={styles.resultCardUnit}>{toLabel.split(" ")[0]}</Text>
        </View>
      )}

      {/* Clear Button */}
      <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.clearButtonText}>Clear</Text>
      </TouchableOpacity>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="globe-outline" size={20} color="#10B981" />
          <Text style={styles.infoText}>
            Covers 6 categories: Length, Weight, Temperature, Volume, Speed, and
            Area with 40+ units.
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="swap-horizontal-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Tap the swap button to instantly reverse the conversion direction.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default UnitConverter;

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

  // Category Chips
  categoryScroll: {
    marginBottom: 24,
  },
  categoryScrollContent: {
    gap: 10,
    paddingRight: 4,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  categoryChipText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: "#fff",
  },

  // Conversion Panel
  conversionPanel: {
    gap: 12,
    marginBottom: 20,
  },
  unitBlock: {
    gap: 10,
  },
  label: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "600",
  },
  pickerWrapper: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
  },
  pickerIcon: {
    marginRight: 4,
  },
  picker: {
    flex: 1,
    color: "#fff",
    height: 50,
  },
  inputWrapper: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resultWrapper: {
    borderStyle: "dashed",
    minHeight: 52,
    justifyContent: "center",
  },
  valueInput: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  resultText: {
    color: "#10B981",
  },

  // Swap
  swapButton: {
    alignSelf: "center",
    backgroundColor: "#334155",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  // Convert Button
  convertButton: {
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  convertButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.45,
  },

  // Result Card
  resultCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    alignItems: "center",
    marginBottom: 16,
    gap: 4,
  },
  resultCardLabel: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  resultCardExpression: {
    color: "#CBD5E1",
    fontSize: 18,
    fontWeight: "500",
  },
  resultCardRow: {
    marginVertical: 4,
  },
  resultCardValue: {
    fontSize: 48,
    fontWeight: "700",
    lineHeight: 56,
  },
  resultCardUnit: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "500",
  },

  // Clear
  clearButton: {
    backgroundColor: "#334155",
    flexDirection: "row",
    paddingVertical: 14,
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
