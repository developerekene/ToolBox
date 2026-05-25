/**
 * Background Remover App - React Native (TypeScript)
 *
 * Setup Instructions:
 * 1. npx react-native init BackgroundRemover --template react-native-template-typescript
 * 2. npm install @react-native-community/image-picker react-native-reanimated react-native-gesture-handler
 * 3. For background removal API: sign up at remove.bg (https://www.remove.bg/api)
 *    and replace REMOVE_BG_API_KEY with your key.
 * 4. Replace this file with App.tsx or import as a screen.
 *
 * ─── PERMISSION SETUP (REQUIRED) ────────────────────────────────────────────
 *
 * Android — android/app/src/main/AndroidManifest.xml
 * Add these inside <manifest> before <application>:
 *
 *   <!-- Storage: Android ≤ 12 -->
 *   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
 *       android:maxSdkVersion="32" />
 *   <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
 *       android:maxSdkVersion="28" />
 *   <!-- Storage: Android 13+ -->
 *   <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
 *   <!-- Camera -->
 *   <uses-permission android:name="android.permission.CAMERA" />
 *
 * iOS — ios/<AppName>/Info.plist
 * Add these inside <dict>:
 *
 *   <key>NSCameraUsageDescription</key>
 *   <string>Used to take a photo for background removal</string>
 *   <key>NSPhotoLibraryUsageDescription</key>
 *   <string>Used to pick a photo for background removal</string>
 *
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Dependencies:
 *   - react-native-image-picker: ^7.x
 *   - react-native-reanimated: ^3.x
 *   - react-native-gesture-handler: ^2.x
 *   - react-native-share (optional, for sharing)
 */

import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
  Easing,
  SafeAreaView,
  PermissionsAndroid,
} from "react-native";
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  Asset,
} from "react-native-image-picker";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const REMOVE_BG_API_KEY = "YOUR_REMOVE_BG_API_KEY"; // Replace with your key
const REMOVE_BG_URL = "https://api.remove.bg/v1.0/removebg";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TabType = "original" | "result";
type ImageSource = "camera" | "library";

interface BackgroundPreset {
  id: string;
  label: string;
  color: string | null;
  icon: string;
}

// Background presets for replaced backgrounds
const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: "transparent", label: "Transparent", color: null, icon: "⬜" },
  { id: "white", label: "White", color: "#FFFFFF", icon: "○" },
  { id: "black", label: "Black", color: "#000000", icon: "●" },
  { id: "blur", label: "Blur", color: "#E0E7FF", icon: "◉" },
  { id: "gradient1", label: "Sunset", color: "#FF6B6B", icon: "🌅" },
  { id: "gradient2", label: "Ocean", color: "#4ECDC4", icon: "🌊" },
  { id: "gradient3", label: "Forest", color: "#45B7D1", icon: "🌿" },
  { id: "gradient4", label: "Purple", color: "#A855F7", icon: "💜" },
];

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1: Move requestAndroidPermissions OUTSIDE the component.
//
// Keeping it inside the component caused a stale-closure bug: the function
// captured the initial render's scope and was never refreshed inside
// pickImage's useCallback, so the permission set could be wrong.
// Moving it out eliminates the need to list it as a dependency entirely.
//
// FIX 2: Use a string-literal for READ_MEDIA_IMAGES.
//
// Older React Native TypeScript definitions don't include
// PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES (added in Android 13 /
// API 33). Using the raw string literal with `as any` avoids a compile error
// while still requesting the correct permission at runtime.
//
// FIX 3: Only request CAMERA when source === 'camera'.
//
// Always requesting CAMERA for a gallery flow confused the OS dialog and
// could cause unnecessary denials. The permission set now exactly matches
// the requested operation.
// ─────────────────────────────────────────────────────────────────────────────
async function requestAndroidPermissions(
  source: ImageSource,
): Promise<boolean> {
  if (Platform.OS !== "android") return true;

  try {
    const sdkVersion =
      typeof Platform.Version === "number"
        ? Platform.Version
        : parseInt(Platform.Version as string, 10);

    // Android 13+ (API 33) replaced READ_EXTERNAL_STORAGE with
    // READ_MEDIA_IMAGES for image-only access. We use the raw string
    // literal so older RN TS types don't throw a compile error.
    const storagePermission =
      sdkVersion >= 33
        ? ("android.permission.READ_MEDIA_IMAGES" as any)
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

    const permissionsToRequest: string[] = [storagePermission];

    // Only add CAMERA when the user actually wants to use the camera.
    if (source === "camera") {
      permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.CAMERA);
    }

    const granted = await PermissionsAndroid.requestMultiple(
      permissionsToRequest as Parameters<
        typeof PermissionsAndroid.requestMultiple
      >[0],
    );

    return Object.values(granted).every(
      (status) => status === PermissionsAndroid.RESULTS.GRANTED,
    );
  } catch {
    return false;
  }
}

export default function BackgroundRemover(): React.JSX.Element {
  const [originalImage, setOriginalImage] = useState<Asset | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedBg, setSelectedBg] = useState<string>("transparent");
  const [activeTab, setActiveTab] = useState<TabType>("original");
  const [progress, setProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── Pulse animation while processing ──
  const startPulse = useCallback((): void => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  const stopPulse = useCallback((): void => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  // ── Progress bar animation ──
  const animateProgress = useCallback(
    (toValue: number): void => {
      Animated.timing(progressAnim, {
        toValue,
        duration: 400,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }).start();
    },
    [progressAnim],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 4: pickImage — correct options, proper error handling, iOS-safe.
  //
  // Changes from the original:
  //   a) quality set to 1 (integer) — react-native-image-picker v5+ requires
  //      an exact step value (0 | 0.1 | … | 1.0); 0.9 caused silent failures
  //      on some Android builds.
  //   b) Added saveToPhotos: false — prevents an iOS crash when the camera is
  //      launched without the Photos write permission, because the app wasn't
  //      requesting it and didn't need it.
  //   c) Added cameraType: "back" — required by some iOS versions when
  //      launchCamera is called; omitting it could throw an unhandled error.
  //   d) Wrapped the launcher call in try/catch — on some Android versions
  //      the launcher throws instead of returning an errorCode.
  //   e) Explicit errorCode check with Alert — surfaces the real error message
  //      to the user instead of silently returning.
  //   f) Added asset?.uri guard — protects against malformed responses where
  //      assets[0] exists but uri is undefined.
  //   g) requestAndroidPermissions is now a module-level function (see FIX 1),
  //      so it no longer needs to be in the useCallback dependency array.
  // ─────────────────────────────────────────────────────────────────────────
  const pickImage = useCallback(
    async (source: ImageSource = "library"): Promise<void> => {
      const hasPermission = await requestAndroidPermissions(source);
      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          source === "camera"
            ? "Please grant camera and storage permissions to take a photo."
            : "Please grant photo library access to pick an image.",
        );
        return;
      }

      const options = {
        mediaType: "photo" as const,
        quality: 1 as const, // FIX: must be an exact step: 0 | 0.1 | … | 1
        maxWidth: 2048,
        maxHeight: 2048,
        includeBase64: true,
        saveToPhotos: false, // FIX: prevents iOS crash (no write permission needed)
        cameraType: "back" as const, // FIX: required on some iOS versions
      };

      try {
        const launcher =
          source === "camera" ? launchCamera : launchImageLibrary;
        const result: ImagePickerResponse = await launcher(options);

        // FIX: surface real error message instead of silently returning
        if (result.errorCode) {
          Alert.alert(
            "Image Picker Error",
            result.errorMessage ?? "Could not open image picker.",
          );
          return;
        }

        if (result.didCancel) return;

        const asset: Asset | undefined = result.assets?.[0];

        // FIX: guard against missing uri in addition to missing asset
        if (!asset?.uri) return;

        setOriginalImage(asset);
        setProcessedImage(null);
        setActiveTab("original");
        setErrorMsg(null);

        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      } catch (err) {
        // FIX: launcher can throw on some Android versions instead of returning errorCode
        Alert.alert(
          "Image Picker Error",
          err instanceof Error ? err.message : "Failed to open image picker.",
        );
      }
    },
    // requestAndroidPermissions is module-level now — no longer a dep
    [fadeAnim],
  );

  // ── Source picker sheet ──
  const showSourcePicker = (): void => {
    Alert.alert("Select Image Source", "", [
      { text: "📷  Camera", onPress: () => pickImage("camera") },
      { text: "🖼   Photo Library", onPress: () => pickImage("library") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // ── Background removal via remove.bg API ──
  const removeBackground = useCallback(async (): Promise<void> => {
    if (!originalImage?.base64) return;

    setIsProcessing(true);
    setProgress(0);
    animateProgress(0);
    startPulse();
    setErrorMsg(null);

    try {
      // Simulate progress stages
      const stages: number[] = [20, 45, 70, 90];
      for (const pct of stages) {
        await new Promise<void>((r) => setTimeout(r, 600));
        setProgress(pct);
        animateProgress(pct);
      }

      const formData = new FormData();
      formData.append("image_file_b64", originalImage.base64);
      formData.append("size", "auto");
      formData.append("format", "png");

      const response = await fetch(REMOVE_BG_URL, {
        method: "POST",
        headers: {
          "X-Api-Key": REMOVE_BG_API_KEY,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => ({}))) as {
          errors?: Array<{ title?: string }>;
        };
        throw new Error(
          err?.errors?.[0]?.title ?? `API error ${response.status}`,
        );
      }

      // Convert response blob to base64
      const blob = await response.blob();
      const base64Data = await blobToBase64(blob);

      setProgress(100);
      animateProgress(100);

      await new Promise<void>((r) => setTimeout(r, 300));

      setProcessedImage(`data:image/png;base64,${base64Data}`);
      setActiveTab("result");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to remove background. Please try again.";
      setErrorMsg(message);
      Alert.alert("Processing Failed", message);
    } finally {
      stopPulse();
      setIsProcessing(false);
    }
  }, [originalImage, animateProgress, startPulse, stopPulse]);

  // ── Blob → Base64 helper ──
  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result.split(",")[1]);
        } else {
          reject(new Error("FileReader result is not a string"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  // ── Reset state ──
  const resetAll = (): void => {
    setOriginalImage(null);
    setProcessedImage(null);
    setActiveTab("original");
    setErrorMsg(null);
    setProgress(0);
    progressAnim.setValue(0);
  };

  // ── Save to gallery (requires react-native-cameraroll or expo-media-library) ──
  const saveImage = async (): Promise<void> => {
    if (!processedImage) return;
    Alert.alert(
      "Save Image",
      "Install react-native-cameraroll or expo-media-library to enable saving.\n\nnpm install @react-native-camera-roll/camera-roll",
      [{ text: "OK" }],
    );
  };

  // ── Computed background color for result preview ──
  const resultBgColor: string = (() => {
    const preset = BACKGROUND_PRESETS.find((p) => p.id === selectedBg);
    if (!preset?.color) return "transparent";
    return preset.color;
  })();

  // ── Progress bar width ──
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoMark} />
          <Text style={styles.headerTitle}>BgEraser</Text>
        </View>
        {originalImage && (
          <TouchableOpacity style={styles.resetBtn} onPress={resetAll}>
            <Text style={styles.resetBtnText}>✕ New</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Empty State ── */}
        {!originalImage && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIllustration}>
              <View style={styles.emptyCircle1} />
              <View style={styles.emptyCircle2} />
              <Text style={styles.emptyIcon}>✂️</Text>
            </View>
            <Text style={styles.emptyTitle}>Remove Any Background</Text>
            <Text style={styles.emptySubtitle}>
              AI-powered background removal in seconds.{"\n"}
              Upload a photo to get started.
            </Text>

            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={showSourcePicker}
            >
              <Text style={styles.uploadBtnIcon}>＋</Text>
              <Text style={styles.uploadBtnText}>Upload Image</Text>
            </TouchableOpacity>

            <View style={styles.featurePills}>
              {["⚡ Instant", "🎯 Precise", "🆓 Free to Try"].map((f) => (
                <View key={f} style={styles.featurePill}>
                  <Text style={styles.featurePillText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Image Preview Area ── */}
        {originalImage && (
          <Animated.View style={[styles.previewSection, { opacity: fadeAnim }]}>
            {/* Tab Switcher */}
            <View style={styles.tabBar}>
              {(["original", "result"] as TabType[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => processedImage && setActiveTab(tab)}
                  disabled={tab === "result" && !processedImage}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab && styles.tabTextActive,
                    ]}
                  >
                    {tab === "original" ? "Original" : "Removed BG"}
                  </Text>
                  {tab === "result" && processedImage && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Image Canvas */}
            <Animated.View
              style={[
                styles.imageCanvas,
                activeTab === "result" && { backgroundColor: resultBgColor },
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              {/* Checkerboard for transparency hint */}
              {activeTab === "result" && selectedBg === "transparent" && (
                <View style={styles.checkerOverlay} pointerEvents="none" />
              )}

              <Image
                source={{
                  uri:
                    activeTab === "result" && processedImage
                      ? processedImage
                      : originalImage.uri,
                }}
                style={styles.previewImage}
                resizeMode="contain"
              />

              {/* Processing Overlay */}
              {isProcessing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color={COLORS.accent} />
                  <Text style={styles.processingLabel}>
                    Removing background…
                  </Text>
                  <View style={styles.progressBarTrack}>
                    <Animated.View
                      style={[styles.progressBarFill, { width: progressWidth }]}
                    />
                  </View>
                  <Text style={styles.progressPct}>
                    {Math.round(progress)}%
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* Error message */}
            {errorMsg && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠ {errorMsg}</Text>
              </View>
            )}

            {/* ── Background Presets (shown when result tab active) ── */}
            {activeTab === "result" && processedImage && (
              <View style={styles.bgSection}>
                <Text style={styles.bgSectionLabel}>Background</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.bgScroll}
                  contentContainerStyle={styles.bgScrollContent}
                >
                  {BACKGROUND_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.id}
                      style={[
                        styles.bgChip,
                        selectedBg === preset.id && styles.bgChipSelected,
                        preset.color != null && {
                          backgroundColor: preset.color + "22",
                        },
                      ]}
                      onPress={() => setSelectedBg(preset.id)}
                    >
                      <Text style={styles.bgChipIcon}>{preset.icon}</Text>
                      <Text
                        style={[
                          styles.bgChipLabel,
                          selectedBg === preset.id &&
                            styles.bgChipLabelSelected,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── Action Buttons ── */}
            <View style={styles.actionRow}>
              {!processedImage ? (
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    isProcessing && styles.primaryBtnDisabled,
                  ]}
                  onPress={removeBackground}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      ✂ Remove Background
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={showSourcePicker}
                  >
                    <Text style={styles.secondaryBtnText}>↩ New Image</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={saveImage}
                  >
                    <Text style={styles.primaryBtnText}>↓ Save PNG</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>
        )}

        {/* ── Bottom padding ── */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── THEME ────────────────────────────────────────────────────────────────────
const COLORS = {
  bg: "#0D0D14",
  surface: "#16161F",
  surfaceAlt: "#1E1E2E",
  border: "#2A2A3D",
  accent: "#7C3AED",
  accentLight: "#A855F7",
  accentGlow: "rgba(124,58,237,0.25)",
  text: "#F0EFFF",
  textMuted: "#8B8AA8",
  success: "#10B981",
  error: "#EF4444",
} as const;

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  resetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resetBtnText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingTop: SCREEN_HEIGHT * 0.08,
    paddingBottom: 40,
  },
  emptyIllustration: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    position: "relative",
  },
  emptyCircle1: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.accentGlow,
    borderWidth: 1,
    borderColor: COLORS.accent + "40",
  },
  emptyCircle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.accent + "15",
    borderWidth: 1,
    borderColor: COLORS.accent + "30",
  },
  emptyIcon: {
    fontSize: 52,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
  },
  uploadBtnIcon: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "300",
  },
  uploadBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
  featurePills: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  featurePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featurePillText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "500",
  },

  // Preview Section
  previewSection: {
    paddingTop: 24,
  },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: "#fff",
  },
  tabBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "700",
  },

  // Image Canvas
  imageCanvas: {
    width: "100%",
    height: SCREEN_WIDTH * 0.8,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
  },
  checkerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1a1a2e",
    opacity: 0.5,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13,13,20,0.85)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  processingLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
  },
  progressBarTrack: {
    width: "70%",
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  progressPct: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },

  // Error
  errorBanner: {
    backgroundColor: COLORS.error + "20",
    borderWidth: 1,
    borderColor: COLORS.error + "40",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: "500",
  },

  // Background Presets
  bgSection: { marginBottom: 20 },
  bgSectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  bgScroll: { marginHorizontal: -4 },
  bgScrollContent: { paddingHorizontal: 4, gap: 8 },
  bgChip: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
    minWidth: 72,
  },
  bgChipSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
  },
  bgChipIcon: { fontSize: 20 },
  bgChipLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  bgChipLabelSelected: {
    color: COLORS.accentLight,
  },

  // Action Buttons
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnDisabled: {
    backgroundColor: COLORS.accent + "80",
    shadowOpacity: 0.1,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
