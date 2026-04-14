import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { PaystackProvider, usePaystack } from "react-native-paystack-webview";
import {
  PAYSTACK_PUBLIC_KEY,
  convertGBPtoKobo,
} from "../../../utils/constant/paystackPayment";

const AutoStartPaystack: React.FC<{
  amount: number;
  email: string;
  reference: string;
  onSuccess: (res: any) => void;
  onCancel: () => void;
}> = ({ amount, email, reference, onSuccess, onCancel }) => {
  const { popup } = usePaystack();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (popup && !hasStarted.current) {
      hasStarted.current = true;
      popup.checkout({ amount, email, reference, onSuccess, onCancel });
    }
  }, [popup]);

  return (
    <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 40 }} />
  );
};

interface Props {
  price: string;
  email: string;
  onSuccess: (res: any) => void;
  onCancel: () => void;
}

const PaystackPaymentConfig: React.FC<Props> = ({
  price,
  email,
  onSuccess,
  onCancel,
}) => {
  const reference = `TB-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;
  const amountInKobo = convertGBPtoKobo(price);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
          Complete Payment
        </Text>
        <TouchableOpacity onPress={onCancel}>
          <Text style={{ color: "#EF4444", fontWeight: "600" }}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <PaystackProvider
        publicKey={PAYSTACK_PUBLIC_KEY}
        onGlobalSuccess={onSuccess}
        onGlobalCancel={onCancel}
        defaultChannels={["card", "bank", "ussd", "mobile_money"]}
        currency="NGN"
      >
        <AutoStartPaystack
          amount={amountInKobo / 100}
          email={email}
          reference={reference}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </PaystackProvider>
    </View>
  );
};

export default PaystackPaymentConfig;
