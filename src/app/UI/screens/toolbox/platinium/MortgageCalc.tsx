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
type MortgageType = "fixed" | "interest_only";
type RepayFreq = "monthly" | "fortnightly" | "weekly";

interface MortgageResult {
  payment: number;
  totalRepayment: number;
  totalInterest: number;
  loanAmount: number;
  depositAmount: number;
  lvr: number;
  schedule: ScheduleRow[];
  numPayments: number;
  freq: RepayFreq;
}

interface ScheduleRow {
  year: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

// ── Constants ─────────────────────────────────────────────────────
const TERM_PRESETS = [10, 15, 20, 25, 30];
const RATE_PRESETS = [3, 4, 5, 6, 7, 8];
const DEPOSIT_PRESETS = [5, 10, 15, 20, 25, 30]; // %

const FREQ_CONFIG: Record<
  RepayFreq,
  { label: string; periods: number; icon: string }
> = {
  monthly: { label: "Monthly", periods: 12, icon: "calendar-outline" },
  fortnightly: { label: "Fortnightly", periods: 26, icon: "today-outline" },
  weekly: { label: "Weekly", periods: 52, icon: "time-outline" },
};

// ── Helpers ───────────────────────────────────────────────────────
const fmtMoney = (v: number, sym = "$"): string => {
  if (v >= 1e9) return sym + (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return sym + (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return sym + (v / 1e3).toFixed(1) + "K";
  return (
    sym +
    v.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

const fmtFull = (v: number, sym = "$"): string =>
  sym +
  v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const pctOf = (part: number, total: number): string =>
  total === 0 ? "0" : ((part / total) * 100).toFixed(1);

// ── Component ─────────────────────────────────────────────────────
const MortgageCalc: React.FC = () => {
  // Inputs
  const [currency, setCurrency] = useState("$");
  const [propertyPrice, setPropertyPrice] = useState("");
  const [depositPct, setDepositPct] = useState("");
  const [selectedDep, setSelectedDep] = useState<number | null>(20);
  const [interestRate, setInterestRate] = useState("");
  const [selectedRate, setSelectedRate] = useState<number | null>(null);
  const [loanTerm, setLoanTerm] = useState("");
  const [selectedTerm, setSelectedTerm] = useState<number | null>(25);
  const [mortgageType, setMortgageType] = useState<MortgageType>("fixed");
  const [repayFreq, setRepayFreq] = useState<RepayFreq>("monthly");
  const [extraPayment, setExtraPayment] = useState("");

  // Output
  const [result, setResult] = useState<MortgageResult | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);

  const resultAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    resultAnim.setValue(0);
    Animated.timing(resultAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  // ── Getters ───────────────────────────────────────────────────
  const getRate = (): number =>
    selectedRate !== null ? selectedRate : parseFloat(interestRate) || 0;
  const getTerm = (): number =>
    selectedTerm !== null ? selectedTerm : parseFloat(loanTerm) || 0;
  const getDepPct = (): number =>
    selectedDep !== null ? selectedDep : parseFloat(depositPct) || 0;
  const getExtra = (): number => parseFloat(extraPayment) || 0;

  const isValid = (): boolean =>
    parseFloat(propertyPrice) > 0 &&
    getRate() > 0 &&
    getTerm() > 0 &&
    getDepPct() >= 0;

  // ── Calculate ─────────────────────────────────────────────────
  const calculate = () => {
    if (!isValid()) {
      Alert.alert("Missing Info", "Please fill in all required fields.");
      return;
    }

    const price = parseFloat(propertyPrice);
    const dep = (getDepPct() / 100) * price;
    const loan = price - dep;
    const annualRate = getRate() / 100;
    const years = getTerm();
    const periods = FREQ_CONFIG[repayFreq].periods;
    const numPayments = years * periods;
    const periodicRate = annualRate / periods;
    const extra = getExtra();

    let payment = 0;
    if (mortgageType === "interest_only") {
      payment = loan * periodicRate;
    } else {
      if (periodicRate === 0) {
        payment = loan / numPayments;
      } else {
        payment =
          (loan * (periodicRate * Math.pow(1 + periodicRate, numPayments))) /
          (Math.pow(1 + periodicRate, numPayments) - 1);
      }
    }
    payment += extra;

    // Amortisation schedule (year by year, max 30 rows)
    const schedule: ScheduleRow[] = [];
    let balance = loan;
    let yearlyPayment = 0;
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;
    let totalPaid = 0;
    let period = 0;

    while (balance > 0.01 && period < numPayments + periods) {
      const interestCharge = balance * periodicRate;
      const principalCharge = Math.min(
        mortgageType === "interest_only" ? 0 : payment - interestCharge,
        balance,
      );
      balance = Math.max(balance - principalCharge, 0);
      yearlyPayment += payment;
      yearlyPrincipal += principalCharge;
      yearlyInterest += interestCharge;
      totalPaid += payment;
      period++;

      if (period % periods === 0 || balance <= 0.01) {
        const yr = Math.ceil(period / periods);
        if (yr <= 30) {
          schedule.push({
            year: yr,
            payment: yearlyPayment,
            principal: yearlyPrincipal,
            interest: yearlyInterest,
            balance: Math.max(balance, 0),
          });
        }
        yearlyPayment = 0;
        yearlyPrincipal = 0;
        yearlyInterest = 0;
      }
      if (balance <= 0.01) break;
    }

    const totalRepayment = totalPaid;
    const totalInterest = totalRepayment - loan;
    const lvr = (loan / price) * 100;

    setResult({
      payment,
      totalRepayment,
      totalInterest,
      loanAmount: loan,
      depositAmount: dep,
      lvr,
      schedule,
      numPayments: period,
      freq: repayFreq,
    });
    animateIn();
  };

  const clearAll = () => {
    setPropertyPrice("");
    setDepositPct("");
    setSelectedDep(20);
    setInterestRate("");
    setSelectedRate(null);
    setLoanTerm("");
    setSelectedTerm(25);
    setExtraPayment("");
    setResult(null);
    setShowSchedule(false);
  };

  const freqCfg = FREQ_CONFIG[repayFreq];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Mortgage Calculator</Text>
          <Text style={styles.subheaderText}>
            Plan your home loan repayments
          </Text>
        </View>

        {/* Currency picker */}
        <View style={styles.currencyRow}>
          {["$", "£", "€", "₦", "A$"].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.currBtn, currency === s && styles.currBtnActive]}
              onPress={() => setCurrency(s)}
            >
              <Text
                style={[
                  styles.currBtnText,
                  currency === s && styles.currBtnTextActive,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Property Price */}
        <View style={styles.section}>
          <Text style={styles.label}>Property Price</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currSymbol}>{currency}</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#334155"
              value={propertyPrice}
              onChangeText={(v) => {
                setPropertyPrice(v);
                setResult(null);
              }}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Deposit */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Deposit{" "}
            {propertyPrice && getDepPct() > 0 && (
              <Text style={styles.labelNote}>
                ({currency}
                {fmtMoney(
                  (parseFloat(propertyPrice) * getDepPct()) / 100,
                ).replace(currency, "")}
                )
              </Text>
            )}
          </Text>
          <View style={styles.presetRow}>
            {DEPOSIT_PRESETS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.presetBtn,
                  selectedDep === d && styles.presetBtnActive,
                ]}
                onPress={() => {
                  setSelectedDep(d);
                  setDepositPct("");
                  setResult(null);
                }}
              >
                <Text
                  style={[
                    styles.presetText,
                    selectedDep === d && styles.presetTextActive,
                  ]}
                >
                  {d}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="home-outline"
              size={18}
              color="#64748B"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Custom %"
              placeholderTextColor="#334155"
              value={depositPct}
              onChangeText={(v) => {
                setDepositPct(v);
                setSelectedDep(null);
                setResult(null);
              }}
              keyboardType="decimal-pad"
            />
            <Text style={styles.unitSuffix}>%</Text>
          </View>
        </View>

        {/* Interest Rate */}
        <View style={styles.section}>
          <Text style={styles.label}>Annual Interest Rate</Text>
          <View style={styles.presetRow}>
            {RATE_PRESETS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.presetBtn,
                  selectedRate === r && styles.presetBtnActive,
                ]}
                onPress={() => {
                  setSelectedRate(r);
                  setInterestRate("");
                  setResult(null);
                }}
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
              value={interestRate}
              onChangeText={(v) => {
                setInterestRate(v);
                setSelectedRate(null);
                setResult(null);
              }}
              keyboardType="decimal-pad"
            />
            <Text style={styles.unitSuffix}>%</Text>
          </View>
        </View>

        {/* Loan Term */}
        <View style={styles.section}>
          <Text style={styles.label}>Loan Term</Text>
          <View style={styles.presetRow}>
            {TERM_PRESETS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.presetBtn,
                  selectedTerm === t && styles.presetBtnActive,
                ]}
                onPress={() => {
                  setSelectedTerm(t);
                  setLoanTerm("");
                  setResult(null);
                }}
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
              value={loanTerm}
              onChangeText={(v) => {
                setLoanTerm(v);
                setSelectedTerm(null);
                setResult(null);
              }}
              keyboardType="decimal-pad"
            />
            <Text style={styles.unitSuffix}>yrs</Text>
          </View>
        </View>

        {/* Mortgage Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Mortgage Type</Text>
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                mortgageType === "fixed" && styles.typeBtnActive,
              ]}
              onPress={() => {
                setMortgageType("fixed");
                setResult(null);
              }}
            >
              <Ionicons
                name="lock-closed-outline"
                size={15}
                color={mortgageType === "fixed" ? "#fff" : "#64748B"}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  mortgageType === "fixed" && styles.typeBtnTextActive,
                ]}
              >
                Principal + Interest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                mortgageType === "interest_only" && styles.typeBtnActive,
              ]}
              onPress={() => {
                setMortgageType("interest_only");
                setResult(null);
              }}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={15}
                color={mortgageType === "interest_only" ? "#fff" : "#64748B"}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  mortgageType === "interest_only" && styles.typeBtnTextActive,
                ]}
              >
                Interest Only
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Repayment Frequency */}
        <View style={styles.section}>
          <Text style={styles.label}>Repayment Frequency</Text>
          <View style={styles.freqRow}>
            {(Object.keys(FREQ_CONFIG) as RepayFreq[]).map((f) => {
              const cfg = FREQ_CONFIG[f];
              const isActive = repayFreq === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.freqBtn, isActive && styles.freqBtnActive]}
                  onPress={() => {
                    setRepayFreq(f);
                    setResult(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={cfg.icon as any}
                    size={15}
                    color={isActive ? "#fff" : "#64748B"}
                  />
                  <Text
                    style={[styles.freqText, isActive && styles.freqTextActive]}
                  >
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Extra Payment */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Extra {freqCfg.label} Payment{" "}
            <Text style={styles.labelNote}>(optional)</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currSymbol}>{currency}</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#334155"
              value={extraPayment}
              onChangeText={(v) => {
                setExtraPayment(v);
                setResult(null);
              }}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Calculate Button */}
        <TouchableOpacity
          style={[styles.calcBtn, !isValid() && styles.calcBtnDisabled]}
          onPress={calculate}
          disabled={!isValid()}
          activeOpacity={0.8}
        >
          <Ionicons name="calculator-outline" size={22} color="#fff" />
          <Text style={styles.calcBtnText}>Calculate Mortgage</Text>
        </TouchableOpacity>

        {/* ── RESULT ── */}
        {result && (
          <Animated.View
            style={[styles.resultSection, { opacity: resultAnim }]}
          >
            {/* Hero banner */}
            <View style={styles.heroBanner}>
              <Text style={styles.heroBannerLabel}>
                {freqCfg.label} Repayment
              </Text>
              <Text style={styles.heroBannerValue}>
                {fmtFull(result.payment, currency)}
              </Text>
              <Text style={styles.heroBannerSub}>
                {getTerm()} years · {getRate()}% ·{" "}
                {mortgageType === "fixed" ? "P+I" : "Interest Only"}
              </Text>
            </View>

            {/* LVR badge */}
            <View
              style={[
                styles.lvrBadge,
                result.lvr > 80 ? styles.lvrBadgeWarn : styles.lvrBadgeOk,
              ]}
            >
              <Ionicons
                name={
                  result.lvr > 80
                    ? "warning-outline"
                    : "shield-checkmark-outline"
                }
                size={16}
                color={result.lvr > 80 ? "#F59E0B" : "#10B981"}
              />
              <Text
                style={[
                  styles.lvrText,
                  result.lvr > 80 ? styles.lvrTextWarn : styles.lvrTextOk,
                ]}
              >
                LVR {result.lvr.toFixed(1)}%
                {result.lvr > 80 ? " — LMI may apply" : " — No LMI required"}
              </Text>
            </View>

            {/* Breakdown card */}
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>Loan Breakdown</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Property Price</Text>
                <Text style={styles.resultRowValue}>
                  {fmtMoney(parseFloat(propertyPrice), currency)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>
                  Deposit ({getDepPct()}%)
                </Text>
                <Text style={[styles.resultRowValue, { color: "#10B981" }]}>
                  {fmtMoney(result.depositAmount, currency)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Loan Amount</Text>
                <Text style={styles.resultRowValue}>
                  {fmtMoney(result.loanAmount, currency)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Total Interest</Text>
                <Text style={[styles.resultRowValue, { color: "#F59E0B" }]}>
                  {fmtMoney(result.totalInterest, currency)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Total Repayment</Text>
                <Text style={[styles.resultRowValue, styles.totalText]}>
                  {fmtMoney(result.totalRepayment, currency)}
                </Text>
              </View>

              {/* Bar */}
              <View style={styles.barSection}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barLoan,
                      {
                        flex: result.loanAmount / result.totalRepayment,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.barInterest,
                      {
                        flex: result.totalInterest / result.totalRepayment,
                      },
                    ]}
                  />
                </View>
                <View style={styles.barLegend}>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#3B82F6" }]}
                    />
                    <Text style={styles.legendText}>
                      Principal{" "}
                      {pctOf(result.loanAmount, result.totalRepayment)}%
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#F59E0B" }]}
                    />
                    <Text style={styles.legendText}>
                      Interest{" "}
                      {pctOf(result.totalInterest, result.totalRepayment)}%
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
                  size={17}
                  color="#3B82F6"
                />
                <Text style={styles.tileValue}>{getRate()}%</Text>
                <Text style={styles.tileLabel}>Rate</Text>
              </View>
              <View style={styles.tile}>
                <Ionicons name="time-outline" size={17} color="#8B5CF6" />
                <Text style={styles.tileValue}>{getTerm()}yr</Text>
                <Text style={styles.tileLabel}>Term</Text>
              </View>
              <View style={styles.tile}>
                <Ionicons name="cash-outline" size={17} color="#F59E0B" />
                <Text style={styles.tileValue}>
                  {fmtMoney(result.totalInterest, currency)}
                </Text>
                <Text style={styles.tileLabel}>Interest</Text>
              </View>
              <View style={styles.tile}>
                <Ionicons name="home-outline" size={17} color="#10B981" />
                <Text style={styles.tileValue}>{result.lvr.toFixed(0)}%</Text>
                <Text style={styles.tileLabel}>LVR</Text>
              </View>
            </View>

            {/* Year-by-year schedule */}
            <TouchableOpacity
              style={styles.scheduleToggle}
              onPress={() => setShowSchedule(!showSchedule)}
            >
              <Text style={styles.scheduleToggleText}>
                {showSchedule ? "Hide" : "Show"} Amortisation Schedule
              </Text>
              <Ionicons
                name={showSchedule ? "chevron-up" : "chevron-down"}
                size={16}
                color="#10B981"
              />
            </TouchableOpacity>

            {showSchedule && (
              <View style={styles.scheduleCard}>
                <View style={styles.scheduleHeaderRow}>
                  <Text
                    style={[
                      styles.schedCell,
                      styles.schedCellHead,
                      { flex: 0.6 },
                    ]}
                  >
                    Yr
                  </Text>
                  <Text style={[styles.schedCell, styles.schedCellHead]}>
                    Payment
                  </Text>
                  <Text style={[styles.schedCell, styles.schedCellHead]}>
                    Interest
                  </Text>
                  <Text style={[styles.schedCell, styles.schedCellHead]}>
                    Balance
                  </Text>
                </View>
                {result.schedule.map((row) => (
                  <View
                    key={row.year}
                    style={[
                      styles.schedRow,
                      row.year % 2 === 0 && styles.schedRowAlt,
                    ]}
                  >
                    <Text style={[styles.schedCell, { flex: 0.6 }]}>
                      {row.year}
                    </Text>
                    <Text style={styles.schedCell}>
                      {fmtMoney(row.payment, currency)}
                    </Text>
                    <Text style={[styles.schedCell, { color: "#F59E0B" }]}>
                      {fmtMoney(row.interest, currency)}
                    </Text>
                    <Text style={styles.schedCell}>
                      {fmtMoney(row.balance, currency)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Clear */}
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
              LVR (Loan-to-Value Ratio) above 80% typically requires Lenders
              Mortgage Insurance (LMI).
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#10B981" />
            <Text style={styles.infoText}>
              Fortnightly payments (26/yr) reduce total interest more than
              monthly (12/yr) over the life of the loan.
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color="#F59E0B" />
            <Text style={styles.infoText}>
              Results are estimates only. Actual repayments may vary. Consult
              your lender or a financial adviser.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export default MortgageCalc;

// ─── STYLES ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101828" },
  contentContainer: {
    padding: 20,
    paddingTop: Platform.OS === "android" ? 40 : 60,
    paddingBottom: 40,
  },

  header: { marginBottom: 20 },
  headerText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subheaderText: { fontSize: 15, color: "#CBD5E1", textAlign: "center" },

  // Currency row
  currencyRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    justifyContent: "center",
  },
  currBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  currBtnActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
  currBtnText: { color: "#64748B", fontSize: 14, fontWeight: "700" },
  currBtnTextActive: { color: "#fff" },

  // Sections
  section: { marginBottom: 20 },
  label: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  labelNote: { color: "#64748B", fontSize: 13, fontWeight: "400" },

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
    fontSize: 20,
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
  unitSuffix: { color: "#64748B", fontSize: 14, fontWeight: "600" },

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

  // Type toggle
  typeToggle: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 4,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  typeBtnActive: { backgroundColor: "#10B981" },
  typeBtnText: { color: "#64748B", fontSize: 13, fontWeight: "600" },
  typeBtnTextActive: { color: "#fff" },

  // Freq
  freqRow: { flexDirection: "row", gap: 8 },
  freqBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  freqBtnActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
  freqText: { color: "#64748B", fontSize: 12, fontWeight: "600" },
  freqTextActive: { color: "#fff" },

  // Calc button
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
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroBannerValue: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroBannerSub: {
    color: "#475569",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },

  lvrBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  lvrBadgeOk: { backgroundColor: "#0D2E22", borderColor: "#10B98133" },
  lvrBadgeWarn: { backgroundColor: "#2D2010", borderColor: "#F59E0B33" },
  lvrText: { fontSize: 13, fontWeight: "600" },
  lvrTextOk: { color: "#10B981" },
  lvrTextWarn: { color: "#F59E0B" },

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
    paddingVertical: 8,
  },
  resultRowLabel: { color: "#94A3B8", fontSize: 14 },
  resultRowValue: { color: "#E2E8F0", fontSize: 14, fontWeight: "600" },
  totalText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#334155", marginVertical: 4 },

  barSection: { marginTop: 16 },
  barTrack: {
    height: 10,
    borderRadius: 5,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 10,
  },
  barLoan: { backgroundColor: "#3B82F6", height: "100%" },
  barInterest: { backgroundColor: "#F59E0B", height: "100%" },
  barLegend: { flexDirection: "row", gap: 20 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: "#94A3B8", fontSize: 11 },

  tilesRow: { flexDirection: "row", gap: 8 },
  tile: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    alignItems: "center",
    gap: 5,
  },
  tileValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  tileLabel: { color: "#64748B", fontSize: 10, textAlign: "center" },

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
  scheduleHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#0F172A",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  schedRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10 },
  schedRowAlt: { backgroundColor: "#0F172A" },
  schedCell: { flex: 1, color: "#94A3B8", fontSize: 11, textAlign: "center" },
  schedCellHead: { color: "#E2E8F0", fontWeight: "700" },

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
