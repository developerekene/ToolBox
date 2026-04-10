import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Linking,
  Platform,
  Clipboard,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import VersionBadge from "../../../component/VersionBadge";

const { width } = Dimensions.get("window");
const FRAME_SIZE = width * 0.7;

// ── Types ─────────────────────────────────────────────────────────
type AppView = "scanner" | "result" | "history";

interface ScanEntry {
  id: string;
  data: string;
  type: string;
  scannedAt: Date;
  label: string;
}

// ── Helpers ───────────────────────────────────────────────────────
const pad2 = (n: number): string => (n < 10 ? "0" + n : "" + n);

const formatTime = (d: Date): string => {
  const h = d.getHours();
  const m = pad2(d.getMinutes());
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${m} ${ampm}`;
};

const formatDate = (d: Date): string => {
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const detectType = (
  data: string,
): { type: string; label: string; icon: string; color: string } => {
  if (/^https?:\/\//i.test(data))
    return {
      type: "url",
      label: "URL",
      icon: "globe-outline",
      color: "#3B82F6",
    };
  if (/^mailto:/i.test(data))
    return {
      type: "email",
      label: "Email",
      icon: "mail-outline",
      color: "#10B981",
    };
  if (/^tel:/i.test(data))
    return {
      type: "phone",
      label: "Phone",
      icon: "call-outline",
      color: "#10B981",
    };
  if (/^smsto?:/i.test(data))
    return {
      type: "sms",
      label: "SMS",
      icon: "chatbubble-outline",
      color: "#8B5CF6",
    };
  if (/^WIFI:/i.test(data))
    return {
      type: "wifi",
      label: "Wi-Fi",
      icon: "wifi-outline",
      color: "#F59E0B",
    };
  if (/^BEGIN:VCARD/i.test(data))
    return {
      type: "contact",
      label: "Contact",
      icon: "person-outline",
      color: "#EC4899",
    };
  if (/^BEGIN:VEVENT/i.test(data))
    return {
      type: "event",
      label: "Calendar",
      icon: "calendar-outline",
      color: "#EF4444",
    };
  if (/^geo:/i.test(data))
    return {
      type: "geo",
      label: "Location",
      icon: "location-outline",
      color: "#F97316",
    };
  if (/^\d{10,13}$/.test(data.replace(/\s/g, "")))
    return {
      type: "phone",
      label: "Phone Number",
      icon: "call-outline",
      color: "#10B981",
    };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data))
    return {
      type: "email",
      label: "Email",
      icon: "mail-outline",
      color: "#10B981",
    };
  if (/^upi:\/\//i.test(data))
    return {
      type: "payment",
      label: "Payment",
      icon: "card-outline",
      color: "#10B981",
    };
  return {
    type: "text",
    label: "Text",
    icon: "text-outline",
    color: "#64748B",
  };
};

const parseWifi = (data: string): Record<string, string> => {
  const out: Record<string, string> = {};
  const ssid = data.match(/S:([^;]*)/);
  const pass = data.match(/P:([^;]*)/);
  const auth = data.match(/T:([^;]*)/);
  if (ssid) out["Network"] = ssid[1];
  if (auth) out["Security"] = auth[1];
  if (pass) out["Password"] = pass[1];
  return out;
};

const makeId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

// ── Component ─────────────────────────────────────────────────────
const ORScanner: React.FC = () => {
  const [view, setView] = useState<AppView>("scanner");
  const [permission, requestPerm] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [activeEntry, setActiveEntry] = useState<ScanEntry | null>(null);
  const [history, setHistory] = useState<ScanEntry[]>([]);
  const [copied, setCopied] = useState(false);

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Scan line animation
  useEffect(() => {
    if (view === "scanner" && !scanned) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      scanLineAnim.stopAnimation();
    }
  }, [view, scanned]);

  // Pulse on scan
  const triggerPulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.08,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ── Handle scan ───────────────────────────────────────────────
  const handleScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    triggerPulse();

    const detected = detectType(data);
    const entry: ScanEntry = {
      id: makeId(),
      data,
      type: detected.type,
      scannedAt: new Date(),
      label: detected.label,
    };

    setActiveEntry(entry);
    setHistory((prev) => [entry, ...prev].slice(0, 20));
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
    setView("result");
  };

  const resetScanner = () => {
    setScanned(false);
    setActiveEntry(null);
    setView("scanner");
    fadeAnim.setValue(1);
  };

  const openHistory = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setView("history");
  };

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = async (data: string, type: string) => {
    try {
      let url = data;
      if (type === "email" && !data.startsWith("mailto:"))
        url = `mailto:${data}`;
      if (type === "phone" && !data.startsWith("tel:"))
        url = `tel:${data.replace(/\D/g, "")}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Cannot Open",
          "This device cannot open this type of link.",
        );
      }
    } catch {
      Alert.alert("Error", "Could not open the link.");
    }
  };

  const deleteEntry = (id: string) => {
    setHistory((prev) => prev.filter((e) => e.id !== id));
  };

  const clearHistory = () => {
    Alert.alert("Clear History", "Delete all scan history?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => setHistory([]) },
    ]);
  };

  // ── Permission not granted ────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicatorView />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.permContent}>
          <View style={styles.permIconWrap}>
            <Ionicons name="camera-outline" size={48} color="#3B82F6" />
          </View>
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permSubtitle}>
            Grant camera permission to scan QR codes and barcodes.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPerm}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.permBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <Text style={styles.infoText}>
                Camera is only used for scanning. No images are stored or
                uploaded.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ════════════════════════════════════════
  // RESULT VIEW
  // ════════════════════════════════════════
  if (view === "result" && activeEntry) {
    const detected = detectType(activeEntry.data);
    const isUrl = detected.type === "url";
    const isWifi = detected.type === "wifi";
    const wifiInfo = isWifi ? parseWifi(activeEntry.data) : null;
    const canOpen =
      ["url", "email", "phone", "sms", "geo"].indexOf(detected.type) !== -1;

    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Scan Result</Text>
            <Text style={styles.subheaderText}>QR / Barcode decoded</Text>
          </View>

          {/* Type badge */}
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: detected.color + "18",
                borderColor: detected.color + "44",
              },
            ]}
          >
            <Ionicons
              name={detected.icon as any}
              size={22}
              color={detected.color}
            />
            <Text style={[styles.typeBadgeText, { color: detected.color }]}>
              {detected.label}
            </Text>
            <Text style={styles.typeBadgeTime}>
              {formatTime(activeEntry.scannedAt)}
            </Text>
          </View>

          {/* Data card */}
          <View style={styles.dataCard}>
            <View style={styles.dataCardHeader}>
              <Text style={styles.dataCardLabel}>Scanned Data</Text>
              <TouchableOpacity
                style={[styles.copyBtn, copied && styles.copyBtnActive]}
                onPress={() => handleCopy(activeEntry.data)}
              >
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={15}
                  color={copied ? "#fff" : "#10B981"}
                />
                <Text
                  style={[
                    styles.copyBtnText,
                    copied && styles.copyBtnTextActive,
                  ]}
                >
                  {copied ? "Copied!" : "Copy"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.dataText} selectable>
              {activeEntry.data}
            </Text>
          </View>

          {/* Wi-Fi parsed */}
          {isWifi && wifiInfo && (
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>Wi-Fi Network Details</Text>
              {Object.keys(wifiInfo).map((key) => (
                <View key={key} style={styles.resultRow}>
                  <Text style={styles.resultRowLabel}>{key}</Text>
                  <Text
                    style={[
                      styles.resultRowValue,
                      key === "Password" && { color: "#F59E0B" },
                    ]}
                  >
                    {wifiInfo[key]}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionButtons}>
            {canOpen && (
              <TouchableOpacity
                style={styles.openBtn}
                onPress={() => handleOpen(activeEntry.data, detected.type)}
                activeOpacity={0.8}
              >
                <Ionicons name="open-outline" size={20} color="#fff" />
                <Text style={styles.openBtnText}>
                  {detected.type === "url"
                    ? "Open in Browser"
                    : detected.type === "email"
                      ? "Send Email"
                      : detected.type === "phone"
                        ? "Call Number"
                        : detected.type === "sms"
                          ? "Send SMS"
                          : "Open"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.histBtn} onPress={openHistory}>
              <Ionicons name="time-outline" size={18} color="#94A3B8" />
              <Text style={styles.histBtnText}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.scanAgainBtn}
              onPress={resetScanner}
              activeOpacity={0.8}
            >
              <Ionicons name="scan-outline" size={20} color="#fff" />
              <Text style={styles.scanAgainBtnText}>Scan Again</Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <Text style={styles.infoText}>
                Scan history is stored locally on your device only.
              </Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    );
  }

  // ════════════════════════════════════════
  // HISTORY VIEW
  // ════════════════════════════════════════
  if (view === "history") {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerText}>Scan History</Text>
            <Text style={styles.subheaderText}>
              {history.length} {history.length === 1 ? "scan" : "scans"}{" "}
              recorded
            </Text>
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="scan-outline" size={36} color="#334155" />
              </View>
              <Text style={styles.emptyText}>No scans yet</Text>
              <Text style={styles.emptySubtext}>
                Your scan history will appear here
              </Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.clearHistBtn}
                onPress={clearHistory}
              >
                <Ionicons name="trash-outline" size={15} color="#EF4444" />
                <Text style={styles.clearHistText}>Clear All</Text>
              </TouchableOpacity>

              {history.map((entry) => {
                const det = detectType(entry.data);
                return (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.historyCard}
                    onPress={() => {
                      setActiveEntry(entry);
                      setView("result");
                    }}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.histIconWrap,
                        { backgroundColor: det.color + "18" },
                      ]}
                    >
                      <Ionicons
                        name={det.icon as any}
                        size={20}
                        color={det.color}
                      />
                    </View>
                    <View style={styles.histInfo}>
                      <Text style={styles.histLabel}>{det.label}</Text>
                      <Text style={styles.histData} numberOfLines={1}>
                        {entry.data}
                      </Text>
                      <Text style={styles.histDate}>
                        {formatDate(entry.scannedAt)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => deleteEntry(entry.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={20}
                        color="#334155"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          <TouchableOpacity
            style={styles.scanAgainBtn}
            onPress={resetScanner}
            activeOpacity={0.8}
          >
            <Ionicons name="scan-outline" size={20} color="#fff" />
            <Text style={styles.scanAgainBtnText}>Back to Scanner</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    );
  }

  // ════════════════════════════════════════
  // SCANNER VIEW
  // ════════════════════════════════════════
  return (
    <View style={styles.scanContainer}>
      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: [
            "qr",
            "ean13",
            "ean8",
            "code128",
            "code39",
            "pdf417",
            "aztec",
            "datamatrix",
            "itf14",
            "upc_e",
          ],
        }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />

      {/* Dark overlay with cutout */}
      <View style={styles.overlay}>
        {/* Top */}
        <View style={styles.overlayTop}>
          {/* Header bar */}
          <View>
            <VersionBadge version="0.03" />
          </View>
          <View style={styles.scanHeader}>
            <Text style={styles.scanTitle}>QR Scanner</Text>
            <TouchableOpacity style={styles.historyBtn} onPress={openHistory}>
              <Ionicons name="time-outline" size={20} color="#fff" />
              {history.length > 0 && (
                <View style={styles.histBadge}>
                  <Text style={styles.histBadgeText}>
                    {history.length > 9 ? "9+" : history.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.scanSubtitle}>
            Point camera at a QR code or barcode
          </Text>
        </View>

        {/* Frame row */}
        <View style={styles.frameRow}>
          <View style={styles.overlaySide} />

          {/* Scanner frame */}
          <Animated.View
            style={[styles.frame, { transform: [{ scale: pulseAnim }] }]}
          >
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Animated scan line */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [
                    {
                      translateY: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, FRAME_SIZE - 4],
                      }),
                    },
                  ],
                },
              ]}
            />
          </Animated.View>

          <View style={styles.overlaySide} />
        </View>

        {/* Bottom controls */}
        <View style={styles.overlayBottom}>
          <View style={styles.controls}>
            {/* Torch */}
            <TouchableOpacity
              style={[styles.controlBtn, torch && styles.controlBtnActive]}
              onPress={() => setTorch(!torch)}
            >
              <Ionicons
                name={torch ? "flash" : "flash-outline"}
                size={24}
                color={torch ? "#F59E0B" : "#fff"}
              />
              <Text
                style={[styles.controlLabel, torch && { color: "#F59E0B" }]}
              >
                Torch
              </Text>
            </TouchableOpacity>

            {/* Scan indicator */}
            <View style={styles.scanIndicator}>
              <View style={styles.scanDot} />
              <Text style={styles.scanIndicatorText}>Ready</Text>
            </View>

            {/* Flip */}
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => setFacing(facing === "back" ? "front" : "back")}
            >
              <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
              <Text style={styles.controlLabel}>Flip</Text>
            </TouchableOpacity>
          </View>

          {/* Supported types */}
          <Text style={styles.supportedText}>
            QR · EAN · Code128 · PDF417 · Aztec · DataMatrix
          </Text>
        </View>
      </View>
    </View>
  );
};

// Small loading placeholder
const ActivityIndicatorView = () => (
  <View style={{ alignItems: "center", gap: 12 }}>
    <Ionicons name="camera-outline" size={40} color="#334155" />
    <Text style={{ color: "#475569", fontSize: 14 }}>Loading camera…</Text>
  </View>
);

export default ORScanner;

// ─── STYLES ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101828" },
  centeredContainer: {
    flex: 1,
    backgroundColor: "#101828",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    padding: 20,
    paddingTop: Platform.OS === "android" ? 40 : 60,
    paddingBottom: 40,
  },

  // Permission screen
  permContent: {
    padding: 20,
    paddingTop: Platform.OS === "android" ? 60 : 80,
    alignItems: "center",
  },
  permIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  permTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  permSubtitle: {
    color: "#94A3B8",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  permBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginBottom: 24,
  },
  permBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Header
  header: { marginBottom: 22 },
  headerText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subheaderText: { fontSize: 15, color: "#CBD5E1", textAlign: "center" },

  // Type badge
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  typeBadgeText: { flex: 1, fontSize: 16, fontWeight: "700" },
  typeBadgeTime: { color: "#475569", fontSize: 12 },

  // Data card
  dataCard: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 16,
    marginBottom: 16,
  },
  dataCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dataCardLabel: { color: "#E2E8F0", fontSize: 14, fontWeight: "600" },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#10B98118",
    borderWidth: 1,
    borderColor: "#10B98144",
  },
  copyBtnActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
  copyBtnText: { color: "#10B981", fontSize: 12, fontWeight: "600" },
  copyBtnTextActive: { color: "#fff" },
  dataText: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },

  // Result card
  resultCard: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 16,
    marginBottom: 16,
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  resultRowLabel: { color: "#94A3B8", fontSize: 14 },
  resultRowValue: { color: "#E2E8F0", fontSize: 14, fontWeight: "600" },

  // Action buttons
  actionButtons: { gap: 10, marginBottom: 14 },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3B82F6",
    paddingVertical: 15,
    borderRadius: 14,
  },
  openBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Bottom actions
  bottomActions: { flexDirection: "row", gap: 10, marginBottom: 20 },
  histBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  histBtnText: { color: "#94A3B8", fontWeight: "600", fontSize: 14 },
  scanAgainBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10B981",
    paddingVertical: 15,
    borderRadius: 14,
  },
  scanAgainBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // History
  clearHistBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#EF444433",
    marginBottom: 14,
  },
  clearHistText: { color: "#EF4444", fontSize: 13, fontWeight: "600" },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 14,
    marginBottom: 10,
  },
  histIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  histInfo: { flex: 1 },
  histLabel: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  histData: { color: "#64748B", fontSize: 12, marginBottom: 2 },
  histDate: { color: "#334155", fontSize: 11 },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
    marginBottom: 30,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: { color: "#475569", fontSize: 16, fontWeight: "600" },
  emptySubtext: { color: "#334155", fontSize: 13 },

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
    marginBottom: 4,
  },
  infoText: { flex: 1, color: "#CBD5E1", fontSize: 14, lineHeight: 20 },

  // ── Scanner UI ──
  scanContainer: { flex: 1, backgroundColor: "#000" },

  overlay: { flex: 1 },
  overlayTop: {
    paddingTop: Platform.OS === "android" ? 48 : 64,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  scanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  scanTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  scanSubtitle: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  histBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  histBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },

  frameRow: { flexDirection: "row", alignItems: "center" },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignSelf: "stretch",
  },

  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },

  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#10B981",
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },

  scanLine: {
    position: "absolute",
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },

  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 40,
    marginBottom: 20,
  },
  controlBtn: {
    alignItems: "center",
    gap: 6,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  controlBtnActive: { backgroundColor: "rgba(245,158,11,0.2)" },
  controlLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "600",
  },

  scanIndicator: { alignItems: "center", gap: 8 },
  scanDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  scanIndicatorText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
  },

  supportedText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 0.5,
  },
});

// import React, { useState, useEffect } from "react";
// import { Text, View, Button, StyleSheet } from "react-native";
// import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";

// export default function App() {
//   const [scanned, setScanned] = useState(false);
//   const [result, setResult] = useState("");

//   const [permission, requestPermission] = useCameraPermissions();

//   useEffect(() => {
//     requestPermission();
//   }, []);

//   // Handle barcode scan
//   const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
//     if (!scanned) {              // only run if not already scanned
//       setScanned(true);
//       setResult(data);
//     }
//   };

//   if (!permission) {
//     return <Text>Requesting camera permission...</Text>;
//   }

//   if (!permission.granted) {
//     return (
//       <View style={styles.center}>
//         <Text style={styles.result}>No access to camera</Text>
//         <Button title="Allow Camera" onPress={requestPermission} />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Camera only scans if scanned === false */}
//       {!scanned && (
//         <CameraView
//           style={styles.camera}
//           barcodeScannerSettings={{
//             barcodeTypes: ["qr"]
//           }}
//           onBarcodeScanned={handleBarCodeScanned}
//         />
//       )}

//       <Text style={styles.result}>Scanned: {result}</Text>

//       {scanned && (
//         <Button title="Scan Again" onPress={() => {
//           setScanned(false);
//           setResult("");
//         }} />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   camera: { flex: 4 },
//   result: { flex: 1, textAlign: "center", fontSize: 18, padding: 20, color: "#ffffff" },
//   center: { flex: 1, justifyContent: "center", alignItems: "center" }
// });
