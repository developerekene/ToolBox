import React, { useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Tier } from "../../screens/toolbox/MembershipModal";

// Firebase
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { useUserRegion } from "../../../../hooks/useLocation";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Components
import OrderSummary from "../../component/checkout/OrderSummary";
import PaymentMethodSelector from "../../component/checkout/PaymentMethodSelector";
import EmailInput from "../../component/checkout/EmailInput";
import PayButton from "../../component/checkout/PayButton";
import PaystackPayment from "../../component/checkout/PaystackPaymentConfig";
import ProcessingScreen from "../../component/checkout/ProcessingScreen";
import SuccessScreen from "../../component/checkout/SuccessScreen";

interface Props {
  visible: boolean;
  tier: Tier;
  onClose: () => void;
  onSuccess: (tier: Tier) => void;
}

type PaymentMethod = "card" | "paypal";
type Step = "checkout" | "processing" | "paystack" | "success";

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

const CheckoutModal: React.FC<Props> = ({
  visible,
  tier,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>("checkout");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { region, loading: regionLoading } = useUserRegion();
  const tierColor = TIER_COLORS[tier];
  const price = TIER_PRICES[tier];
  const hasHandledSuccess = useRef(false);

  const reset = () => {
    setStep("checkout");
    setPaymentMethod("card");
    setEmail("");
    setErrors({});
    hasHandledSuccess.current = false; // ✅ reset for next payment
  };

  const validate = () => {
    if (paymentMethod !== "card") return true;

    const newErrors: Record<string, string> = {};

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!gmailRegex.test(email.trim())) {
      newErrors.cardName = " Email must be a valid Gmail address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // firebase user registration (Goes here because we need region data from the hook)

  // const registerUser = async (userEmail: string) => {
  //   await setDoc(
  //     doc(db, "users", userEmail),
  //     {
  //       email: userEmail,
  //       tier,
  //       region: region ?? "unknown",
  //       subscribedAt: serverTimestamp(),
  //       platform: "toolbox-app",
  //     },
  //     { merge: true },
  //   );
  // };

  const registerUser = async (userEmail: string) => {
    await AsyncStorage.setItem("userEmail", userEmail);
    await AsyncStorage.setItem("userTier", tier);
  };

  const handlePay = async () => {
    if (paymentMethod === "paypal") return;
    if (!validate()) return;

    setStep("paystack");
    // if (region === "africa") {
    //   setStep("paystack");
    // } else {
    //   setStep("processing");
    //   try {
    //     await registerUser(email.trim().toLowerCase());
    //     setStep("success");
    //   } catch {
    //     setErrors({ cardName: "Something went wrong. Please try again." });
    //     setStep("checkout");
    //   }
    // }
  };

  // const handlePaystackSuccess = async (response: any) => {
  //   console.log("Paystack success:", response);
  //   setStep("processing");
  //   try {
  //     await registerUser(email.trim().toLowerCase());
  //     setStep("success");
  //   } catch {
  //     setErrors({ cardName: "Something went wrong saving your account." });
  //     setStep("checkout");
  //   }
  // };

  const handlePaystackSuccess = async (response: any) => {
    if (hasHandledSuccess.current) return; // ✅ block duplicate calls
    hasHandledSuccess.current = true;

    console.log("Paystack success:", response);
    setStep("processing");
    try {
      await registerUser(email.trim().toLowerCase());
      setStep("success");
    } catch {
      setErrors({ cardName: "Something went wrong saving your account." });
      setStep("checkout");
      hasHandledSuccess.current = false; // reset so user can retry
    }
  };

  const handleDone = () => {
    onSuccess(tier);
    onClose();
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />

          {step === "checkout" && (
            <>
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

              <ScrollView showsVerticalScrollIndicator={false}>
                <OrderSummary
                  tier={tier}
                  price={price}
                  tierColor={tierColor}
                  region={region}
                  regionLoading={regionLoading}
                />
                <PaymentMethodSelector
                  paymentMethod={paymentMethod}
                  tierColor={tierColor}
                  onSelect={setPaymentMethod}
                />
                <EmailInput
                  value={email}
                  error={errors.cardName}
                  // error={errors.email}
                  paymentMethod={paymentMethod}
                  onChange={setEmail}
                  onSwitchToCard={() => setPaymentMethod("card")}
                />
                <PayButton
                  tier={tier}
                  price={price}
                  tierColor={tierColor}
                  region={region}
                  regionLoading={regionLoading}
                  onPress={handlePay}
                />
                <View style={{ height: 24 }} />
              </ScrollView>
            </>
          )}

          {step === "paystack" && (
            <PaystackPayment
              price={price}
              email={email.trim().toLowerCase()}
              onSuccess={handlePaystackSuccess}
              onCancel={() => setStep("checkout")}
            />
          )}

          {step === "processing" && <ProcessingScreen tierColor={tierColor} />}

          {step === "success" && (
            <SuccessScreen
              tier={tier}
              tierColor={tierColor}
              onDone={handleDone}
            />
          )}
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
    flex: 1,
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
});

export default CheckoutModal;
