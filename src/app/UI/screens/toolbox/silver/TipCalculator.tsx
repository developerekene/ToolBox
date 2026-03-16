import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

export default function App() {
  const [bill, setBill] = useState("");
  const [tipPercent, setTipPercent] = useState(15);
  const [tip, setTip] = useState(0);
  const [total, setTotal] = useState(0);

  const calculateTip = () => {
    const billAmount = parseFloat(bill);
    if (isNaN(billAmount)) {
      setTip(0);
      setTotal(0);
      return;
    }

    const tipAmount = (billAmount * tipPercent) / 100;
    setTip(tipAmount);
    setTotal(billAmount + tipAmount);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tip Calculator</Text>

      <Text>Bill Amount ($):</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={bill}
        onChangeText={setBill}
        placeholder="Enter bill amount"
      />

      <Text>Tip Percentage: {tipPercent}%</Text>
      <View style={styles.buttonRow}>
        <Button title="10%" onPress={() => setTipPercent(10)} />
        <Button title="15%" onPress={() => setTipPercent(15)} />
        <Button title="20%" onPress={() => setTipPercent(20)} />
      </View>

      <Button title="Calculate Tip" onPress={calculateTip} />

      <Text style={styles.result}>Tip: ${tip.toFixed(2)}</Text>
      <Text style={styles.result}>Total: ${total.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  result: {
    fontSize: 18,
    marginTop: 10,
  },
});
