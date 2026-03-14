import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ButtonType = "number" | "operator" | "scientific" | "action" | "equals";

interface CalcButton {
  label: string;
  value: string;
  type: ButtonType;
  wide?: boolean;
}

const scientificButtons: CalcButton[][] = [
  [
    { label: "sin", value: "sin", type: "scientific" },
    { label: "cos", value: "cos", type: "scientific" },
    { label: "tan", value: "tan", type: "scientific" },
    { label: "log", value: "log", type: "scientific" },
  ],
  [
    { label: "ln", value: "ln", type: "scientific" },
    { label: "√", value: "sqrt", type: "scientific" },
    { label: "x²", value: "sq", type: "scientific" },
    { label: "xⁿ", value: "^", type: "operator" },
  ],
  [
    { label: "π", value: "π", type: "scientific" },
    { label: "e", value: "e", type: "scientific" },
    { label: "(", value: "(", type: "operator" },
    { label: ")", value: ")", type: "operator" },
  ],
];

const mainButtons: CalcButton[][] = [
  [
    { label: "AC", value: "AC", type: "action" },
    { label: "+/-", value: "negate", type: "action" },
    { label: "%", value: "%", type: "action" },
    { label: "÷", value: "/", type: "operator" },
  ],
  [
    { label: "7", value: "7", type: "number" },
    { label: "8", value: "8", type: "number" },
    { label: "9", value: "9", type: "number" },
    { label: "×", value: "*", type: "operator" },
  ],
  [
    { label: "4", value: "4", type: "number" },
    { label: "5", value: "5", type: "number" },
    { label: "6", value: "6", type: "number" },
    { label: "−", value: "-", type: "operator" },
  ],
  [
    { label: "1", value: "1", type: "number" },
    { label: "2", value: "2", type: "number" },
    { label: "3", value: "3", type: "number" },
    { label: "+", value: "+", type: "operator" },
  ],
  [
    { label: "0", value: "0", type: "number", wide: true },
    { label: ".", value: ".", type: "number" },
    { label: "=", value: "=", type: "equals" },
  ],
];

const ScientificCalculator: React.FC = () => {
  const [expression, setExpression] = useState("");
  const [display, setDisplay] = useState("0");
  const [result, setResult] = useState("");
  const [hasResult, setHasResult] = useState(false);
  const [angleMode, setAngleMode] = useState<"DEG" | "RAD">("DEG");

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const evaluateExpression = (expr: string): string => {
    try {
      // Replace scientific functions and constants
      let evalExpr = expr
        .replace(/π/g, Math.PI.toString())
        .replace(/\be\b/g, Math.E.toString());

      // Handle functions like sin(, cos(, etc.
      evalExpr = evalExpr.replace(/sin\(([^)]+)\)/g, (_, val) => {
        const num = parseFloat(val);
        return angleMode === "DEG"
          ? Math.sin(toRad(num)).toString()
          : Math.sin(num).toString();
      });
      evalExpr = evalExpr.replace(/cos\(([^)]+)\)/g, (_, val) => {
        const num = parseFloat(val);
        return angleMode === "DEG"
          ? Math.cos(toRad(num)).toString()
          : Math.cos(num).toString();
      });
      evalExpr = evalExpr.replace(/tan\(([^)]+)\)/g, (_, val) => {
        const num = parseFloat(val);
        return angleMode === "DEG"
          ? Math.tan(toRad(num)).toString()
          : Math.tan(num).toString();
      });
      evalExpr = evalExpr.replace(/log\(([^)]+)\)/g, (_, val) =>
        Math.log10(parseFloat(val)).toString(),
      );
      evalExpr = evalExpr.replace(/ln\(([^)]+)\)/g, (_, val) =>
        Math.log(parseFloat(val)).toString(),
      );
      evalExpr = evalExpr.replace(/sqrt\(([^)]+)\)/g, (_, val) =>
        Math.sqrt(parseFloat(val)).toString(),
      );

      // Handle power operator
      evalExpr = evalExpr.replace(/(\d+\.?\d*)\^(\d+\.?\d*)/g, (_, base, exp) =>
        Math.pow(parseFloat(base), parseFloat(exp)).toString(),
      );

      // eslint-disable-next-line no-eval
      const res = eval(evalExpr);
      if (typeof res !== "number" || isNaN(res)) return "Error";
      // Format result: limit decimals
      const formatted = parseFloat(res.toPrecision(10)).toString();
      return formatted;
    } catch {
      return "Error";
    }
  };

  const handleButton = (btn: CalcButton) => {
    if (btn.value === "AC") {
      setExpression("");
      setDisplay("0");
      setResult("");
      setHasResult(false);
      return;
    }

    if (btn.value === "=") {
      if (!expression) return;
      const res = evaluateExpression(expression);
      setResult(res);
      setDisplay(res);
      setHasResult(true);
      return;
    }

    if (btn.value === "negate") {
      if (display !== "0") {
        if (display.startsWith("-")) {
          setDisplay(display.slice(1));
          setExpression(expression.slice(1));
        } else {
          setDisplay("-" + display);
          setExpression("-" + expression);
        }
      }
      return;
    }

    if (btn.value === "%") {
      try {
        const val = parseFloat(display) / 100;
        setDisplay(val.toString());
        setExpression(val.toString());
      } catch {}
      return;
    }

    // If we just got a result and press a number, start fresh
    if (hasResult && btn.type === "number") {
      setExpression(btn.value);
      setDisplay(btn.value);
      setResult("");
      setHasResult(false);
      return;
    }

    // If we just got a result and press operator, continue from result
    if (hasResult && btn.type === "operator") {
      setExpression(display + btn.value);
      setDisplay(btn.value);
      setResult("");
      setHasResult(false);
      return;
    }

    // Scientific functions open a parenthesis
    const scientificFns = ["sin", "cos", "tan", "log", "ln", "sqrt"];
    if (btn.type === "scientific" && scientificFns.indexOf(btn.value) !== -1) {
      const newExpr = expression + btn.value + "(";
      setExpression(newExpr);
      setDisplay(newExpr);
      setHasResult(false);
      return;
    }

    const newExpr = expression + btn.value;
    setExpression(newExpr);
    setDisplay(newExpr);
    setHasResult(false);
  };

  const handleDelete = () => {
    if (hasResult) {
      setExpression("");
      setDisplay("0");
      setResult("");
      setHasResult(false);
      return;
    }
    const newExpr = expression.slice(0, -1);
    setExpression(newExpr);
    setDisplay(newExpr || "0");
  };

  const getButtonStyle = (type: ButtonType) => {
    switch (type) {
      case "operator":
        return [styles.button, styles.operatorButton];
      case "scientific":
        return [styles.button, styles.scientificButton];
      case "action":
        return [styles.button, styles.actionButton];
      case "equals":
        return [styles.button, styles.equalsButton];
      default:
        return [styles.button, styles.numberButton];
    }
  };

  const getTextStyle = (type: ButtonType) => {
    switch (type) {
      case "operator":
        return [styles.buttonText, styles.operatorText];
      case "scientific":
        return [styles.buttonText, styles.scientificText];
      case "action":
        return [styles.buttonText, styles.actionText];
      case "equals":
        return [styles.buttonText, styles.equalsText];
      default:
        return [styles.buttonText, styles.numberText];
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Calculator</Text>
        <Text style={styles.subheaderText}>Scientific mode</Text>
      </View>

      {/* Display */}
      <View style={styles.displaySection}>
        <View style={styles.displayContainer}>
          {/* Angle Mode Toggle */}
          <View style={styles.angleToggleRow}>
            <TouchableOpacity
              style={[
                styles.angleToggle,
                angleMode === "DEG" && styles.angleToggleActive,
              ]}
              onPress={() => setAngleMode("DEG")}
            >
              <Text
                style={[
                  styles.angleToggleText,
                  angleMode === "DEG" && styles.angleToggleTextActive,
                ]}
              >
                DEG
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.angleToggle,
                angleMode === "RAD" && styles.angleToggleActive,
              ]}
              onPress={() => setAngleMode("RAD")}
            >
              <Text
                style={[
                  styles.angleToggleText,
                  angleMode === "RAD" && styles.angleToggleTextActive,
                ]}
              >
                RAD
              </Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.deleteButton}
            >
              <Ionicons name="backspace-outline" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Expression */}
          <Text
            style={styles.expressionText}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {expression || "0"}
          </Text>

          {/* Result preview */}
          {result ? <Text style={styles.resultPreview}>= {result}</Text> : null}
        </View>
      </View>

      {/* Scientific Buttons */}
      <View style={styles.scientificSection}>
        {scientificButtons.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.buttonRow}>
            {row.map((btn) => (
              <TouchableOpacity
                key={btn.value}
                style={getButtonStyle(btn.type)}
                onPress={() => handleButton(btn)}
                activeOpacity={0.7}
              >
                <Text style={getTextStyle(btn.type)}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Main Buttons */}
      <View style={styles.mainSection}>
        {mainButtons.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.buttonRow}>
            {row.map((btn) => (
              <TouchableOpacity
                key={btn.value}
                style={[
                  ...getButtonStyle(btn.type),
                  btn.wide && styles.wideButton,
                ]}
                onPress={() => handleButton(btn)}
                activeOpacity={0.7}
              >
                <Text style={getTextStyle(btn.type)}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Supports sin, cos, tan, log, ln, √, powers, π, and e. Toggle DEG/RAD
            for angle mode.
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calculator-outline" size={20} color="#10B981" />
          <Text style={styles.infoText}>
            Chain expressions like sin(30) + cos(60) × π for complex
            calculations.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default ScientificCalculator;

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

  // Display
  displaySection: {
    marginBottom: 20,
  },
  displayContainer: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 16,
    minHeight: 130,
    justifyContent: "flex-end",
  },
  angleToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  angleToggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  angleToggleActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  angleToggleText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  angleToggleTextActive: {
    color: "#fff",
  },
  deleteButton: {
    padding: 4,
  },
  expressionText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "300",
    textAlign: "right",
    letterSpacing: 1,
  },
  resultPreview: {
    color: "#10B981",
    fontSize: 20,
    textAlign: "right",
    marginTop: 6,
    fontWeight: "600",
  },

  // Button rows
  scientificSection: {
    marginBottom: 8,
    gap: 8,
  },
  mainSection: {
    gap: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: 12,
  },

  // Buttons
  button: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  wideButton: {
    flex: 2,
  },
  numberButton: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
  },
  operatorButton: {
    backgroundColor: "#0F4C35",
    borderColor: "#10B981",
  },
  scientificButton: {
    backgroundColor: "#1E3A5F",
    borderColor: "#3B82F6",
  },
  actionButton: {
    backgroundColor: "#2D3748",
    borderColor: "#4A5568",
  },
  equalsButton: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },

  // Button text
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  numberText: {
    color: "#F1F5F9",
  },
  operatorText: {
    color: "#10B981",
  },
  scientificText: {
    color: "#60A5FA",
    fontSize: 15,
  },
  actionText: {
    color: "#CBD5E1",
  },
  equalsText: {
    color: "#fff",
  },

  // Info card
  infoCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
    marginTop: 20,
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
