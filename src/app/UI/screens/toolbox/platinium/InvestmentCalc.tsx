import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ── Types ─────────────────────────────────────────────────────────
type CompoundFreq =
  | "annually"
  | "semiannually"
  | "quarterly"
  | "monthly"
  | "daily";
type CalcMode = "growth" | "goal" | "inflation";

interface GrowthResult {
  futureValue: number;
  totalContributions: number;
  totalInterest: number;
  principal: number;
  schedule: ScheduleRow[];
}

interface ScheduleRow {
  year: number;
  balance: number;
  contributions: number;
  interest: number;
}

// ── Constants ─────────────────────────────────────────────────────
const FREQ_OPTIONS: { label: string; value: CompoundFreq; n: number }[] = [
  { label: "Annually", value: "annually", n: 1 },
  { label: "Semi-Annual", value: "semiannually", n: 2 },
  { label: "Quarterly", value: "quarterly", n: 4 },
  { label: "Monthly", value: "monthly", n: 12 },
  { label: "Daily", value: "daily", n: 365 },
];

const TERM_PRESETS = [1, 3, 5, 10, 15, 20, 30];
const RATE_PRESETS = [3, 5, 7, 8, 10, 12];

// ── Helpers ───────────────────────────────────────────────────────
const fmtMoney = (v: number): string => {
  if (v >= 1000000000) return "$" + (v / 1000000000).toFixed(2) + "B";
  if (v >= 1000000) return "$" + (v / 1000000).toFixed(2) + "M";
  if (v >= 1000) return "$" + (v / 1000).toFixed(1) + "K";
  return (
    "$" +
    v.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

const fmtFull = (v: number): string =>
  "$" +
  v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const pct = (part: number, total: number): string =>
  total === 0 ? "0" : ((part / total) * 100).toFixed(1);

// ── Component ─────────────────────────────────────────────────────
const InvestmentCalc: React.FC = () => {
  // Inputs
  const [mode, setMode] = useState<CalcMode>("growth");
  const [principal, setPrincipal] = useState("");
  const [monthlyContrib, setMonthlyContrib] = useState("");
  const [rate, setRate] = useState("");
  const [selectedRate, setSelectedRate] = useState<number | null>(null);
  const [term, setTerm] = useState("");
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [freq, setFreq] = useState<CompoundFreq>("monthly");

  // Goal mode
  const [goalAmount, setGoalAmount] = useState("");
  // Inflation mode
  const [inflationRate, setInflationRate] = useState("");
  const [currentCost, setCurrentCost] = useState("");

  // Output
  const [result, setResult] = useState<GrowthResult | null>(null);
  const [goalResult, setGoalResult] = useState<{
    monthlyNeeded: number;
    totalContribs: number;
  } | null>(null);
  const [inflationResult, setInflationResult] = useState<{
    futureCost: number;
    realReturn: number;
  } | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);

  const resultAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateResult = () => {
    resultAnim.setValue(0);
    Animated.timing(resultAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  // ── Getters ────────────────────────────────────────────────────
  const getRate = (): number =>
    selectedRate !== null ? selectedRate : parseFloat(rate) || 0;
  const getTerm = (): number =>
    selectedTerm !== null ? selectedTerm : parseFloat(term) || 0;
  const getFreqN = (): number =>
    FREQ_OPTIONS.find((f) => f.value === freq)?.n ?? 12;

  const isFormValid = (): boolean => {
    if (mode === "growth")
      return (
        (parseFloat(principal) > 0 || parseFloat(monthlyContrib) > 0) &&
        getRate() > 0 &&
        getTerm() > 0
      );
    if (mode === "goal")
      return parseFloat(goalAmount) > 0 && getRate() > 0 && getTerm() > 0;
    if (mode === "inflation")
      return (
        parseFloat(currentCost) > 0 &&
        parseFloat(inflationRate) > 0 &&
        getTerm() > 0
      );
    return false;
  };

  // ── Calculate Growth ───────────────────────────────────────────
  const calcGrowth = () => {
    const P = parseFloat(principal) || 0;
    const MC = parseFloat(monthlyContrib) || 0;
    const r = getRate() / 100;
    const n = getFreqN();
    const t = getTerm();

    // FV of lump sum: P(1 + r/n)^(nt)
    const fvLump = P * Math.pow(1 + r / n, n * t);

    // FV of periodic contributions (monthly → convert to per-period)
    const periodsPerYear = n;
    const contribPerPeriod = MC * (12 / periodsPerYear);
    const totalPeriods = n * t;
    let fvContribs = 0;
    if (r > 0) {
      const rPeriod = r / n;
      fvContribs =
        contribPerPeriod *
        ((Math.pow(1 + rPeriod, totalPeriods) - 1) / rPeriod);
    } else {
      fvContribs = contribPerPeriod * totalPeriods;
    }

    const futureValue = fvLump + fvContribs;
    const totalContributions = P + MC * 12 * t;
    const totalInterest = futureValue - totalContributions;

    // Year-by-year schedule
    const schedule: ScheduleRow[] = [];
    for (let y = 1; y <= Math.min(t, 30); y++) {
      const bal =
        P * Math.pow(1 + r / n, n * y) +
        (r > 0
          ? contribPerPeriod * ((Math.pow(1 + r / n, n * y) - 1) / (r / n))
          : contribPerPeriod * n * y);
      const contribs = P + MC * 12 * y;
      schedule.push({
        year: y,
        balance: bal,
        contributions: contribs,
        interest: bal - contribs,
      });
    }

    setResult({
      futureValue,
      totalContributions,
      totalInterest,
      principal: P,
      schedule,
    });
    setGoalResult(null);
    setInflationResult(null);
    animateResult();
  };

  // ── Calculate Goal ────────────────────────────────────────────
  const calcGoal = () => {
    const FV = parseFloat(goalAmount) || 0;
    const r = getRate() / 100;
    const n = getFreqN();
    const t = getTerm();

    const rPeriod = r / n;
    const totalPeriods = n * t;
    let monthlyNeeded = 0;

    if (r === 0) {
      monthlyNeeded = FV / (12 * t);
    } else {
      const periodicPayment =
        (FV * rPeriod) / (Math.pow(1 + rPeriod, totalPeriods) - 1);
      monthlyNeeded = periodicPayment * (n / 12);
    }

    setGoalResult({ monthlyNeeded, totalContribs: monthlyNeeded * 12 * t });
    setResult(null);
    setInflationResult(null);
    animateResult();
  };

  // ── Calculate Inflation ───────────────────────────────────────
  const calcInflation = () => {
    const cost = parseFloat(currentCost) || 0;
    const inf = parseFloat(inflationRate) / 100 || 0;
    const inv = getRate() / 100;
    const t = getTerm();

    const futureCost = cost * Math.pow(1 + inf, t);
    const realReturn = ((1 + inv) / (1 + inf) - 1) * 100;

    setInflationResult({ futureCost, realReturn });
    setResult(null);
    setGoalResult(null);
    animateResult();
  };

  const calculate = () => {
    if (!isFormValid()) {
      Alert.alert("Missing Info", "Please fill in all required fields.");
      return;
    }
    if (mode === "growth") calcGrowth();
    if (mode === "goal") calcGoal();
    if (mode === "inflation") calcInflation();
  };

  const clearAll = () => {
    setPrincipal("");
    setMonthlyContrib("");
    setRate("");
    setSelectedRate(null);
    setTerm("");
    setSelectedTerm(null);
    setGoalAmount("");
    setInflationRate("");
    setCurrentCost("");
    setResult(null);
    setGoalResult(null);
    setInflationResult(null);
    setShowSchedule(false);
  };

  const handleRatePreset = (r: number) => {
    setSelectedRate(r);
    setRate("");
    setResult(null);
  };
  const handleTermPreset = (t: number) => {
    setSelectedTerm(t);
    setTerm("");
    setResult(null);
  };

  const hasResult =
    result !== null || goalResult !== null || inflationResult !== null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Investment Calculator</Text>
          <Text style={styles.subheaderText}>Plan your financial future</Text>
        </View>

        {/* Mode Tabs */}
        <View style={styles.modeTabs}>
          {(
            [
              { key: "growth", label: "Growth", icon: "trending-up-outline" },
              { key: "goal", label: "Goal", icon: "flag-outline" },
              {
                key: "inflation",
                label: "Inflation",
                icon: "thermometer-outline",
              },
            ] as { key: CalcMode; label: string; icon: string }[]
          ).map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.modeTab, mode === m.key && styles.modeTabActive]}
              onPress={() => {
                setMode(m.key);
                clearAll();
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={m.icon as any}
                size={15}
                color={mode === m.key ? "#fff" : "#64748B"}
              />
              <Text
                style={[
                  styles.modeTabText,
                  mode === m.key && styles.modeTabTextActive,
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── GROWTH INPUTS ── */}
        {mode === "growth" && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Initial Investment</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currSymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#334155"
                  value={principal}
                  onChangeText={(v) => {
                    setPrincipal(v);
                    setResult(null);
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Monthly Contribution</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currSymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#334155"
                  value={monthlyContrib}
                  onChangeText={(v) => {
                    setMonthlyContrib(v);
                    setResult(null);
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </>
        )}

        {/* ── GOAL INPUTS ── */}
        {mode === "goal" && (
          <View style={styles.section}>
            <Text style={styles.label}>Target Amount</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currSymbol}>$</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 100000"
                placeholderTextColor="#334155"
                value={goalAmount}
                onChangeText={(v) => {
                  setGoalAmount(v);
                  setGoalResult(null);
                }}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        )}

        {/* ── INFLATION INPUTS ── */}
        {mode === "inflation" && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Current Cost / Value</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currSymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 50000"
                  placeholderTextColor="#334155"
                  value={currentCost}
                  onChangeText={(v) => {
                    setCurrentCost(v);
                    setInflationResult(null);
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Inflation Rate</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="flame-outline"
                  size={18}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 3.5"
                  placeholderTextColor="#334155"
                  value={inflationRate}
                  onChangeText={(v) => {
                    setInflationRate(v);
                    setInflationResult(null);
                  }}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.unitSuffix}>%</Text>
              </View>
            </View>
          </>
        )}

        {/* ── SHARED: Rate ── */}
        {mode !== "inflation" && (
          <View style={styles.section}>
            <Text style={styles.label}>Annual Return Rate</Text>
            <View style={styles.presetRow}>
              {RATE_PRESETS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.presetBtn,
                    selectedRate === r && styles.presetBtnActive,
                  ]}
                  onPress={() => handleRatePreset(r)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      selectedRate === r && styles.presetTextActive,
                    ]}
                  >
                    {r}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="trending-up-outline"
                size={18}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Custom %"
                placeholderTextColor="#334155"
                value={rate}
                onChangeText={(v) => {
                  setRate(v);
                  setSelectedRate(null);
                  setResult(null);
                }}
                keyboardType="decimal-pad"
              />
              <Text style={styles.unitSuffix}>%</Text>
            </View>
          </View>
        )}

        {/* Inflation mode investment rate */}
        {mode === "inflation" && (
          <View style={styles.section}>
            <Text style={styles.label}>Investment Return Rate</Text>
            <View style={styles.presetRow}>
              {RATE_PRESETS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.presetBtn,
                    selectedRate === r && styles.presetBtnActive,
                  ]}
                  onPress={() => handleRatePreset(r)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      selectedRate === r && styles.presetTextActive,
                    ]}
                  >
                    {r}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="trending-up-outline"
                size={18}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Custom %"
                placeholderTextColor="#334155"
                value={rate}
                onChangeText={(v) => {
                  setRate(v);
                  setSelectedRate(null);
                }}
                keyboardType="decimal-pad"
              />
              <Text style={styles.unitSuffix}>%</Text>
            </View>
          </View>
        )}

        {/* ── SHARED: Term ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Time Period (Years)</Text>
          <View style={styles.presetRow}>
            {TERM_PRESETS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.presetBtn,
                  selectedTerm === t && styles.presetBtnActive,
                ]}
                onPress={() => handleTermPreset(t)}
              >
                <Text
                  style={[
                    styles.presetText,
                    selectedTerm === t && styles.presetTextActive,
                  ]}
                >
                  {t}yr
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="hourglass-outline"
              size={18}
              color="#64748B"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Custom years"
              placeholderTextColor="#334155"
              value={term}
              onChangeText={(v) => {
                setTerm(v);
                setSelectedTerm(null);
                setResult(null);
              }}
              keyboardType="decimal-pad"
            />
            <Text style={styles.unitSuffix}>yrs</Text>
          </View>
        </View>

        {/* ── Compound Frequency (growth & goal only) ── */}
        {mode !== "inflation" && (
          <View style={styles.section}>
            <Text style={styles.label}>Compound Frequency</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.freqRow}
            >
              {FREQ_OPTIONS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[
                    styles.freqBtn,
                    freq === f.value && styles.freqBtnActive,
                  ]}
                  onPress={() => {
                    setFreq(f.value);
                    setResult(null);
                  }}
                >
                  <Text
                    style={[
                      styles.freqText,
                      freq === f.value && styles.freqTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Calculate Button */}
        <TouchableOpacity
          style={[styles.calcBtn, !isFormValid() && styles.calcBtnDisabled]}
          onPress={calculate}
          disabled={!isFormValid()}
          activeOpacity={0.8}
        >
          <Ionicons name="calculator-outline" size={22} color="#fff" />
          <Text style={styles.calcBtnText}>Calculate</Text>
        </TouchableOpacity>

        {/* ── GROWTH RESULT ── */}
        {result && (
          <Animated.View
            style={[styles.resultSection, { opacity: resultAnim }]}
          >
            {/* Hero banner */}
            <View style={styles.heroBanner}>
              <Text style={styles.heroBannerLabel}>Future Value</Text>
              <Text style={styles.heroBannerValue}>
                {fmtFull(result.futureValue)}
              </Text>
              <Text style={styles.heroBannerSub}>
                after {getTerm()} years at {getRate()}% {freq}
              </Text>
            </View>

            {/* Breakdown */}
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>Breakdown</Text>

              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Initial Investment</Text>
                <Text style={styles.resultRowValue}>
                  {fmtMoney(result.principal)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Total Contributions</Text>
                <Text style={styles.resultRowValue}>
                  {fmtMoney(result.totalContributions)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Interest Earned</Text>
                <Text style={[styles.resultRowValue, { color: "#10B981" }]}>
                  {fmtMoney(result.totalInterest)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Total Value</Text>
                <Text style={[styles.resultRowValue, styles.totalText]}>
                  {fmtMoney(result.futureValue)}
                </Text>
              </View>

              {/* Bar */}
              <View style={styles.barSection}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barContrib,
                      { flex: result.totalContributions / result.futureValue },
                    ]}
                  />
                  <View
                    style={[
                      styles.barInterest,
                      { flex: result.totalInterest / result.futureValue },
                    ]}
                  />
                </View>
                <View style={styles.barLegend}>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#3B82F6" }]}
                    />
                    <Text style={styles.legendText}>
                      Contributions{" "}
                      {pct(result.totalContributions, result.futureValue)}%
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#10B981" }]}
                    />
                    <Text style={styles.legendText}>
                      Interest {pct(result.totalInterest, result.futureValue)}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Summary tiles */}
            <View style={styles.tilesRow}>
              <View style={styles.tile}>
                <Ionicons
                  name="trending-up-outline"
                  size={18}
                  color="#10B981"
                />
                <Text style={styles.tileValue}>{getRate()}%</Text>
                <Text style={styles.tileLabel}>Return</Text>
              </View>
              <View style={styles.tile}>
                <Ionicons name="time-outline" size={18} color="#3B82F6" />
                <Text style={styles.tileValue}>{getTerm()}yr</Text>
                <Text style={styles.tileLabel}>Term</Text>
              </View>
              <View style={styles.tile}>
                <Ionicons name="cash-outline" size={18} color="#F59E0B" />
                <Text style={styles.tileValue}>
                  {fmtMoney(result.totalInterest)}
                </Text>
                <Text style={styles.tileLabel}>Gains</Text>
              </View>
            </View>

            {/* Year-by-year schedule toggle */}
            <TouchableOpacity
              style={styles.scheduleToggle}
              onPress={() => setShowSchedule(!showSchedule)}
            >
              <Text style={styles.scheduleToggleText}>
                {showSchedule ? "Hide" : "Show"} Year-by-Year Schedule
              </Text>
              <Ionicons
                name={showSchedule ? "chevron-up" : "chevron-down"}
                size={16}
                color="#10B981"
              />
            </TouchableOpacity>

            {showSchedule && (
              <View style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <Text style={[styles.scheduleCell, styles.scheduleCellHead]}>
                    Year
                  </Text>
                  <Text style={[styles.scheduleCell, styles.scheduleCellHead]}>
                    Balance
                  </Text>
                  <Text style={[styles.scheduleCell, styles.scheduleCellHead]}>
                    Interest
                  </Text>
                </View>
                {result.schedule.map((row) => (
                  <View
                    key={row.year}
                    style={[
                      styles.scheduleRow,
                      row.year % 2 === 0 && styles.scheduleRowAlt,
                    ]}
                  >
                    <Text style={styles.scheduleCell}>{row.year}</Text>
                    <Text style={styles.scheduleCell}>
                      {fmtMoney(row.balance)}
                    </Text>
                    <Text style={[styles.scheduleCell, { color: "#10B981" }]}>
                      {fmtMoney(row.interest)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── GOAL RESULT ── */}
        {goalResult && (
          <Animated.View
            style={[styles.resultSection, { opacity: resultAnim }]}
          >
            <View style={styles.heroBanner}>
              <Text style={styles.heroBannerLabel}>Monthly Savings Needed</Text>
              <Text style={styles.heroBannerValue}>
                {fmtFull(goalResult.monthlyNeeded)}
              </Text>
              <Text style={styles.heroBannerSub}>
                to reach {fmtMoney(parseFloat(goalAmount))} in {getTerm()} years
              </Text>
            </View>
            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Monthly Contribution</Text>
                <Text style={[styles.resultRowValue, { color: "#10B981" }]}>
                  {fmtFull(goalResult.monthlyNeeded)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>
                  Total You'll Contribute
                </Text>
                <Text style={styles.resultRowValue}>
                  {fmtMoney(goalResult.totalContribs)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Interest Will Cover</Text>
                <Text style={[styles.resultRowValue, { color: "#F59E0B" }]}>
                  {fmtMoney(parseFloat(goalAmount) - goalResult.totalContribs)}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── INFLATION RESULT ── */}
        {inflationResult && (
          <Animated.View
            style={[styles.resultSection, { opacity: resultAnim }]}
          >
            <View style={[styles.heroBanner, { backgroundColor: "#2D1A0D" }]}>
              <Text style={styles.heroBannerLabel}>
                Future Cost (Inflation-Adjusted)
              </Text>
              <Text style={[styles.heroBannerValue, { color: "#F59E0B" }]}>
                {fmtFull(inflationResult.futureCost)}
              </Text>
              <Text style={styles.heroBannerSub}>
                from {fmtMoney(parseFloat(currentCost))} today at{" "}
                {inflationRate}% inflation over {getTerm()} years
              </Text>
            </View>
            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Current Value</Text>
                <Text style={styles.resultRowValue}>
                  {fmtFull(parseFloat(currentCost))}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Future Cost</Text>
                <Text style={[styles.resultRowValue, { color: "#F59E0B" }]}>
                  {fmtFull(inflationResult.futureCost)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Real Return Rate</Text>
                <Text
                  style={[
                    styles.resultRowValue,
                    {
                      color:
                        inflationResult.realReturn >= 0 ? "#10B981" : "#EF4444",
                    },
                  ]}
                >
                  {inflationResult.realReturn.toFixed(2)}%
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Purchasing Power Loss</Text>
                <Text style={[styles.resultRowValue, { color: "#EF4444" }]}>
                  {fmtMoney(
                    inflationResult.futureCost - parseFloat(currentCost),
                  )}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              Growth uses compound interest formula. Goal calculates the
              periodic payment needed to reach a target. Inflation shows real
              purchasing power.
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={styles.infoText}>
              Results are estimates for planning purposes only. Actual returns
              may vary. Consult a financial advisor for investment decisions.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export default InvestmentCalc;

// ─── STYLES ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101828" },
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
  subheaderText: { fontSize: 15, color: "#CBD5E1", textAlign: "center" },

  // Mode tabs
  modeTabs: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 11,
  },
  modeTabActive: { backgroundColor: "#10B981" },
  modeTabText: { color: "#64748B", fontSize: 13, fontWeight: "600" },
  modeTabTextActive: { color: "#fff" },

  // Sections
  section: { marginBottom: 20 },
  label: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },

  // Input
  inputWrapper: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  currSymbol: {
    color: "#10B981",
    fontSize: 22,
    fontWeight: "700",
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    paddingVertical: 14,
  },
  inputIcon: { marginRight: 8 },
  unitSuffix: { color: "#64748B", fontSize: 15, fontWeight: "600" },

  // Presets
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  presetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  presetBtnActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
  presetText: { color: "#94A3B8", fontSize: 13, fontWeight: "600" },
  presetTextActive: { color: "#fff" },

  // Freq
  freqRow: { gap: 8, paddingRight: 4 },
  freqBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  freqBtnActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
  freqText: { color: "#94A3B8", fontSize: 13, fontWeight: "600" },
  freqTextActive: { color: "#fff" },

  // Calculate
  calcBtn: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  calcBtnDisabled: { backgroundColor: "#334155", opacity: 0.5 },
  calcBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  // Results
  resultSection: { gap: 12, marginBottom: 24 },

  heroBanner: {
    backgroundColor: "#0D2E22",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#10B98144",
    padding: 24,
    alignItems: "center",
    gap: 4,
  },
  heroBannerLabel: {
    color: "#6EE7B7",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroBannerValue: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroBannerSub: {
    color: "#475569",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },

  resultCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 18,
  },
  resultCardTitle: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
  },
  resultRowLabel: { color: "#94A3B8", fontSize: 14 },
  resultRowValue: { color: "#E2E8F0", fontSize: 14, fontWeight: "600" },
  totalText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#334155", marginVertical: 6 },

  barSection: { marginTop: 16 },
  barTrack: {
    height: 10,
    borderRadius: 5,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 10,
  },
  barContrib: { backgroundColor: "#3B82F6", height: "100%" },
  barInterest: { backgroundColor: "#10B981", height: "100%" },
  barLegend: { flexDirection: "row", gap: 20 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: "#94A3B8", fontSize: 11 },

  tilesRow: { flexDirection: "row", gap: 10 },
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
  tileValue: { color: "#fff", fontSize: 15, fontWeight: "700" },
  tileLabel: { color: "#64748B", fontSize: 11, textAlign: "center" },

  scheduleToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  scheduleToggleText: { color: "#10B981", fontSize: 14, fontWeight: "600" },

  scheduleCard: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
  },
  scheduleHeader: {
    flexDirection: "row",
    backgroundColor: "#0F172A",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  scheduleRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  scheduleRowAlt: { backgroundColor: "#0F172A" },
  scheduleCell: {
    flex: 1,
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
  },
  scheduleCellHead: { color: "#E2E8F0", fontWeight: "700" },

  clearBtn: {
    backgroundColor: "#334155",
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  clearBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

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
