import React, { useState, useEffect } from "react";
import { Text, View, Button, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";

export default function App() {
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState("");

  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    requestPermission();
  }, []);

  // Handle barcode scan
  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (!scanned) {              // only run if not already scanned
      setScanned(true);
      setResult(data);
    }
  };

  if (!permission) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.result}>No access to camera</Text>
        <Button title="Allow Camera" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera only scans if scanned === false */}
      {!scanned && (
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"]
          }}
          onBarcodeScanned={handleBarCodeScanned}
        />
      )}

      <Text style={styles.result}>Scanned: {result}</Text>

      {scanned && (
        <Button title="Scan Again" onPress={() => {
          setScanned(false);
          setResult("");
        }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 4 },
  result: { flex: 1, textAlign: "center", fontSize: 18, padding: 20, color: "#ffffff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" }
});