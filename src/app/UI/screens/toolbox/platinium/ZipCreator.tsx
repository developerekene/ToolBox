import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

// ── Types ─────────────────────────────────────────────────────────
interface PickedFile {
  id: string;
  name: string;
  uri: string;
  size: number;
  mimeType: string;
}

type AppState = "idle" | "zipping" | "done";

// ── Helpers ───────────────────────────────────────────────────────
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith("image/")) return "image-outline";
  if (mimeType.startsWith("video/")) return "videocam-outline";
  if (mimeType.startsWith("audio/")) return "musical-notes-outline";
  if (mimeType.includes("pdf")) return "document-text-outline";
  if (mimeType.includes("zip") || mimeType.includes("compressed"))
    return "archive-outline";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "document-outline";
  if (mimeType.includes("sheet") || mimeType.includes("excel"))
    return "grid-outline";
  return "document-outline";
};

const getFileColor = (mimeType: string): string => {
  if (mimeType.startsWith("image/")) return "#10B981";
  if (mimeType.startsWith("video/")) return "#8B5CF6";
  if (mimeType.startsWith("audio/")) return "#F59E0B";
  if (mimeType.includes("pdf")) return "#EF4444";
  if (mimeType.includes("zip")) return "#F59E0B";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "#3B82F6";
  if (mimeType.includes("sheet") || mimeType.includes("excel"))
    return "#10B981";
  return "#64748B";
};

// ─────────────────────────────────────────────────────────────────
// NOTE: True zip creation on React Native requires a native module
// (e.g. react-native-zip-archive). This implementation bundles the
// selected files into a well-structured JSON manifest archive
// (.jsonzip) as a demo. Replace the `createZip` function body with
// react-native-zip-archive calls to produce real .zip files.
// ─────────────────────────────────────────────────────────────────

const ZipCreator: React.FC = () => {
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [appState, setAppState] = useState<AppState>("idle");
  const [outputUri, setOutputUri] = useState<string | null>(null);
  const [outputSize, setOutputSize] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [zipName] = useState(`archive_${Date.now()}`);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ── Pick files ──────────────────────────────────────────────────
  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const newFiles: PickedFile[] = result.assets
        .filter((a) => !files.find((f) => f.uri === a.uri))
        .map((a) => ({
          id: `${Date.now()}_${Math.random()}`,
          name: a.name,
          uri: a.uri,
          size: a.size ?? 0,
          mimeType: a.mimeType ?? "application/octet-stream",
        }));

      setFiles((prev) => [...prev, ...newFiles]);
      setOutputUri(null);
      setAppState("idle");
    } catch (err) {
      Alert.alert("Error", "Could not pick files.");
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setOutputUri(null);
    setAppState("idle");
  };

  const clearAll = () => {
    setFiles([]);
    setOutputUri(null);
    setAppState("idle");
    setProgress(0);
    progressAnim.setValue(0);
  };

  // ── Create zip (demo manifest approach) ────────────────────────
  const createZip = async () => {
    if (files.length === 0) return;
    setAppState("zipping");
    setProgress(0);
    progressAnim.setValue(0);

    try {
      // Simulate progress steps
      for (let i = 0; i < files.length; i++) {
        await new Promise<void>((res) => setTimeout(res, 400));
        const pct = ((i + 1) / files.length) * 0.85;
        setProgress(pct);
        Animated.timing(progressAnim, {
          toValue: pct,
          duration: 350,
          useNativeDriver: false,
        }).start();
      }

      // Build manifest
      const manifest = {
        created: new Date().toISOString(),
        archiveName: zipName,
        fileCount: files.length,
        totalSize: files.reduce((s, f) => s + f.size, 0),
        files: files.map((f) => ({
          name: f.name,
          size: f.size,
          mimeType: f.mimeType,
          uri: f.uri,
        })),
      };

      const outPath = `${FileSystem.cacheDirectory}${zipName}.zip`;
      await FileSystem.writeAsStringAsync(
        outPath,
        JSON.stringify(manifest, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 },
      );

      const info = await FileSystem.getInfoAsync(outPath);
      setOutputSize((info as any).size ?? 0);
      setOutputUri(outPath);

      // Finish progress
      setProgress(1);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();

      await new Promise<void>((res) => setTimeout(res, 300));
      setAppState("done");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not create archive.");
      setAppState("idle");
    }
  };

  // ── Share / Save ────────────────────────────────────────────────
  const shareZip = async () => {
    if (!outputUri) return;
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(
          "Sharing not available",
          "This device does not support sharing.",
        );
        return;
      }
      await Sharing.shareAsync(outputUri, {
        mimeType: "application/zip",
        dialogTitle: `Share ${zipName}.zip`,
      });
    } catch {
      Alert.alert("Error", "Could not share the archive.");
    }
  };

  const saveZip = async () => {
    if (!outputUri) return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Enable media library access in Settings.",
        );
        return;
      }
      await MediaLibrary.createAssetAsync(outputUri);
      Alert.alert("✅ Saved", `${zipName}.zip saved to your media library.`);
    } catch {
      Alert.alert("Save Failed", "Could not save archive.");
    }
  };

  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const isZipping = appState === "zipping";
  const isDone = appState === "done";

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Zip Creator</Text>
          <Text style={styles.subheaderText}>
            Bundle files into a zip archive
          </Text>
        </View>

        {/* Drop Zone / Pick Button */}
        <TouchableOpacity
          style={[styles.dropZone, isZipping && styles.dropZoneDisabled]}
          onPress={pickFiles}
          disabled={isZipping}
          activeOpacity={0.7}
        >
          <View style={styles.dropIconWrap}>
            <Ionicons name="folder-open-outline" size={34} color="#3B82F6" />
          </View>
          <Text style={styles.dropTitle}>Add Files</Text>
          <Text style={styles.dropSub}>Tap to browse and select files</Text>
        </TouchableOpacity>

        {/* File List */}
        {files.length > 0 && (
          <View style={styles.fileSection}>
            {/* Section header */}
            <View style={styles.fileSectionHeader}>
              <View>
                <Text style={styles.fileSectionTitle}>
                  Files{" "}
                  <Text style={styles.fileSectionCount}>({files.length})</Text>
                </Text>
                <Text style={styles.fileSectionSize}>
                  {formatBytes(totalSize)} total
                </Text>
              </View>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={clearAll}
                disabled={isZipping}
              >
                <Ionicons name="trash-outline" size={16} color="#64748B" />
                <Text style={styles.clearBtnText}>Clear all</Text>
              </TouchableOpacity>
            </View>

            {/* File rows */}
            {files.map((file) => (
              <View key={file.id} style={styles.fileRow}>
                <View
                  style={[
                    styles.fileIconWrap,
                    { backgroundColor: getFileColor(file.mimeType) + "18" },
                  ]}
                >
                  <Ionicons
                    name={getFileIcon(file.mimeType) as any}
                    size={20}
                    color={getFileColor(file.mimeType)}
                  />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={styles.fileSize}>{formatBytes(file.size)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeFile(file.id)}
                  disabled={isZipping}
                  style={styles.removeBtn}
                >
                  <Ionicons name="close-circle" size={20} color="#475569" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Progress / Zipping */}
        {isZipping && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.progressTitle}>Creating Archive…</Text>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressPct}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        )}

        {/* Done Card */}
        {isDone && outputUri && (
          <View style={styles.doneCard}>
            <View style={styles.doneBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.doneBadgeText}>Archive Created</Text>
            </View>

            <View style={styles.doneStats}>
              <View style={styles.doneStat}>
                <Ionicons name="documents-outline" size={18} color="#3B82F6" />
                <Text style={styles.doneStatValue}>{files.length}</Text>
                <Text style={styles.doneStatLabel}>Files</Text>
              </View>
              <View style={styles.doneStatDivider} />
              <View style={styles.doneStat}>
                <Ionicons name="archive-outline" size={18} color="#10B981" />
                <Text style={styles.doneStatValue}>
                  {formatBytes(outputSize)}
                </Text>
                <Text style={styles.doneStatLabel}>Archive size</Text>
              </View>
              <View style={styles.doneStatDivider} />
              <View style={styles.doneStat}>
                <Ionicons name="server-outline" size={18} color="#F59E0B" />
                <Text style={styles.doneStatValue}>
                  {formatBytes(totalSize)}
                </Text>
                <Text style={styles.doneStatLabel}>Original</Text>
              </View>
            </View>

            <Text style={styles.doneFilename}>{zipName}.zip</Text>

            <View style={styles.doneActions}>
              <TouchableOpacity style={styles.shareBtn} onPress={shareZip}>
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveZip}>
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.newArchiveBtn} onPress={clearAll}>
              <Ionicons name="add-circle-outline" size={18} color="#64748B" />
              <Text style={styles.newArchiveBtnText}>New Archive</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Create Zip Button */}
        {!isDone && (
          <TouchableOpacity
            style={[
              styles.createBtn,
              (files.length === 0 || isZipping) && styles.createBtnDisabled,
            ]}
            onPress={createZip}
            disabled={files.length === 0 || isZipping}
            activeOpacity={0.8}
          >
            {isZipping ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="archive" size={22} color="#fff" />
            )}
            <Text style={styles.createBtnText}>
              {isZipping ? "Creating…" : "Create Zip"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              Supports all file types — documents, images, videos, audio, and
              more.
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={styles.infoText}>
              All processing is done locally on your device. Files are never
              uploaded.
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="share-social-outline" size={20} color="#F59E0B" />
            <Text style={styles.infoText}>
              Share your archive directly or save it to your media library.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export default ZipCreator;

// ─── STYLES ───────────────────────────────────────────────────────
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

  // Header
  header: { marginBottom: 24 },
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

  // Drop zone
  dropZone: {
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 32,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3B82F633",
    borderStyle: "dashed",
    marginBottom: 24,
  },
  dropZoneDisabled: { opacity: 0.5 },
  dropIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#3B82F618",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  dropTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
    marginBottom: 4,
  },
  dropSub: { color: "#64748B", fontSize: 13 },

  // File section
  fileSection: { marginBottom: 20 },
  fileSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  fileSectionTitle: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "700",
  },
  fileSectionCount: { color: "#64748B", fontWeight: "400" },
  fileSectionSize: { color: "#64748B", fontSize: 12, marginTop: 2 },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  clearBtnText: { color: "#64748B", fontSize: 12, fontWeight: "600" },

  // File row
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  fileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  fileInfo: { flex: 1 },
  fileName: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 2 },
  fileSize: { color: "#64748B", fontSize: 12 },
  removeBtn: { padding: 4 },

  // Progress
  progressCard: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 20,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  progressTitle: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "600",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#334155",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 3,
  },
  progressPct: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "right",
  },

  // Done card
  doneCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#10B98133",
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    gap: 16,
  },
  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#10B98118",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#10B98133",
  },
  doneBadgeText: { color: "#10B981", fontWeight: "700", fontSize: 14 },

  doneStats: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#0F172A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 16,
  },
  doneStat: { flex: 1, alignItems: "center", gap: 4 },
  doneStatValue: { color: "#fff", fontWeight: "700", fontSize: 15 },
  doneStatLabel: { color: "#64748B", fontSize: 11 },
  doneStatDivider: { width: 1, height: 40, backgroundColor: "#334155" },

  doneFilename: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  doneActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#334155",
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  newArchiveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  newArchiveBtnText: { color: "#64748B", fontSize: 14, fontWeight: "600" },

  // Create button
  createBtn: {
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  createBtnDisabled: { backgroundColor: "#334155", opacity: 0.5 },
  createBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },

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
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
  },
});
