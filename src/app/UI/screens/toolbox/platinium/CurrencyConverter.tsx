import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import VersionBadge from "../../../component/VersionBadge";

// ── Types
interface Currency {
  code: string;
  name: string;
  flag: string;
  symbol: string;
}

interface RateResult {
  from: string;
  to: string;
  rate: number;
  amount: number;
  result: number;
  timestamp: Date;
}

// ── Currency list
const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", flag: "🇺🇸", symbol: "$" },
  { code: "EUR", name: "Euro", flag: "🇪🇺", symbol: "€" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦", symbol: "$" },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺", symbol: "$" },
  { code: "CHF", name: "Swiss Franc", flag: "🇨🇭", symbol: "₣" },
  { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳", symbol: "₹" },
  { code: "NGN", name: "Nigerian Naira", flag: "🇳🇬", symbol: "₦" },
  { code: "BRL", name: "Brazilian Real", flag: "🇧🇷", symbol: "R$" },
  { code: "MXN", name: "Mexican Peso", flag: "🇲🇽", symbol: "$" },
  { code: "ZAR", name: "South African Rand", flag: "🇿🇦", symbol: "R" },
  { code: "KRW", name: "South Korean Won", flag: "🇰🇷", symbol: "₩" },
  { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬", symbol: "$" },
  { code: "AED", name: "UAE Dirham", flag: "🇦🇪", symbol: "د.إ" },
  { code: "SAR", name: "Saudi Riyal", flag: "🇸🇦", symbol: "﷼" },
  { code: "HKD", name: "Hong Kong Dollar", flag: "🇭🇰", symbol: "$" },
  { code: "SEK", name: "Swedish Krona", flag: "🇸🇪", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", flag: "🇳🇴", symbol: "kr" },
  { code: "NZD", name: "New Zealand Dollar", flag: "🇳🇿", symbol: "$" },
  { code: "TRY", name: "Turkish Lira", flag: "🇹🇷", symbol: "₺" },
  { code: "RUB", name: "Russian Ruble", flag: "🇷🇺", symbol: "₽" },
  { code: "PLN", name: "Polish Zloty", flag: "🇵🇱", symbol: "zł" },
  { code: "THB", name: "Thai Baht", flag: "🇹🇭", symbol: "฿" },
  { code: "IDR", name: "Indonesian Rupiah", flag: "🇮🇩", symbol: "Rp" },
  { code: "MYR", name: "Malaysian Ringgit", flag: "🇲🇾", symbol: "RM" },
  { code: "PHP", name: "Philippine Peso", flag: "🇵🇭", symbol: "₱" },
  { code: "EGP", name: "Egyptian Pound", flag: "🇪🇬", symbol: "£" },
  { code: "GHS", name: "Ghanaian Cedi", flag: "🇬🇭", symbol: "₵" },
];

// ── Helpers
const fmt = (val: number, decimals = 2): string => {
  if (val >= 1000000)
    return val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  if (val >= 1)
    return val.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  return val.toFixed(6).replace(/0+$/, "");
};

const getCurrency = (code: string): Currency =>
  CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];

// ── Component
const CurrencyConverter: React.FC = () => {
  const [fromCode, setFromCode] = useState("USD");
  const [toCode, setToCode] = useState("NGN");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<RateResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [history, setHistory] = useState<RateResult[]>([]);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  const QUICK_AMOUNTS = [1, 10, 50, 100, 500, 1000];

  // ── Fetch rate from MyMemory-style free API
  const convert = async (overrideAmount?: string) => {
    const inputAmount = parseFloat(overrideAmount ?? amount);
    if (!inputAmount || inputAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to convert.");
      return;
    }
    if (fromCode === toCode) {
      Alert.alert("Same Currency", "Please select two different currencies.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const url = `https://api.mymemory.translated.net/get?q=${fromCode}_${toCode}&langpair=en|en`;
      // Use frankfurter.app — free, no key needed
      const response = await fetch(
        `https://api.frankfurter.app/latest?amount=${inputAmount}&from=${fromCode}&to=${toCode}`,
      );

      if (!response.ok) throw new Error("API error");

      const data = await response.json();
      const rate = data.rates[toCode] / inputAmount;
      const converted = data.rates[toCode];

      const entry: RateResult = {
        from: fromCode,
        to: toCode,
        rate,
        amount: inputAmount,
        result: converted,
        timestamp: new Date(),
      };

      setResult(entry);
      setLastUpdated(new Date());
      setHistory((prev) => [entry, ...prev].slice(0, 5));

      // Animate result in
      resultAnim.setValue(0);
      Animated.timing(resultAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } catch {
      Alert.alert(
        "Conversion Failed",
        "Could not fetch exchange rates. Check your internet connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const swapCurrencies = () => {
    const prevFrom = fromCode;
    setFromCode(toCode);
    setToCode(prevFrom);
    setResult(null);
    setAmount("");
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
    setResult(null);
  };

  const clearAll = () => {
    setAmount("");
    setResult(null);
  };

  const fromCurrency = getCurrency(fromCode);
  const toCurrency = getCurrency(toCode);

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
          <Text style={styles.headerText}>Currency Converter</Text>
          <Text style={styles.subheaderText}>
            Live exchange rates via Frankfurter
          </Text>
        </View>

        {/* Currency Selector Row */}
        <View style={styles.selectorRow}>
          {/* From */}
          <View style={styles.currencyBox}>
            <Text style={styles.currencyBoxLabel}>From</Text>
            <View style={styles.pickerWrapper}>
              <Text style={styles.flagText}>{fromCurrency.flag}</Text>
              <Picker
                selectedValue={fromCode}
                onValueChange={(v) => {
                  setFromCode(v);
                  setResult(null);
                }}
                style={styles.picker}
                dropdownIconColor="#fff"
              >
                {CURRENCIES.map((c) => (
                  <Picker.Item
                    key={c.code}
                    label={`${c.flag}  ${c.code}`}
                    value={c.code}
                  />
                ))}
              </Picker>
            </View>
            <Text style={styles.currencyName} numberOfLines={1}>
              {fromCurrency.name}
            </Text>
          </View>

          {/* Swap */}
          <TouchableOpacity style={styles.swapBtn} onPress={swapCurrencies}>
            <Ionicons name="swap-horizontal" size={22} color="#fff" />
          </TouchableOpacity>

          {/* To */}
          <View style={styles.currencyBox}>
            <Text style={styles.currencyBoxLabel}>To</Text>
            <View style={styles.pickerWrapper}>
              <Text style={styles.flagText}>{toCurrency.flag}</Text>
              <Picker
                selectedValue={toCode}
                onValueChange={(v) => {
                  setToCode(v);
                  setResult(null);
                }}
                style={styles.picker}
                dropdownIconColor="#fff"
              >
                {CURRENCIES.map((c) => (
                  <Picker.Item
                    key={c.code}
                    label={`${c.flag}  ${c.code}`}
                    value={c.code}
                  />
                ))}
              </Picker>
            </View>
            <Text style={styles.currencyName} numberOfLines={1}>
              {toCurrency.name}
            </Text>
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountWrapper}>
            <Text style={styles.amountSymbol}>{fromCurrency.symbol}</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#334155"
              value={amount}
              onChangeText={(v) => {
                setAmount(v);
                setResult(null);
              }}
              keyboardType="decimal-pad"
            />
            {amount.length > 0 && (
              <TouchableOpacity onPress={clearAll}>
                <Ionicons name="close-circle" size={20} color="#475569" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Amount Presets */}
        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.quickBtn,
                amount === val.toString() && styles.quickBtnActive,
              ]}
              onPress={() => handleQuickAmount(val)}
            >
              <Text
                style={[
                  styles.quickBtnText,
                  amount === val.toString() && styles.quickBtnTextActive,
                ]}
              >
                {val >= 1000 ? `${val / 1000}K` : val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Convert Button */}
        <TouchableOpacity
          style={[
            styles.convertBtn,
            (!amount.trim() || isLoading) && styles.convertBtnDisabled,
          ]}
          onPress={() => convert()}
          disabled={!amount.trim() || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="swap-horizontal" size={22} color="#fff" />
          )}
          <Text style={styles.convertBtnText}>
            {isLoading ? "Fetching Rate…" : "Convert"}
          </Text>
        </TouchableOpacity>

        {/* Result Card */}
        {result && (
          <Animated.View style={[styles.resultCard, { opacity: resultAnim }]}>
            {/* Main result */}
            <View style={styles.resultMain}>
              <Text style={styles.resultFromAmount}>
                {fromCurrency.symbol}
                {fmt(result.amount)} {fromCode}
              </Text>
              <Ionicons
                name="arrow-down"
                size={20}
                color="#10B981"
                style={styles.resultArrow}
              />
              <Text style={styles.resultValue}>
                {toCurrency.symbol}
                {fmt(result.result)}
              </Text>
              <Text style={styles.resultCode}>{toCode}</Text>
            </View>

            <View style={styles.resultDivider} />

            {/* Rate info */}
            <View style={styles.rateRow}>
              <View style={styles.rateTile}>
                <Text style={styles.rateTileLabel}>Exchange Rate</Text>
                <Text style={styles.rateTileValue}>
                  1 {fromCode} = {fmt(result.rate, 4)} {toCode}
                </Text>
              </View>
              <View style={styles.rateTileDivider} />
              <View style={styles.rateTile}>
                <Text style={styles.rateTileLabel}>Inverse Rate</Text>
                <Text style={styles.rateTileValue}>
                  1 {toCode} = {fmt(1 / result.rate, 4)} {fromCode}
                </Text>
              </View>
            </View>

            {lastUpdated && (
              <Text style={styles.timestamp}>
                <Ionicons name="time-outline" size={11} color="#334155" />
                {"  "}Updated{" "}
                {lastUpdated.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            )}
          </Animated.View>
        )}

        {/* Conversion History */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Recent Conversions</Text>
            {history.map((h, i) => {
              const fc = getCurrency(h.from);
              const tc = getCurrency(h.to);
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.historyRow}
                  onPress={() => {
                    setFromCode(h.from);
                    setToCode(h.to);
                    setAmount(h.amount.toString());
                    setResult(null);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.historyFlags}>
                    <Text style={styles.historyFlag}>{fc.flag}</Text>
                    <Ionicons name="arrow-forward" size={12} color="#334155" />
                    <Text style={styles.historyFlag}>{tc.flag}</Text>
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyPair}>
                      {h.from} → {h.to}
                    </Text>
                    <Text style={styles.historyRate}>
                      1 {h.from} = {fmt(h.rate, 4)} {h.to}
                    </Text>
                  </View>
                  <Text style={styles.historyResult}>
                    {tc.symbol}
                    {fmt(h.result)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="globe-outline" size={20} color="#10B981" />
            {/* <Text style={styles.infoText}>
              Powered by Frankfurter.app — free, open-source exchange rates
              updated daily from the ECB.
            </Text> */}
            <Text style={styles.infoText}>
              Exchange rates updated daily from the ECB.
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              Rates are indicative. For financial transactions, verify with your
              bank or broker.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export default CurrencyConverter;

// ─── STYLES
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
  header: { marginBottom: 24 },
  headerText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subheaderText: {
    fontSize: 15,
    color: "#CBD5E1",
    textAlign: "center",
  },

  // Selector row
  selectorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 22,
  },
  currencyBox: { flex: 1 },
  currencyBoxLabel: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    marginBottom: 6,
  },
  flagText: { fontSize: 20 },
  picker: {
    flex: 1,
    color: "#fff",
    height: 50,
  },
  currencyName: {
    color: "#64748B",
    fontSize: 11,
    textAlign: "center",
  },
  swapBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  // Amount
  section: { marginBottom: 16 },
  label: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  amountWrapper: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  amountSymbol: {
    color: "#10B981",
    fontSize: 22,
    fontWeight: "700",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: "#fff",
    fontSize: 26,
    fontWeight: "600",
    paddingVertical: 14,
  },

  // Quick amounts
  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  quickBtn: {
    flex: 1,
    minWidth: "14%",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
  },
  quickBtnActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  quickBtnText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  quickBtnTextActive: { color: "#fff" },

  // Convert button
  convertBtn: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 22,
  },
  convertBtnDisabled: { backgroundColor: "#334155", opacity: 0.5 },
  convertBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  // Result card
  resultCard: {
    backgroundColor: "#1E293B",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#10B98144",
    marginBottom: 22,
    overflow: "hidden",
  },
  resultMain: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "#0D2E22",
  },
  resultFromAmount: {
    color: "#6EE7B7",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  resultArrow: { marginVertical: 6 },
  resultValue: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1,
  },
  resultCode: {
    color: "#10B981",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },
  resultDivider: {
    height: 1,
    backgroundColor: "#334155",
  },
  rateRow: {
    flexDirection: "row",
    padding: 16,
  },
  rateTile: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  rateTileDivider: {
    width: 1,
    backgroundColor: "#334155",
  },
  rateTileLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  rateTileValue: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  timestamp: {
    color: "#334155",
    fontSize: 11,
    textAlign: "center",
    paddingBottom: 12,
  },

  // History
  historySection: { marginBottom: 22 },
  historyTitle: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  historyFlags: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  historyFlag: { fontSize: 18 },
  historyInfo: { flex: 1 },
  historyPair: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  historyRate: { color: "#475569", fontSize: 11 },
  historyResult: {
    color: "#10B981",
    fontSize: 15,
    fontWeight: "700",
  },

  // Info card
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
