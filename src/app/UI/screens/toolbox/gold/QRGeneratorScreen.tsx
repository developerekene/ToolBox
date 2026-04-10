import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import VersionBadge from "../../../component/VersionBadge";

const QRGeneratorScreen: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [qrText, setQrText] = useState("");
  const [qrSize, setQrSize] = useState(200);
  const svgRef = useRef<any>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const [isSaving, setIsSaving] = useState(false);

  const qrSizes = [
    { label: "Small", value: 150 },
    { label: "Medium", value: 200 },
    { label: "Large", value: 250 },
  ];

  const presets = [
    { label: "Website", icon: "globe-outline", prefix: "https://" },
    { label: "Email", icon: "mail-outline", prefix: "mailto:" },
    { label: "Phone", icon: "call-outline", prefix: "tel:" },
    { label: "SMS", icon: "chatbubble-outline", prefix: "sms:" },
  ];

  const generateQR = () => {
    if (!inputText.trim()) {
      Alert.alert(
        "Input Required",
        "Please enter text or URL to generate QR code",
      );
      return;
    }
    setQrText(inputText.trim());
  };

  const applyPreset = (prefix: string) => {
    setInputText(prefix);
  };

  const clearAll = () => {
    setInputText("");
    setQrText("");
  };

  const shareQR = async () => {
    if (!qrText) return;
    try {
      await Share.share({ message: qrText });
    } catch (e) {
      Alert.alert("Share Failed", "Could not share QR content.");
    }
  };

  const saveToGallery = async () => {
    if (!qrText) return;
    setIsSaving(true);
    try {
      // Check current permission status first
      const { status: existingStatus } =
        await MediaLibrary.getPermissionsAsync();

      let finalStatus = existingStatus;

      // Only request if not already granted
      if (existingStatus !== "granted") {
        const { status: newStatus } =
          await MediaLibrary.requestPermissionsAsync();
        finalStatus = newStatus;
      }

      // If still not granted after requesting, guide user to Settings
      if (finalStatus !== "granted") {
        Alert.alert(
          "Permission Denied",
          "To save QR codes, go to Settings → D'roid One → Photos and enable access.",
          [{ text: "OK" }],
        );
        setIsSaving(false);
        return;
      }

      // Capture the ViewShot wrapper as a PNG
      const uri = await captureRef(viewShotRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      // Save to camera roll
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("D'roid One", asset, false);

      Alert.alert(
        "✅ Saved!",
        "QR code saved to your gallery in the 'D'roid One' album.",
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Save Failed", "Could not save QR code to gallery.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View>
        <VersionBadge version="0.03" />
      </View>
      <View style={styles.header}>
        <Text style={styles.headerText}>QR Code Generator</Text>
        <Text style={styles.subheaderText}>
          Generate QR codes for text, URLs, and more
        </Text>
      </View>

      {/* QR Code Display */}
      {qrText ? (
        <View style={styles.qrContainer}>
          {/* ViewShot wraps only the QR so we capture a clean white image */}
          <ViewShot
            ref={viewShotRef}
            options={{ format: "png", quality: 1 }}
            style={styles.qrWrapper}
          >
            <QRCode
              value={qrText}
              size={qrSize}
              color="#000000"
              backgroundColor="#ffffff"
              getRef={(ref) => (svgRef.current = ref)}
              ecl="H"
            />
          </ViewShot>
          <Text style={styles.qrValue} numberOfLines={2} ellipsizeMode="middle">
            {qrText}
          </Text>

          {/* Action Buttons Row */}
          <View style={styles.qrActionRow}>
            <TouchableOpacity style={styles.shareBtn} onPress={shareQR}>
              <Ionicons name="share-social-outline" size={18} color="#fff" />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={saveToGallery}
              disabled={isSaving}
            >
              {isSaving ? (
                <Text style={styles.saveBtnText}>Saving…</Text>
              ) : (
                <>
                  <Ionicons name="download-outline" size={18} color="#000105" />
                  <Text style={styles.saveBtnText}>Save to Gallery</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Ionicons name="qr-code-outline" size={80} color="#334155" />
          <Text style={styles.placeholderText}>No QR Code Generated</Text>
          <Text style={styles.placeholderSubtext}>
            Enter text below and tap Generate
          </Text>
        </View>
      )}

      {/* Size Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>QR Code Size</Text>
        <View style={styles.sizeContainer}>
          {qrSizes.map((size) => (
            <TouchableOpacity
              key={size.value}
              style={[
                styles.sizeButton,
                qrSize === size.value && styles.sizeButtonActive,
              ]}
              onPress={() => setQrSize(size.value)}
            >
              <Text
                style={[
                  styles.sizeText,
                  qrSize === size.value && styles.sizeTextActive,
                ]}
              >
                {size.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Presets */}
      <View style={styles.section}>
        <Text style={styles.label}>Quick Presets</Text>
        <View style={styles.presetsContainer}>
          {presets.map((preset) => (
            <TouchableOpacity
              key={preset.label}
              style={styles.presetButton}
              onPress={() => applyPreset(preset.prefix)}
            >
              <Ionicons name={preset.icon as any} size={24} color="#fff" />
              <Text style={styles.presetText}>{preset.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Text Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Enter Text or URL</Text>
        <TextInput
          style={styles.textArea}
          placeholder="https://example.com or any text..."
          placeholderTextColor="#64748B"
          value={inputText}
          onChangeText={setInputText}
          multiline
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.characterCount}>
          <Text style={styles.characterCountText}>
            {inputText.length} characters
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearAll}
          disabled={!inputText && !qrText}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.generateButton,
            !inputText.trim() && styles.buttonDisabled,
          ]}
          onPress={generateQR}
          disabled={!inputText.trim()}
        >
          <Ionicons name="qr-code-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Generate</Text>
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            QR codes can store URLs, text, phone numbers, emails, and more
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
          <Text style={styles.infoText}>
            All QR codes are generated locally on your device
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default QRGeneratorScreen;

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
  header: {
    marginBottom: 24,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subheaderText: {
    fontSize: 16,
    color: "#CBD5E1",
    textAlign: "center",
  },
  qrContainer: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  qrWrapper: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  qrValue: {
    color: "#CBD5E1",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  shareBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  qrActionRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 4,
  },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F59E0B",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: "#000105",
    fontWeight: "700",
    fontSize: 14,
  },
  placeholderContainer: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#334155",
    borderStyle: "dashed",
  },
  placeholderText: {
    color: "#CBD5E1",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  placeholderSubtext: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  label: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  sizeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  sizeButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
  },
  sizeButtonActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  sizeText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },
  sizeTextActive: {
    color: "#fff",
  },
  presetsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  presetButton: {
    flex: 1,
    backgroundColor: "#1E293B",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    gap: 8,
  },
  presetText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 24,
  },
  textArea: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    height: 120,
    borderWidth: 1,
    borderColor: "#334155",
  },
  characterCount: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  characterCountText: {
    color: "#64748B",
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  clearButton: {
    backgroundColor: "#334155",
  },
  generateButton: {
    backgroundColor: "#10B981",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  infoCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
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
