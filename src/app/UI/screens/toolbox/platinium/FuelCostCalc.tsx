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
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import VersionBadge from "../../../component/VersionBadge";

// ── Types
type FuelUnit = "liters" | "gallons";
type DistUnit = "km" | "miles";
type CalcMode = "trip" | "efficiency" | "budget";

interface TripResult {
  fuelNeeded: number;
  totalCost: number;
  costPerKm: number;
  costPer100km: number;
  co2Kg: number;
}

interface EffResult {
  efficiency: number; // L/100km or MPG
  costPerUnit: number; // cost per km or mile
  annualCost: number;
}

interface BudgetResult {
  distancePossible: number;
  fuelPossible: number;
  refills: number;
}

// ── Constants
const FUEL_PRESETS = [1.2, 1.5, 1.8, 2.0, 2.5, 3.0];
const EFFICIENCY_PRESETS_L = [5, 7, 9, 12, 15]; // L/100km
const EFFICIENCY_PRESETS_MPG = [20, 30, 40, 50, 60];
const DISTANCE_PRESETS = [50, 100, 200, 500, 1000];
const TANK_PRESETS = [30, 40, 50, 60, 70];

const CO2_PER_LITER = 2.31; // kg CO2 per litre petrol
const LITRES_PER_GALLON = 3.785411784;
const KM_PER_MILE = 1.609344;

// ── Helpers
const fmt2 = (v: number): string =>
  v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmt1 = (v: number): string =>
  v.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

const fmtMoney = (v: number, symbol: string): string => symbol + fmt2(v);

// Convert efficiency to L/100km for internal calc
const toLper100 = (
  val: number,
  fuelUnit: FuelUnit,
  distUnit: DistUnit,
): number => {
  if (fuelUnit === "liters" && distUnit === "km") return val; // already L/100km
  if (fuelUnit === "gallons" && distUnit === "miles") {
    // MPG → L/100km
    return (100 * LITRES_PER_GALLON) / (val * KM_PER_MILE);
  }
  if (fuelUnit === "liters" && distUnit === "miles") {
    return val / KM_PER_MILE; // L/100mi → L/100km
  }
  // gallons/100km
  return val * LITRES_PER_GALLON;
};

const toDisplayDist = (km: number, distUnit: DistUnit): number =>
  distUnit === "miles" ? km / KM_PER_MILE : km;

const toDisplayFuel = (liters: number, fuelUnit: FuelUnit): number =>
  fuelUnit === "gallons" ? liters / LITRES_PER_GALLON : liters;

// ── Component
const FuelCostCalc: React.FC = () => {
  const [mode, setMode] = useState<CalcMode>("trip");
  const [fuelUnit, setFuelUnit] = useState<FuelUnit>("liters");
  const [distUnit, setDistUnit] = useState<DistUnit>("km");
  const [currency, setCurrency] = useState("$");

  // Shared
  const [fuelPrice, setFuelPrice] = useState("");
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [efficiency, setEfficiency] = useState("");
  const [selectedEff, setSelectedEff] = useState<number | null>(null);

  // Trip mode
  const [distance, setDistance] = useState("");
  const [selectedDist, setSelectedDist] = useState<number | null>(null);

  // Budget mode
  const [budget, setBudget] = useState("");
  const [tankSize, setTankSize] = useState("");
  const [selectedTank, setSelectedTank] = useState<number | null>(null);

  // Efficiency mode
  const [fuelUsed, setFuelUsed] = useState("");
  const [distTravelled, setDistTravelled] = useState("");

  // Results
  const [tripResult, setTripResult] = useState<TripResult | null>(null);
  const [effResult, setEffResult] = useState<EffResult | null>(null);
  const [budgetResult, setBudgetResult] = useState<BudgetResult | null>(null);

  const resultAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    resultAnim.setValue(0);
    Animated.timing(resultAnim, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start();
  };

  // ── Derived labels
  const effLabel =
    fuelUnit === "liters" && distUnit === "km"
      ? "L/100km"
      : fuelUnit === "gallons" && distUnit === "miles"
        ? "MPG"
        : fuelUnit === "liters"
          ? "L/100mi"
          : "gal/100km";

  const priceLabel = `${currency}/${fuelUnit === "liters" ? "L" : "gal"}`;
  const distLabel = distUnit;

  // ── Getters
  const getPrice = (): number =>
    selectedPrice !== null ? selectedPrice : parseFloat(fuelPrice) || 0;
  const getEff = (): number =>
    selectedEff !== null ? selectedEff : parseFloat(efficiency) || 0;
  const getDist = (): number =>
    selectedDist !== null ? selectedDist : parseFloat(distance) || 0;
  const getTank = (): number =>
    selectedTank !== null ? selectedTank : parseFloat(tankSize) || 0;

  // ── Validation
  const isValid = (): boolean => {
    if (mode === "trip") return getPrice() > 0 && getEff() > 0 && getDist() > 0;
    if (mode === "efficiency")
      return (
        parseFloat(fuelUsed) > 0 &&
        parseFloat(distTravelled) > 0 &&
        getPrice() > 0
      );
    if (mode === "budget")
      return parseFloat(budget) > 0 && getPrice() > 0 && getEff() > 0;
    return false;
  };

  // ── Calculate Trip
  const calcTrip = () => {
    const price = getPrice();
    const eff = getEff();
    const dist = getDist();

    // Convert inputs to km & litres
    const distKm = distUnit === "miles" ? dist * KM_PER_MILE : dist;
    const effL100 = toLper100(eff, fuelUnit, distUnit);
    const pricePerL =
      fuelUnit === "gallons" ? price / LITRES_PER_GALLON : price;

    const fuelNeededL = (distKm / 100) * effL100;
    const totalCost = fuelNeededL * pricePerL;
    const costPerKm = totalCost / distKm;
    const costPer100km = costPerKm * 100;
    const co2Kg = fuelNeededL * CO2_PER_LITER;

    setTripResult({
      fuelNeeded: toDisplayFuel(fuelNeededL, fuelUnit),
      totalCost,
      costPerKm: distUnit === "miles" ? costPerKm * KM_PER_MILE : costPerKm,
      costPer100km:
        distUnit === "miles" ? costPerKm * 100 * KM_PER_MILE : costPer100km,
      co2Kg,
    });
    setEffResult(null);
    setBudgetResult(null);
    animateIn();
  };

  // ── Calculate Efficiency
  const calcEfficiency = () => {
    const fuel = parseFloat(fuelUsed) || 0;
    const dist = parseFloat(distTravelled) || 0;
    const price = getPrice();

    const fuelL = fuelUnit === "gallons" ? fuel * LITRES_PER_GALLON : fuel;
    const distKm = distUnit === "miles" ? dist * KM_PER_MILE : dist;
    const pricePerL =
      fuelUnit === "gallons" ? price / LITRES_PER_GALLON : price;

    let effDisplay: number;
    if (fuelUnit === "gallons" && distUnit === "miles") {
      effDisplay = dist / fuel; // MPG
    } else if (fuelUnit === "liters" && distUnit === "km") {
      effDisplay = (fuelL / distKm) * 100; // L/100km
    } else {
      effDisplay = (fuelL / distKm) * 100;
    }

    const costPerKm = (fuelL * pricePerL) / distKm;
    const annualKm = 15000;
    const annualCost = (annualKm / 100) * ((fuelL / distKm) * 100) * pricePerL;

    setEffResult({
      efficiency: effDisplay,
      costPerUnit: distUnit === "miles" ? costPerKm * KM_PER_MILE : costPerKm,
      annualCost,
    });
    setTripResult(null);
    setBudgetResult(null);
    animateIn();
  };

  // ── Calculate Budget
  const calcBudget = () => {
    const bud = parseFloat(budget) || 0;
    const price = getPrice();
    const eff = getEff();
    const tank = getTank();

    const pricePerL =
      fuelUnit === "gallons" ? price / LITRES_PER_GALLON : price;
    const effL100 = toLper100(eff, fuelUnit, distUnit);
    const fuelL = bud / pricePerL;
    const distKm = (fuelL / effL100) * 100;
    const tankL = fuelUnit === "gallons" ? tank * LITRES_PER_GALLON : tank;
    const refills = fuelL / (tankL || 1);

    setBudgetResult({
      distancePossible: toDisplayDist(distKm, distUnit),
      fuelPossible: toDisplayFuel(fuelL, fuelUnit),
      refills,
    });
    setTripResult(null);
    setEffResult(null);
    animateIn();
  };

  const calculate = () => {
    if (!isValid()) {
      Alert.alert("Missing Info", "Please fill in all required fields.");
      return;
    }
    if (mode === "trip") calcTrip();
    if (mode === "efficiency") calcEfficiency();
    if (mode === "budget") calcBudget();
  };

  const clearAll = () => {
    setFuelPrice("");
    setSelectedPrice(null);
    setEfficiency("");
    setSelectedEff(null);
    setDistance("");
    setSelectedDist(null);
    setBudget("");
    setTankSize("");
    setSelectedTank(null);
    setFuelUsed("");
    setDistTravelled("");
    setTripResult(null);
    setEffResult(null);
    setBudgetResult(null);
  };

  const hasResult =
    tripResult !== null || effResult !== null || budgetResult !== null;
  const effPresets =
    fuelUnit === "liters" ? EFFICIENCY_PRESETS_L : EFFICIENCY_PRESETS_MPG;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <VersionBadge version="0.03" />
        </View>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Fuel Cost Calculator</Text>
          <Text style={styles.subheaderText}>
            Plan trips, track efficiency & manage fuel budget
          </Text>
        </View>

        {/* Unit toggles */}
        <View style={styles.unitRow}>
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                fuelUnit === "liters" && styles.unitBtnActive,
              ]}
              onPress={() => {
                setFuelUnit("liters");
                clearAll();
              }}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  fuelUnit === "liters" && styles.unitBtnTextActive,
                ]}
              >
                Litres
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                fuelUnit === "gallons" && styles.unitBtnActive,
              ]}
              onPress={() => {
                setFuelUnit("gallons");
                clearAll();
              }}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  fuelUnit === "gallons" && styles.unitBtnTextActive,
                ]}
              >
                Gallons
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                distUnit === "km" && styles.unitBtnActive,
              ]}
              onPress={() => {
                setDistUnit("km");
                clearAll();
              }}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  distUnit === "km" && styles.unitBtnTextActive,
                ]}
              >
                KM
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                distUnit === "miles" && styles.unitBtnActive,
              ]}
              onPress={() => {
                setDistUnit("miles");
                clearAll();
              }}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  distUnit === "miles" && styles.unitBtnTextActive,
                ]}
              >
                Miles
              </Text>
            </TouchableOpacity>
          </View>
          {/* Currency quick pick */}
          <View style={styles.unitToggle}>
            {["$", "£", "€"].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.unitBtn, currency === s && styles.unitBtnActive]}
                onPress={() => setCurrency(s)}
              >
                <Text
                  style={[
                    styles.unitBtnText,
                    currency === s && styles.unitBtnTextActive,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mode Tabs */}
        <View style={styles.modeTabs}>
          {(
            [
              { key: "trip", label: "Trip Cost", icon: "car-outline" },
              {
                key: "efficiency",
                label: "Efficiency",
                icon: "speedometer-outline",
              },
              { key: "budget", label: "Budget", icon: "wallet-outline" },
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

        {/* ── TRIP INPUTS */}
        {mode === "trip" && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Distance ({distLabel})</Text>
              <View style={styles.presetRow}>
                {DISTANCE_PRESETS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.presetBtn,
                      selectedDist === d && styles.presetBtnActive,
                    ]}
                    onPress={() => {
                      setSelectedDist(d);
                      setDistance("");
                      setTripResult(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        selectedDist === d && styles.presetTextActive,
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="navigate-outline"
                  size={18}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={`Custom ${distLabel}`}
                  placeholderTextColor="#334155"
                  value={distance}
                  onChangeText={(v) => {
                    setDistance(v);
                    setSelectedDist(null);
                    setTripResult(null);
                  }}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.unitSuffix}>{distLabel}</Text>
              </View>
            </View>
          </>
        )}

        {/* ── EFFICIENCY INPUTS */}
        {mode === "efficiency" && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>
                Fuel Used ({fuelUnit === "liters" ? "L" : "gal"})
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="water-outline"
                  size={18}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 45"
                  placeholderTextColor="#334155"
                  value={fuelUsed}
                  onChangeText={(v) => {
                    setFuelUsed(v);
                    setEffResult(null);
                  }}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.unitSuffix}>
                  {fuelUnit === "liters" ? "L" : "gal"}
                </Text>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Distance Travelled ({distLabel})</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="navigate-outline"
                  size={18}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 500"
                  placeholderTextColor="#334155"
                  value={distTravelled}
                  onChangeText={(v) => {
                    setDistTravelled(v);
                    setEffResult(null);
                  }}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.unitSuffix}>{distLabel}</Text>
              </View>
            </View>
          </>
        )}

        {/* ── BUDGET INPUTS */}
        {mode === "budget" && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Fuel Budget ({currency})</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currSymbol}>{currency}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 50"
                  placeholderTextColor="#334155"
                  value={budget}
                  onChangeText={(v) => {
                    setBudget(v);
                    setBudgetResult(null);
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>
                Tank Size ({fuelUnit === "liters" ? "L" : "gal"})
              </Text>
              <View style={styles.presetRow}>
                {TANK_PRESETS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.presetBtn,
                      selectedTank === t && styles.presetBtnActive,
                    ]}
                    onPress={() => {
                      setSelectedTank(t);
                      setTankSize("");
                      setBudgetResult(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        selectedTank === t && styles.presetTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="water-outline"
                  size={18}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Custom tank size"
                  placeholderTextColor="#334155"
                  value={tankSize}
                  onChangeText={(v) => {
                    setTankSize(v);
                    setSelectedTank(null);
                  }}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.unitSuffix}>
                  {fuelUnit === "liters" ? "L" : "gal"}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ── SHARED: Fuel Price ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Fuel Price ({priceLabel})</Text>
          <View style={styles.presetRow}>
            {FUEL_PRESETS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.presetBtn,
                  selectedPrice === p && styles.presetBtnActive,
                ]}
                onPress={() => {
                  setSelectedPrice(p);
                  setFuelPrice("");
                }}
              >
                <Text
                  style={[
                    styles.presetText,
                    selectedPrice === p && styles.presetTextActive,
                  ]}
                >
                  {currency}
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.currSymbol}>{currency}</Text>
            <TextInput
              style={styles.input}
              placeholder="Custom price"
              placeholderTextColor="#334155"
              value={fuelPrice}
              onChangeText={(v) => {
                setFuelPrice(v);
                setSelectedPrice(null);
              }}
              keyboardType="decimal-pad"
            />
            <Text style={styles.unitSuffix}>
              / {fuelUnit === "liters" ? "L" : "gal"}
            </Text>
          </View>
        </View>

        {/* ── SHARED: Fuel Efficiency (trip & budget) ── */}
        {mode !== "efficiency" && (
          <View style={styles.section}>
            <Text style={styles.label}>Fuel Efficiency ({effLabel})</Text>
            <View style={styles.presetRow}>
              {effPresets.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[
                    styles.presetBtn,
                    selectedEff === e && styles.presetBtnActive,
                  ]}
                  onPress={() => {
                    setSelectedEff(e);
                    setEfficiency("");
                  }}
                >
                  <Text
                    style={[
                      styles.presetText,
                      selectedEff === e && styles.presetTextActive,
                    ]}
                  >
                    {e}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="speedometer-outline"
                size={18}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={`Custom ${effLabel}`}
                placeholderTextColor="#334155"
                value={efficiency}
                onChangeText={(v) => {
                  setEfficiency(v);
                  setSelectedEff(null);
                }}
                keyboardType="decimal-pad"
              />
              <Text style={styles.unitSuffix}>{effLabel}</Text>
            </View>
          </View>
        )}

        {/* Calculate Button */}
        <TouchableOpacity
          style={[styles.calcBtn, !isValid() && styles.calcBtnDisabled]}
          onPress={calculate}
          disabled={!isValid()}
          activeOpacity={0.8}
        >
          <Ionicons name="calculator-outline" size={22} color="#fff" />
          <Text style={styles.calcBtnText}>Calculate</Text>
        </TouchableOpacity>

        {/* ── TRIP RESULT  */}
        {tripResult && (
          <Animated.View
            style={[styles.resultSection, { opacity: resultAnim }]}
          >
            <View style={styles.heroBanner}>
              <Text style={styles.heroBannerLabel}>Total Trip Cost</Text>
              <Text style={styles.heroBannerValue}>
                {fmtMoney(tripResult.totalCost, currency)}
              </Text>
              <Text style={styles.heroBannerSub}>
                for {getDist()} {distLabel} at {getPrice()} {priceLabel}
              </Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>Trip Breakdown</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Fuel Needed</Text>
                <Text style={styles.resultRowValue}>
                  {fmt2(tripResult.fuelNeeded)}{" "}
                  {fuelUnit === "liters" ? "L" : "gal"}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Cost per {distLabel}</Text>
                <Text style={styles.resultRowValue}>
                  {currency}
                  {fmt2(tripResult.costPerKm)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>
                  Cost per 100 {distLabel}
                </Text>
                <Text style={styles.resultRowValue}>
                  {currency}
                  {fmt2(tripResult.costPer100km)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>CO₂ Emissions</Text>
                <Text style={[styles.resultRowValue, { color: "#F59E0B" }]}>
                  {fmt1(tripResult.co2Kg)} kg
                </Text>
              </View>
            </View>

            <View style={styles.tilesRow}>
              <View style={styles.tile}>
                <Ionicons name="water-outline" size={18} color="#3B82F6" />
                <Text style={styles.tileValue}>
                  {fmt1(tripResult.fuelNeeded)}
                  {fuelUnit === "liters" ? "L" : "gal"}
                </Text>
                <Text style={styles.tileLabel}>Fuel</Text>
              </View>
              <View style={styles.tile}>
                <Ionicons name="cash-outline" size={18} color="#10B981" />
                <Text style={styles.tileValue}>
                  {currency}
                  {fmt2(tripResult.costPerKm)}
                </Text>
                <Text style={styles.tileLabel}>Per {distLabel}</Text>
              </View>
              <View style={styles.tile}>
                <Ionicons name="leaf-outline" size={18} color="#F59E0B" />
                <Text style={styles.tileValue}>{fmt1(tripResult.co2Kg)}kg</Text>
                <Text style={styles.tileLabel}>CO₂</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── EFFICIENCY RESULT  */}
        {effResult && (
          <Animated.View
            style={[styles.resultSection, { opacity: resultAnim }]}
          >
            <View style={styles.heroBanner}>
              <Text style={styles.heroBannerLabel}>Fuel Efficiency</Text>
              <Text style={styles.heroBannerValue}>
                {fmt1(effResult.efficiency)} {effLabel}
              </Text>
              <Text style={styles.heroBannerSub}>
                based on {fuelUsed} {fuelUnit === "liters" ? "L" : "gal"} over{" "}
                {distTravelled} {distLabel}
              </Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>Efficiency Breakdown</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Cost per {distLabel}</Text>
                <Text style={styles.resultRowValue}>
                  {currency}
                  {fmt2(effResult.costPerUnit)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Est. Annual Cost</Text>
                <Text
                  style={[
                    styles.resultRowLabel,
                    { color: "#94A3B8", fontSize: 11 },
                  ]}
                >
                  (at 15,000 {distLabel}/yr)
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel} />
                <Text style={[styles.resultRowValue, styles.totalText]}>
                  {currency}
                  {fmt2(effResult.annualCost)}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── BUDGET RESULT  */}
        {budgetResult && (
          <Animated.View
            style={[styles.resultSection, { opacity: resultAnim }]}
          >
            <View style={styles.heroBanner}>
              <Text style={styles.heroBannerLabel}>Distance You Can Cover</Text>
              <Text style={styles.heroBannerValue}>
                {fmt1(budgetResult.distancePossible)} {distLabel}
              </Text>
              <Text style={styles.heroBannerSub}>
                with a {currency}
                {budget} fuel budget
              </Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>Budget Breakdown</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Fuel You Can Buy</Text>
                <Text style={styles.resultRowValue}>
                  {fmt2(budgetResult.fuelPossible)}{" "}
                  {fuelUnit === "liters" ? "L" : "gal"}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Distance Covered</Text>
                <Text style={[styles.resultRowValue, { color: "#10B981" }]}>
                  {fmt1(budgetResult.distancePossible)} {distLabel}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Full Tank Refills</Text>
                <Text style={styles.resultRowValue}>
                  {fmt1(budgetResult.refills)}
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
            <Ionicons name="car-outline" size={20} color="#10B981" />
            <Text style={styles.infoText}>
              Trip Cost: how much a journey will cost. Efficiency: calculate
              your real-world {effLabel}. Budget: how far your fuel money goes.
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="leaf-outline" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              CO₂ estimate uses 2.31 kg per litre of petrol. Actual emissions
              vary by fuel type and vehicle.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export default FuelCostCalc;

// ─── STYLES
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
  subheaderText: { fontSize: 14, color: "#CBD5E1", textAlign: "center" },

  // Unit row
  unitRow: { flexDirection: "row", gap: 8, marginBottom: 18, flexWrap: "wrap" },
  unitToggle: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 3,
    gap: 2,
  },
  unitBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  unitBtnActive: { backgroundColor: "#10B981" },
  unitBtnText: { color: "#64748B", fontSize: 12, fontWeight: "600" },
  unitBtnTextActive: { color: "#fff" },

  // Mode tabs
  modeTabs: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 4,
    marginBottom: 22,
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
  modeTabText: { color: "#64748B", fontSize: 12, fontWeight: "600" },
  modeTabTextActive: { color: "#fff" },

  // Sections
  section: { marginBottom: 18 },
  label: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },

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
    fontSize: 17,
    fontWeight: "600",
    paddingVertical: 14,
  },
  inputIcon: { marginRight: 8 },
  unitSuffix: { color: "#64748B", fontSize: 13, fontWeight: "600" },

  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  presetBtnActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
  presetText: { color: "#94A3B8", fontSize: 13, fontWeight: "600" },
  presetTextActive: { color: "#fff" },

  calcBtn: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 22,
  },
  calcBtnDisabled: { backgroundColor: "#334155", opacity: 0.5 },
  calcBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  // Results
  resultSection: { gap: 12, marginBottom: 22 },
  heroBanner: {
    backgroundColor: "#0D2E22",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#10B98144",
    padding: 22,
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
    paddingVertical: 8,
  },
  resultRowLabel: { color: "#94A3B8", fontSize: 14 },
  resultRowValue: { color: "#E2E8F0", fontSize: 14, fontWeight: "600" },
  totalText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#334155", marginVertical: 4 },

  tilesRow: { flexDirection: "row", gap: 10 },
  tile: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 14,
    alignItems: "center",
    gap: 5,
  },
  tileValue: { color: "#fff", fontSize: 14, fontWeight: "700" },
  tileLabel: { color: "#64748B", fontSize: 11, textAlign: "center" },

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
