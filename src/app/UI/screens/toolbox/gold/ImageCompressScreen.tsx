import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as ImageManipulator from "expo-image-manipulator";
import * as Sharing from "expo-sharing";

const { width } = Dimensions.get("window");

type CompressedImage = {
  uri: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  name: string;
};

type CompressMode = "idle" | "processing" | "done";

const QUALITY_PRESETS = [
  { label: "Low", sublabel: "~30%", value: 0.3, color: "#EF4444" },
  { label: "Medium", sublabel: "~60%", value: 0.6, color: "#F59E0B" },
  { label: "High", sublabel: "~80%", value: 0.8, color: "#10B981" },
  { label: "Max", sublabel: "~95%", value: 0.95, color: "#3B82F6" },
];

const FORMAT_OPTIONS = [
  { label: "JPEG", value: ImageManipulator.SaveFormat.JPEG },
  { label: "PNG", value: ImageManipulator.SaveFormat.PNG },
];

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getSavingsPercent = (original: number, compressed: number): number =>
  Math.round(((original - compressed) / original) * 100);

const ImageCompressorScreen: React.FC = () => {
  const [mode, setMode] = useState<CompressMode>("idle");
  const [originalUri, setOriginalUri] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [originalDims, setOriginalDims] = useState({ width: 0, height: 0 });
  const [compressed, setCompressed] = useState<CompressedImage | null>(null);
  const [quality, setQuality] = useState(0.6);
  const [format, setFormat] = useState<ImageManipulator.SaveFormat>(
    ImageManipulator.SaveFormat.JPEG,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isRecompressing, setIsRecompressing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const fadeIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  // ── Pick image from gallery or camera ──
  const pickImage = async (source: "camera" | "gallery") => {
    let result;

    if (source === "camera") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Camera access is needed.");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1, // Always pick at full quality — we compress manually
        allowsEditing: false,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });
    }

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setOriginalUri(asset.uri);
      setOriginalDims({ width: asset.width, height: asset.height });

      // expo-image-picker gives fileSize on asset
      const size =
        asset.fileSize ?? estimateSizeFromDims(asset.width, asset.height);
      setOriginalSize(size);

      setCompressed(null);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);

      // Auto-compress immediately with current settings
      await compressImage(asset.uri, size, quality, format);
    }
  };

  // Rough size estimate if fileSize unavailable
  const estimateSizeFromDims = (w: number, h: number) => w * h * 3;

  // ── Core compression logic ──
  const compressImage = async (
    uri: string,
    origSize: number,
    q: number,
    fmt: ImageManipulator.SaveFormat,
  ) => {
    setMode("processing");
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [], // No transforms — compression only
        {
          compress: q,
          format: fmt,
        },
      );

      // Fetch the file as blob to get real compressed size
      let compressedSize = origSize * q; // fallback estimate
      try {
        const response = await fetch(result.uri);
        const blob = await response.blob();
        compressedSize = blob.size;
      } catch (_) {}

      const newCompressed: CompressedImage = {
        uri: result.uri,
        originalSize: origSize,
        compressedSize,
        width: result.width,
        height: result.height,
        name: `compressed_${Date.now()}.${fmt === ImageManipulator.SaveFormat.PNG ? "png" : "jpg"}`,
      };

      setCompressed(newCompressed);
      setMode("done");
      fadeIn();
    } catch (err) {
      console.error(err);
      Alert.alert("Compression Failed", "Could not compress the image.");
      setMode("idle");
    }
  };

  // ── Re-compress with new settings ──
  const recompress = async () => {
    if (!originalUri) return;
    setIsRecompressing(true);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    await compressImage(originalUri, originalSize, quality, format);
    setIsRecompressing(false);
  };

  // ── Save to gallery ──
  const saveToGallery = async () => {
    if (!compressed) return;
    setIsSaving(true);
    try {
      const { status: existing } = await MediaLibrary.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== "granted") {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Go to Settings → D'roid One → Photos to enable access.",
        );
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(compressed.uri);
      await MediaLibrary.createAlbumAsync("D'roid One", asset, false);
      Alert.alert(
        "✅ Saved!",
        "Compressed image saved to your gallery in the 'D'roid One' album.",
      );
    } catch (err) {
      Alert.alert("Save Failed", "Could not save image to gallery.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Share ──
  const shareImage = async () => {
    if (!compressed) return;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(compressed.uri, { mimeType: "image/jpeg" });
    }
  };

  // ── Reset ──
  const reset = () => {
    setMode("idle");
    setOriginalUri(null);
    setCompressed(null);
    setOriginalSize(0);
    fadeAnim.setValue(0);
  };

  // ════════════════════════════════════════════
  // IDLE STATE
  // ════════════════════════════════════════════
  if (mode === "idle") {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.idleContent}
      >
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.heroRingOuter}>
            <View style={styles.heroRingInner}>
              <FontAwesome5
                name="compress-arrows-alt"
                size={38}
                color="#6366F1"
              />
            </View>
          </View>
          <Text style={styles.heroTitle}>Image Compressor</Text>
          <Text style={styles.heroSubtitle}>
            Reduce image file size without{"\n"}sacrificing visible quality
          </Text>
        </View>

        {/* Pick Source */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionCard, { borderColor: "#6366F1" }]}
            onPress={() => pickImage("gallery")}
          >
            <View
              style={[styles.actionIconWrap, { backgroundColor: "#6366F122" }]}
            >
              <Ionicons name="images" size={30} color="#6366F1" />
            </View>
            <Text style={styles.actionCardTitle}>Gallery</Text>
            <Text style={styles.actionCardSub}>Pick from photos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { borderColor: "#8B5CF6" }]}
            onPress={() => pickImage("camera")}
          >
            <View
              style={[styles.actionIconWrap, { backgroundColor: "#8B5CF622" }]}
            >
              <Ionicons name="camera" size={30} color="#8B5CF6" />
            </View>
            <Text style={styles.actionCardTitle}>Camera</Text>
            <Text style={styles.actionCardSub}>Capture & compress</Text>
          </TouchableOpacity>
        </View>

        {/* Quality Presets */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Compression Quality</Text>
          <View style={styles.presetsGrid}>
            {QUALITY_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.label}
                style={[
                  styles.presetCard,
                  quality === preset.value && {
                    borderColor: preset.color,
                    backgroundColor: `${preset.color}18`,
                  },
                ]}
                onPress={() => setQuality(preset.value)}
              >
                <View
                  style={[styles.presetDot, { backgroundColor: preset.color }]}
                />
                <Text
                  style={[
                    styles.presetLabel,
                    quality === preset.value && { color: preset.color },
                  ]}
                >
                  {preset.label}
                </Text>
                <Text style={styles.presetSublabel}>{preset.sublabel}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Format */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Output Format</Text>
          <View style={styles.formatRow}>
            {FORMAT_OPTIONS.map((f) => (
              <TouchableOpacity
                key={f.label}
                style={[
                  styles.formatBtn,
                  format === f.value && styles.formatBtnActive,
                ]}
                onPress={() => setFormat(f.value)}
              >
                <Text
                  style={[
                    styles.formatBtnText,
                    format === f.value && styles.formatBtnTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={14} color="#6366F1" />
            {"  "}Tips
          </Text>
          {[
            "JPEG works best for photos & real-world images",
            "PNG is ideal for screenshots & graphics with text",
            "Low quality = smallest file, less detail",
            "High quality keeps detail, moderate savings",
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.tipDot, { backgroundColor: "#6366F1" }]} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  // ════════════════════════════════════════════
  // PROCESSING STATE
  // ════════════════════════════════════════════
  if (mode === "processing") {
    return (
      <View style={styles.processingContainer}>
        <View style={styles.processingRing}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
        <Text style={styles.processingTitle}>Compressing…</Text>
        <Text style={styles.processingSubtitle}>
          Optimizing image quality & file size
        </Text>
        <View style={styles.processingSteps}>
          {[
            "Reading image data",
            "Applying compression",
            "Saving output file",
          ].map((step, i) => (
            <View key={i} style={styles.processingStep}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.processingStepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // ════════════════════════════════════════════
  // DONE STATE — Results
  // ════════════════════════════════════════════
  const savings = compressed
    ? getSavingsPercent(compressed.originalSize, compressed.compressedSize)
    : 0;
  const savingsColor =
    savings >= 50 ? "#10B981" : savings >= 20 ? "#F59E0B" : "#EF4444";

  return (
    <Animated.ScrollView
      style={[styles.container, { opacity: fadeAnim }]}
      contentContainerStyle={styles.doneContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Before / After Preview */}
      <View style={styles.previewRow}>
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Original</Text>
          {originalUri && (
            <Image
              source={{ uri: originalUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          )}
          <Text style={styles.previewSize}>{formatBytes(originalSize)}</Text>
        </View>

        <View style={styles.previewArrow}>
          <Ionicons name="arrow-forward" size={22} color="#6366F1" />
        </View>

        <View style={[styles.previewCard, { borderColor: savingsColor }]}>
          <Text style={[styles.previewLabel, { color: savingsColor }]}>
            Compressed
          </Text>
          {compressed && (
            <Image
              source={{ uri: compressed.uri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          )}
          <Text style={[styles.previewSize, { color: savingsColor }]}>
            {compressed ? formatBytes(compressed.compressedSize) : "—"}
          </Text>
        </View>
      </View>

      {/* Savings Badge */}
      <View
        style={[
          styles.savingsBadge,
          { backgroundColor: `${savingsColor}18`, borderColor: savingsColor },
        ]}
      >
        <MaterialIcons name="compress" size={20} color={savingsColor} />
        <Text style={[styles.savingsText, { color: savingsColor }]}>
          {savings}% smaller — saved{" "}
          {compressed
            ? formatBytes(compressed.originalSize - compressed.compressedSize)
            : "0 B"}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {[
          { label: "Original Size", value: formatBytes(originalSize) },
          {
            label: "Compressed",
            value: compressed ? formatBytes(compressed.compressedSize) : "—",
          },
          {
            label: "Dimensions",
            value: compressed
              ? `${compressed.width}×${compressed.height}`
              : "—",
          },
          {
            label: "Format",
            value: format === ImageManipulator.SaveFormat.PNG ? "PNG" : "JPEG",
          },
        ].map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Re-compress Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Adjust & Re-compress</Text>
        <View style={styles.presetsGrid}>
          {QUALITY_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.label}
              style={[
                styles.presetCard,
                quality === preset.value && {
                  borderColor: preset.color,
                  backgroundColor: `${preset.color}18`,
                },
              ]}
              onPress={() => setQuality(preset.value)}
            >
              <View
                style={[styles.presetDot, { backgroundColor: preset.color }]}
              />
              <Text
                style={[
                  styles.presetLabel,
                  quality === preset.value && { color: preset.color },
                ]}
              >
                {preset.label}
              </Text>
              <Text style={styles.presetSublabel}>{preset.sublabel}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formatRow}>
          {FORMAT_OPTIONS.map((f) => (
            <TouchableOpacity
              key={f.label}
              style={[
                styles.formatBtn,
                format === f.value && styles.formatBtnActive,
              ]}
              onPress={() => setFormat(f.value)}
            >
              <Text
                style={[
                  styles.formatBtnText,
                  format === f.value && styles.formatBtnTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.recompressBtn, isRecompressing && { opacity: 0.6 }]}
          onPress={recompress}
          disabled={isRecompressing}
        >
          {isRecompressing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.recompressBtnText}>Re-compress</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.resetBtn} onPress={reset}>
          <Ionicons name="arrow-back" size={18} color="#64748b" />
          <Text style={styles.resetBtnText}>New</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareBtn} onPress={shareImage}>
          <Ionicons name="share-social-outline" size={18} color="#fff" />
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
          onPress={saveToGallery}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#000105" />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color="#000105" />
              <Text style={styles.saveBtnText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Animated.ScrollView>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101828",
  },
  idleContent: {
    padding: 20,
    paddingBottom: 40,
  },
  doneContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // ── Hero ──
  heroSection: {
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 32,
  },
  heroRingOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#6366F144",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  heroRingInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#6366F118",
    borderWidth: 2,
    borderColor: "#6366F188",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
  },

  // ── Action Cards ──
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#1E2D40",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    borderWidth: 1.5,
  },
  actionIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionCardTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
    marginBottom: 4,
  },
  actionCardSub: {
    color: "#64748b",
    fontSize: 12,
  },

  // ── Section ──
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // ── Quality Presets ──
  presetsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  presetCard: {
    flex: 1,
    backgroundColor: "#1a2235",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#334155",
    gap: 6,
  },
  presetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  presetLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  presetSublabel: {
    color: "#64748b",
    fontSize: 11,
  },

  // ── Format ──
  formatRow: {
    flexDirection: "row",
    gap: 10,
  },
  formatBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#1a2235",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  formatBtnActive: {
    backgroundColor: "#6366F122",
    borderColor: "#6366F1",
  },
  formatBtnText: {
    color: "#64748b",
    fontWeight: "700",
    fontSize: 14,
  },
  formatBtnTextActive: {
    color: "#6366F1",
  },

  // ── Tips ──
  tipsCard: {
    backgroundColor: "#1a2235",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#6366F122",
    marginTop: 4,
  },
  tipsHeader: {
    color: "#6366F1",
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 10,
  },
  tipText: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },

  // ── Processing ──
  processingContainer: {
    flex: 1,
    backgroundColor: "#101828",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  processingRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#6366F118",
    borderWidth: 2,
    borderColor: "#6366F166",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  processingTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  processingSubtitle: {
    color: "#64748b",
    fontSize: 14,
    marginBottom: 28,
  },
  processingSteps: {
    gap: 12,
    alignSelf: "stretch",
    backgroundColor: "#1a2235",
    borderRadius: 14,
    padding: 18,
  },
  processingStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  processingStepText: {
    color: "#94a3b8",
    fontSize: 14,
  },

  // ── Before/After Preview ──
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  previewCard: {
    flex: 1,
    backgroundColor: "#1a2235",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#334155",
    alignItems: "center",
    paddingBottom: 10,
  },
  previewLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingVertical: 8,
  },
  previewImage: {
    width: "100%",
    height: 130,
  },
  previewSize: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
    marginTop: 8,
  },
  previewArrow: {
    width: 32,
    alignItems: "center",
  },

  // ── Savings Badge ──
  savingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  savingsText: {
    fontWeight: "800",
    fontSize: 14,
  },

  // ── Stats Grid ──
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 50) / 2,
    backgroundColor: "#1a2235",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  statValue: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 4,
  },
  statLabel: {
    color: "#64748b",
    fontSize: 12,
  },

  // ── Re-compress ──
  recompressBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6366F1",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  recompressBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // ── Bottom Actions ──
  bottomActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#1a2235",
    borderWidth: 1,
    borderColor: "#334155",
  },
  resetBtnText: {
    color: "#64748b",
    fontWeight: "700",
    fontSize: 14,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#3B82F6",
  },
  shareBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#6366F1",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },
});

export default ImageCompressorScreen;
