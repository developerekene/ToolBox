import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";

type Tier = "Silver" | "Gold" | "Platinum";
type Region = "africa" | "outside" | null;
type Currency = "NGN" | "GBP";

interface Props {
  tier: Tier;
  price: string; // GBP base price, e.g. "4.99"
  tierColor: string;
  onPaymentSuccess?: (tier: Tier) => void;
}

const API_URL = "https://YOUR-API-DOMAIN.com";
const GBP_TO_NGN_ESTIMATE = 2050;

const AFRICAN_COUNTRIES = new Set([
  "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM",
  "CF", "TD", "KM", "CG", "CD", "CI", "DJ", "EG",
  "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN",
  "GW", "KE", "LS", "LR", "LY", "MG", "MW", "ML",
  "MR", "MU", "MA", "MZ", "NA", "NE", "NG", "RW",
  "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD",
  "TZ", "TG", "TN", "UG", "ZM", "ZW",
]);

async function parseJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Payment server returned HTML or invalid JSON (HTTP ${response.status}). ` +
      `Check your API_URL and backend endpoint. Response: ${text.slice(0, 150)}`
    );
  }
}
const generateReferenceNumber = (): string => {
  const prefix = "PT";
  const timestamp = Date.now().toString(36);
  const random = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `${prefix}-${timestamp}-${random}`;
};

const PayButton: React.FC<Props> = ({
  tier,
  price,
  tierColor,
  onPaymentSuccess,
}) => {
  const [region, setRegion] = useState<Region>(null);
  const [countryCode, setCountryCode] = useState("");
  const [locationLoading, setLocationLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");

  useEffect(() => {
    let active = true;

    const detectLocation = async () => {
      try {
        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (permission.status !== "granted") {
          throw new Error(
            "Location permission is required to determine your region."
          );
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const results = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        const code = results[0]?.isoCountryCode?.toUpperCase();

        if (!code) {
          throw new Error("Could not determine your country.");
        }

        if (active) {
          setCountryCode(code);
          setRegion(
            AFRICAN_COUNTRIES.has(code) ? "africa" : "outside"
          );
        }
      } catch (error) {
        if (active) {
          const message =
            error instanceof Error
              ? error.message
              : "Location detection failed.";

          Alert.alert("Location unavailable", message);
          setRegion(null);
        }
      } finally {
        if (active) setLocationLoading(false);
      }
    };

    detectLocation();

    return () => {
      active = false;
    };
  }, []);

  const priceGBP = Number.parseFloat(price);
  const validPrice = Number.isFinite(priceGBP) && priceGBP > 0;
  const isAfrica = region === "africa";
  const currency: Currency = isAfrica ? "NGN" : "GBP";

  // Display estimate only. The backend must calculate and validate
  // the actual payable amount.
  const amountMajor = isAfrica
    ? Math.round(priceGBP * GBP_TO_NGN_ESTIMATE)
    : priceGBP;

  const amountLabel = isAfrica
    ? `₦${amountMajor.toLocaleString("en-NG")}`
    : `£${amountMajor.toFixed(2)}`;

  const handlePayment = async () => {
    if (locationLoading || processing) return;

    if (!region || !countryCode) {
      Alert.alert(
        "Location required",
        "Please retry location detection before continuing."
      );
      return;
    }

    if (!validPrice) {
      Alert.alert("Invalid price", "The membership price is invalid.");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (!phone.trim()) {
      Alert.alert("Phone required", "Please enter your phone number.");
      return;
    }

    const generatedRef = generateReferenceNumber();
    setReference(generatedRef);
    setProcessing(true);

    try {
      // This endpoint must be implemented on your backend.
      // It must initialize Paystack using your SECRET KEY,
      // validate the plan and price, and return the checkout URL.
      const response = await fetch(
        `${API_URL}/payments/paystack/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reference: generatedRef,
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            plan: tier,
            countryCode,
            currency,
            // This is a requested amount, NOT a trusted price.
            // Your backend must calculate the authoritative amount.
            requestedAmountMinor: Math.round(amountMajor * 100),
          }),
        }
      );

      const data = await parseJsonResponse(response);

      if (!response.ok || !data.authorizationUrl || !data.reference) {
        throw new Error(
          data.message || "Could not initialize Paystack checkout."
        );
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.authorizationUrl,
        "myapp://payment-callback"
      );

      if (result.type === "success") {
        // Verify using your backend, never trust the browser callback
        // or the reference by itself as proof of payment.
        const verifyResponse = await fetch(
          `${API_URL}/payments/paystack/verify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reference: data.reference,
            }),
          }
        );

        const verification = await parseJsonResponse(verifyResponse);

        if (
          !verifyResponse.ok ||
          verification.status !== "success" ||
          verification.plan !== tier
        ) {
          throw new Error(
            "Payment could not be verified. Please contact support if you were charged."
          );
        }

        Alert.alert(
          "Payment successful",
          `${tier} membership activated. Reference: ${data.reference}`
        );

        onPaymentSuccess?.(tier);
      } else {
        Alert.alert(
          "Checkout closed",
          `If you completed payment, your status will be confirmed after verification. Reference: ${data.reference}`
        );
      }
    } catch (error) {
      console.error("Paystack error:", error);

      Alert.alert(
        "Payment error",
        error instanceof Error
          ? error.message
          : "Unable to process payment. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.container}
      >
        <Text style={styles.title}>Checkout</Text>
        <Text style={styles.subtitle}>
          Complete your details to subscribe to {tier}.
        </Text>

        <View style={styles.locationCard}>
          <Ionicons name="location-outline" size={20} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationTitle}>
              {locationLoading
                ? "Detecting your location..."
                : region === "africa"
                  ? `Africa · ${countryCode} · NGN`
                  : region === "outside"
                    ? `Outside Africa · ${countryCode} · GBP`
                    : "Location unavailable"}
            </Text>
            <Text style={styles.locationDescription}>
              {locationLoading
                ? "Please wait"
                : region
                  ? "Currency selected for your region"
                  : "Enable location permission and try again"}
            </Text>
          </View>
          {locationLoading && <ActivityIndicator />}
        </View>

        <View style={styles.planCard}>
          <Text style={styles.planName}>{tier} Membership</Text>
          <Text style={[styles.price, { color: tierColor }]}>
            {tier === "Silver" ? "Free" : amountLabel}
          </Text>
          <Text style={styles.period}>
            {tier === "Silver" ? "No payment required" : "per month"}
          </Text>
        </View>

        {tier !== "Silver" && (
          <>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#94A3B8"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.secureRow}>
              <Ionicons name="lock-closed" size={13} color="#64748B" />
              <Text style={styles.secureText}>
                Secure checkout powered by Paystack
              </Text>
            </View>
          </>
        )}

        <TouchableOpacity
          style={[
            styles.payButton,
            { backgroundColor: tierColor },
            (processing || locationLoading || !region) &&
            styles.disabled,
          ]}
          onPress={() => {
            if (tier === "Silver") {
              onPaymentSuccess?.("Silver");
            } else {
              handlePayment();
            }
          }}
          disabled={processing || locationLoading || !region}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name={tier === "Silver" ? "checkmark-circle" : "card-outline"}
                size={20}
                color={tier === "Gold" ? "#1a0e00" : "#fff"}
              />
              <Text
                style={[
                  styles.payButtonText,
                  { color: tier === "Gold" ? "#1a0e00" : "#fff" },
                ]}
              >
                {tier === "Silver"
                  ? "Continue with Silver"
                  : locationLoading
                    ? "Detecting location..."
                    : `Pay ${amountLabel} with Paystack`}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {!!reference && (
          <Text style={styles.reference}>
            Latest reference: {reference}
          </Text>
        )}

        <Text style={styles.disclaimer}>
          Prices shown in naira use an estimated conversion rate. Your
          backend must confirm the final amount, currency, and payment
          status before activating a paid membership.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    color: "#64748B",
    marginBottom: 10,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFFBEB",
  },
  locationTitle: {
    fontWeight: "700",
    color: "#334155",
  },
  locationDescription: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 3,
  },
  planCard: {
    padding: 18,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    marginVertical: 8,
  },
  planName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  price: {
    fontSize: 30,
    fontWeight: "800",
    marginTop: 8,
  },
  period: {
    color: "#64748B",
    fontSize: 12,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: "#0F172A",
  },
  secureRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  secureText: {
    color: "#64748B",
    fontSize: 11,
  },
  payButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    marginTop: 8,
  },
  payButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.55,
  },
  reference: {
    color: "#64748B",
    fontSize: 11,
    textAlign: "center",
  },
  disclaimer: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
  },
});

export default PayButton;