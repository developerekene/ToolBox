import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { Tier } from "./MembershipModal";

interface Props {
  visible: boolean;
  tier: Tier;
  onClose: () => void;
  onSuccess: (tier: Tier) => void;
}

type PaymentMethod = "card" | "paypal";
type Step = "checkout" | "processing" | "success";

const TIER_PRICES: Record<Tier, string> = {
  Silver: "0.00",
  Gold: "4.12",
  Platinum: "16.03",
};

const TIER_COLORS: Record<Tier, string> = {
  Silver: "#94A3B8",
  Gold: "#F59E0B",
  Platinum: "#A78BFA",
};

const TIER_FEATURES: Record<Tier, string[]> = {
  Silver: [
    "Crop Tool, Word Counter",
    "Scientific & BMI Calculator",
    "Unit & Tip Calculator",
    "QR Code Generator",
  ],
  Gold: [
    "Everything in Silver",
    "PDF Scanner & QR Scanner",
    "Image Compress & Translator",
    "Loan & Discount Calculator",
  ],
  Platinum: [
    "Everything in Gold",
    "Video Trim, Audio Rec, Zip Creator",
    "Notes Pro, Encoder / Decoder",
    "Currency, Investment & Mortgage Calc",
  ],
};

const CheckoutModal: React.FC<Props> = ({
  visible,
  tier,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>("checkout");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const tierColor = TIER_COLORS[tier];
  const price = TIER_PRICES[tier];

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const reset = () => {
    setStep("checkout");
    setPaymentMethod("card");
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setCardName("");
    setErrors({});
  };

  const validate = () => {
    if (paymentMethod !== "card") return true;
    const newErrors: Record<string, string> = {};
    if (cardName.trim().length < 3)
      newErrors.cardName = "Enter payee email / must be a Gmail address";
    // if (cardNumber.replace(/\s/g, "").length < 16)
    //   newErrors.cardNumber = "Enter a valid 16-digit card number";
    // if (expiry.length < 5) newErrors.expiry = "Enter expiry (MM/YY)";
    // if (cvv.length < 3) newErrors.cvv = "Enter CVV";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //   const handlePay = () => {
  //     if (!validate()) return;
  //     setStep("processing");
  //     setTimeout(() => {
  //       setStep("success");
  //     }, 2000);
  //   };
  const handlePay = () => {
    if (paymentMethod === "paypal") {
      // Open PayPal externally — don't process internally
      // import("react-native").then(({ Linking }) => {
      //   Linking.openURL("https://www.paypal.com/checkoutnow"); // replace with your real PayPal checkout URL
      // });
      return;
    }

    if (!validate()) return;
    setStep("processing");
    setTimeout(() => {
      setStep("success");
    }, 2000);
  };

  const handleDone = () => {
    onSuccess(tier);
    onClose();
    reset();
  };

  const renderCheckout = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Order Summary */}
      <View style={s.summaryCard}>
        <Text style={s.sectionLabel}>Order Summary</Text>
        <View style={s.summaryRow}>
          <View>
            <Text style={s.summaryTierName}>
              <Text style={{ color: tierColor }}>{tier}</Text> Plan
            </Text>
            <Text style={s.summaryBilling}>
              Billed monthly · Cancel anytime
            </Text>
          </View>
          <Text style={s.summaryPrice}>
            £{price}
            <Text style={s.summaryPeriod}>/mo</Text>
          </Text>
        </View>

        <View style={s.divider} />

        {TIER_FEATURES[tier].map((f) => (
          <Text key={f} style={s.featureItem}>
            <Text style={{ color: tierColor }}>✓ </Text>
            {f}
          </Text>
        ))}

        <View style={s.divider} />

        <View style={s.summaryRow}>
          <Text style={s.totalLabel}>Total today</Text>
          <Text style={[s.totalPrice, { color: tierColor }]}>£{price}</Text>
        </View>
      </View>

      {/* Payment Method */}
      <Text style={s.sectionLabel}>Payment method</Text>
      <View style={s.payMethodRow}>
        <TouchableOpacity
          style={[
            s.payBtn,
            paymentMethod === "card" && {
              borderColor: tierColor,
              borderWidth: 2,
            },
          ]}
          onPress={() => setPaymentMethod("card")}
          activeOpacity={0.8}
        >
          <FontAwesome5
            name="credit-card"
            size={20}
            color={paymentMethod === "card" ? tierColor : "#6B7280"}
          />
          <Text
            style={[
              s.payBtnText,
              paymentMethod === "card" && { color: tierColor },
            ]}
          >
            Credit / Debit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.payBtn,
            // s.payBtnDisabled,
            paymentMethod === "paypal" && {
              borderColor: "#009CDE",
              borderWidth: 2,
            },
          ]}
          onPress={() => setPaymentMethod("paypal")}
          activeOpacity={0.8}
          // disabled={true}
        >
          <FontAwesome5
            name="paypal"
            size={20}
            color={paymentMethod === "paypal" ? "#009CDE" : "#6B7280"}
          />
          <Text
            style={[
              s.payBtnText,
              paymentMethod === "paypal" && { color: "#009CDE" },
            ]}
          >
            PayPal
          </Text>
        </TouchableOpacity>
      </View>

      {/* Card Form */}
      {paymentMethod === "card" && (
        <View style={s.cardForm}>
          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Payee Email</Text>
            <TextInput
              style={[s.input, errors.cardName && s.inputError]}
              placeholder="Email"
              placeholderTextColor="#4B5563"
              value={cardName}
              keyboardType={"email-address"}
              onChangeText={setCardName}
            />
            {errors.cardName && (
              <Text style={s.errorText}>{errors.cardName}</Text>
            )}
          </View>

          {/* <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Card number</Text>
            <View style={[s.inputRow, errors.cardNumber && s.inputError]}>
              <TextInput
                style={[s.input, { flex: 1, borderWidth: 0, padding: 14 }]}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#4B5563"
                keyboardType="numeric"
                value={cardNumber}
                onChangeText={(v) => setCardNumber(formatCardNumber(v))}
                maxLength={19}
              />
              <FontAwesome5
                name="credit-card"
                size={16}
                color="#4B5563"
                style={{ marginRight: 14 }}
              />
            </View>
            {errors.cardNumber && (
              <Text style={s.errorText}>{errors.cardNumber}</Text>
            )}
          </View>

          <View style={s.inputRowDouble}>
            <View style={[s.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={s.inputLabel}>Expiry</Text>
              <TextInput
                style={[s.input, errors.expiry && s.inputError]}
                placeholder="MM/YY"
                placeholderTextColor="#4B5563"
                keyboardType="numeric"
                value={expiry}
                onChangeText={(v) => setExpiry(formatExpiry(v))}
                maxLength={5}
              />
              {errors.expiry && (
                <Text style={s.errorText}>{errors.expiry}</Text>
              )}
            </View>
            <View style={[s.inputGroup, { flex: 1 }]}>
              <Text style={s.inputLabel}>CVV</Text>
              <TextInput
                style={[s.input, errors.cvv && s.inputError]}
                placeholder="•••"
                placeholderTextColor="#4B5563"
                keyboardType="numeric"
                secureTextEntry
                value={cvv}
                onChangeText={setCvv}
                maxLength={4}
              />
              {errors.cvv && <Text style={s.errorText}>{errors.cvv}</Text>}
            </View>
          </View> */}
        </View>
      )}

      {/* PayPal Box */}
      {/* {paymentMethod === "paypal" && (
        <View style={s.altPayBox}>
          <FontAwesome5 name="paypal" size={36} color="#009CDE" />
          <Text style={s.altPayText}>
            You'll be securely redirected to PayPal to complete your payment.
          </Text>
        </View>
      )} */}
      {paymentMethod === "paypal" && (
        <View style={s.paypalDisabledBox}>
          <Ionicons name="time-outline" size={32} color="#4B5563" />
          <Text style={s.paypalDisabledTitle}>PayPal not active yet</Text>
          <Text style={s.paypalDisabledText}>
            This payment method is coming soon. Please use Credit / Debit card
            to complete your purchase.
          </Text>
          <TouchableOpacity
            onPress={() => setPaymentMethod("card")}
            style={s.switchToCardBtn}
            activeOpacity={0.8}
          >
            <Text style={s.switchToCardText}>Switch to Card</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Security */}
      <View style={s.secureRow}>
        <Ionicons name="lock-closed" size={12} color="#4B5563" />
        <Text style={s.secureText}>
          256-bit SSL encrypted · Secure checkout
        </Text>
      </View>

      {/* Pay Button */}
      <TouchableOpacity
        style={[s.payNowBtn, { backgroundColor: tierColor }]}
        onPress={handlePay}
        activeOpacity={0.85}
      >
        <Text
          style={[
            s.payNowText,
            { color: tier === "Gold" ? "#1a0e00" : "#fff" },
          ]}
        >
          {paymentMethod === "paypal"
            ? "Continue to PayPal"
            : `Proceed with £${price} / month`}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </ScrollView>
  );

  const renderProcessing = () => (
    <View style={s.processingContainer}>
      <ActivityIndicator size="large" color={tierColor} />
      <Text style={s.processingTitle}>Processing payment...</Text>
      <Text style={s.processingSubtitle}>Please don't close this screen</Text>
    </View>
  );

  const renderSuccess = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.successContainer}
    >
      {/* Rings */}
      <View style={[s.successRingOuter, { borderColor: tierColor + "33" }]}>
        <View style={[s.successRingInner, { borderColor: tierColor + "66" }]}>
          <View
            style={[
              s.successIconCircle,
              { backgroundColor: tierColor + "22", borderColor: tierColor },
            ]}
          >
            <Ionicons name="checkmark" size={48} color={tierColor} />
          </View>
        </View>
      </View>

      {/* Tier Badge */}
      <View
        style={[
          s.successTierBadge,
          { backgroundColor: tierColor + "22", borderColor: tierColor + "55" },
        ]}
      >
        <FontAwesome5
          name={
            tier === "Gold"
              ? "crown"
              : tier === "Platinum"
                ? "gem"
                : "shield-alt"
          }
          size={12}
          color={tierColor}
        />
        <Text style={[s.successTierBadgeText, { color: tierColor }]}>
          {tier} Member
        </Text>
      </View>

      <Text style={s.successTitle}>You're all set!</Text>
      <Text style={s.successSubtitle}>
        Welcome to{" "}
        <Text style={{ color: tierColor, fontWeight: "700" }}>{tier}</Text>.
        {"\n"}
        Your tools are now ready to use.
      </Text>

      {/* Unlocked Features */}
      <View style={[s.unlockedCard, { borderColor: tierColor + "33" }]}>
        <Text style={[s.unlockedLabel, { color: tierColor }]}>
          ✦ Unlocked with {tier}
        </Text>
        {TIER_FEATURES[tier].map((f) => (
          <View key={f} style={s.unlockedRow}>
            <View style={[s.unlockedDot, { backgroundColor: tierColor }]} />
            <Text style={s.unlockedText}>{f}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[s.successBtn, { backgroundColor: tierColor }]}
        onPress={handleDone}
        activeOpacity={0.85}
      >
        <Text
          style={[
            s.successBtnText,
            { color: tier === "Gold" ? "#1a0e00" : "#fff" },
          ]}
        >
          Start using {tier} tools
        </Text>
        <Ionicons
          name="arrow-forward"
          size={18}
          color={tier === "Gold" ? "#1a0e00" : "#fff"}
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>

      <Text style={s.successNote}>A receipt has been sent to your email</Text>
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />

          {/* Header — hidden on processing & success */}
          {step === "checkout" && (
            <View style={s.headerRow}>
              <Text style={s.headerTitle}>Upgrade to {tier}</Text>
              <TouchableOpacity
                onPress={() => {
                  reset();
                  onClose();
                }}
                style={s.closeBtn}
              >
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          )}

          {step === "checkout" && renderCheckout()}
          {step === "processing" && renderProcessing()}
          {step === "success" && renderSuccess()}
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#101828",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
    maxHeight: "92%",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#374151",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  closeBtn: { backgroundColor: "#1F2937", borderRadius: 8, padding: 6 },

  // Summary
  summaryCard: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryTierName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  summaryBilling: { color: "#4B5563", fontSize: 11 },
  summaryPrice: { color: "#fff", fontSize: 22, fontWeight: "700" },
  summaryPeriod: { color: "#6B7280", fontSize: 13, fontWeight: "400" },
  divider: { height: 1, backgroundColor: "#374151", marginVertical: 12 },
  featureItem: { color: "#9CA3AF", fontSize: 13, marginBottom: 5 },
  totalLabel: { color: "#9CA3AF", fontSize: 14 },
  totalPrice: { fontSize: 22, fontWeight: "700" },

  sectionLabel: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Payment methods
  payMethodRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  payBtn: {
    flex: 1,
    backgroundColor: "#1F2937",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    borderColor: "transparent",
  },
  payBtnText: { color: "#6B7280", fontSize: 12, fontWeight: "600" },

  // Card form
  cardForm: { marginBottom: 4 },
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1F2937",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: "#374151",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#374151",
  },
  inputRowDouble: { flexDirection: "row" },
  inputError: { borderColor: "#EF4444" },
  errorText: { color: "#EF4444", fontSize: 11, marginTop: 4 },

  // PayPal
  altPayBox: {
    backgroundColor: "#1F2937",
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  altPayText: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },

  // Security
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
  },
  secureText: { color: "#4B5563", fontSize: 11 },

  // Pay button
  payNowBtn: { borderRadius: 14, padding: 16, alignItems: "center" },
  payNowText: { fontSize: 16, fontWeight: "700" },

  // Processing
  processingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  processingTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
  },
  processingSubtitle: { color: "#6B7280", fontSize: 13, marginTop: 8 },

  // Success
  successContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 8,
  },
  successRingOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successRingInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  successTierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  successTierBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  successTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 10,
  },
  successSubtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  unlockedCard: {
    width: "100%",
    backgroundColor: "#1F2937",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  unlockedLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  unlockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  unlockedDot: { width: 6, height: 6, borderRadius: 3 },
  unlockedText: { color: "#9CA3AF", fontSize: 13 },
  successBtn: {
    width: "100%",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  successBtnText: { fontSize: 16, fontWeight: "700" },
  successNote: { color: "#4B5563", fontSize: 12 },
  payBtnDisabled: {
    opacity: 0.45,
  },
  comingSoonBadge: {
    backgroundColor: "#1F2937",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#374151",
  },
  comingSoonText: {
    color: "#6B7280",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  paypalDisabledBox: {
    backgroundColor: "#1F2937",
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#374151",
    borderStyle: "dashed",
  },
  paypalDisabledTitle: {
    color: "#9CA3AF",
    fontSize: 15,
    fontWeight: "700",
  },
  paypalDisabledText: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  switchToCardBtn: {
    marginTop: 6,
    backgroundColor: "#374151",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  switchToCardText: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default CheckoutModal;
