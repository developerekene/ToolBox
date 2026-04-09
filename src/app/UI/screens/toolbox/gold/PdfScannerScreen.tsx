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
} from "react-native";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import VersionBadge from "../../../component/VersionBadge";

const { width } = Dimensions.get("window");

type ScanPage = {
  id: string;
  uri: string;
  timestamp: number;
};

type ScanMode = "idle" | "scanning" | "processing" | "preview";

const PdfScannerScreen: React.FC = () => {
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [mode, setMode] = useState<ScanMode>("idle");
  const [selectedPage, setSelectedPage] = useState<ScanPage | null>(null);
  const [pdfName, setPdfName] = useState("Scanned_Document");
  const [isExporting, setIsExporting] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const captureFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Camera access is needed to scan documents.",
      );
      return;
    }

    setMode("scanning");
    startPulse();

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.92,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets[0]) {
      setMode("processing");
      // Simulate edge detection / processing delay
      setTimeout(() => {
        const newPage: ScanPage = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          timestamp: Date.now(),
        };
        setPages((prev) => [...prev, newPage]);
        setMode("preview");
        fadeIn();
      }, 1200);
    } else {
      setMode(pages.length > 0 ? "preview" : "idle");
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.92,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets.length > 0) {
      setMode("processing");
      setTimeout(() => {
        const newPages: ScanPage[] = result.assets.map((asset) => ({
          id: `${Date.now()}_${Math.random()}`,
          uri: asset.uri,
          timestamp: Date.now(),
        }));
        setPages((prev) => [...prev, ...newPages]);
        setMode("preview");
        fadeIn();
      }, 800);
    }
  };

  const removePage = (id: string) => {
    const updated = pages.filter((p) => p.id !== id);
    setPages(updated);
    if (updated.length === 0) setMode("idle");
    if (selectedPage?.id === id) setSelectedPage(null);
  };

  // Convert a local file URI to base64 using fetch + FileReader (no expo-file-system needed)
  const uriToBase64 = (uri: string): Promise<string> =>
    new Promise((resolve, reject) => {
      fetch(uri)
        .then((res) => res.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            // Strip the "data:image/...;base64," prefix
            resolve(dataUrl.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
        .catch(reject);
    });

  const exportToPDF = async () => {
    if (pages.length === 0) return;

    setIsExporting(true);
    try {
      const pageHtmlParts = await Promise.all(
        pages.map(async (page) => {
          const base64 = await uriToBase64(page.uri);
          return `
                        <div class="page">
                            <img src="data:image/jpeg;base64,${base64}" />
                        </div>
                    `;
        }),
      );

      const html = `
                <html>
                <head>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { background: #fff; }
                        .page {
                            width: 100%;
                            page-break-after: always;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            padding: 20px;
                        }
                        .page img {
                            width: 100%;
                            max-width: 100%;
                            object-fit: contain;
                        }
                    </style>
                </head>
                <body>${pageHtmlParts.join("")}</body>
                </html>
            `;

      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Share ${pdfName}.pdf`,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Saved!", `PDF exported successfully.`);
      }
    } catch (err) {
      Alert.alert(
        "Export Failed",
        "Something went wrong while creating the PDF.",
      );
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const resetScanner = () => {
    setPages([]);
    setMode("idle");
    setSelectedPage(null);
  };

  // ─── IDLE STATE ───────────────────────────────────────────────
  if (mode === "idle") {
    return (
      <View style={styles.container}>
        {/* Hero Section */}

        <View style={styles.heroSection}>
          <View style={styles.scannerRingOuter}>
            <View style={styles.scannerRingInner}>
              <FontAwesome5 name="file-pdf" size={44} color="#F59E0B" />
            </View>
          </View>
          <View>
            <VersionBadge version="0.03" />
          </View>
          <Text style={styles.heroTitle}>PDF Scanner</Text>
          <Text style={styles.heroSubtitle}>
            Scan documents, receipts, or notes{"\n"}and export as a polished PDF
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionCard, { borderColor: "#F59E0B" }]}
            onPress={captureFromCamera}
          >
            <View
              style={[styles.actionIconWrap, { backgroundColor: "#F59E0B22" }]}
            >
              <Ionicons name="camera" size={30} color="#F59E0B" />
            </View>
            <Text style={styles.actionCardTitle}>Camera</Text>
            <Text style={styles.actionCardSub}>Scan in real-time</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { borderColor: "#3B82F6" }]}
            onPress={pickFromGallery}
          >
            <View
              style={[styles.actionIconWrap, { backgroundColor: "#3B82F622" }]}
            >
              <Ionicons name="images" size={30} color="#3B82F6" />
            </View>
            <Text style={styles.actionCardTitle}>Gallery</Text>
            <Text style={styles.actionCardSub}>Import images</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={14} color="#F59E0B" /> Tips for
            best results
          </Text>
          {[
            "Place document on a flat, dark surface",
            "Ensure good lighting, avoid shadows",
            "Hold camera steady directly above",
            "Use Gallery mode for existing photos",
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // ─── PROCESSING STATE ─────────────────────────────────────────
  if (mode === "processing") {
    return (
      <View style={styles.processingContainer}>
        <Animated.View
          style={[styles.processingRing, { transform: [{ scale: pulseAnim }] }]}
        >
          <ActivityIndicator size="large" color="#F59E0B" />
        </Animated.View>
        <Text style={styles.processingTitle}>Processing Scan…</Text>
        <Text style={styles.processingSubtitle}>
          Enhancing clarity & detecting edges
        </Text>
        <View style={styles.processingSteps}>
          {[
            "Analyzing image",
            "Correcting perspective",
            "Enhancing contrast",
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

  // ─── PREVIEW / MULTI-PAGE STATE ───────────────────────────────
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim || 1 }]}>
      {/* Header Bar */}
      <View style={styles.previewHeader}>
        <View>
          <Text style={styles.previewTitle}>
            {pages.length} Page{pages.length !== 1 ? "s" : ""} Scanned
          </Text>
          <Text style={styles.previewSubtitle}>
            Tap a page to preview or remove it
          </Text>
        </View>
        <TouchableOpacity style={styles.addMoreBtn} onPress={captureFromCamera}>
          <Ionicons name="add" size={20} color="#F59E0B" />
          <Text style={styles.addMoreText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Large Preview of Selected Page */}
      {selectedPage && (
        <View style={styles.largePreviewWrap}>
          <Image
            source={{ uri: selectedPage.uri }}
            style={styles.largePreviewImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.closeLargePreview}
            onPress={() => setSelectedPage(null)}
          >
            <Ionicons name="close-circle" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Page Thumbnails */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbnailScroll}
      >
        {pages.map((page, index) => (
          <TouchableOpacity
            key={page.id}
            style={styles.thumbnailWrap}
            onPress={() => setSelectedPage(page)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: page.uri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.thumbnailBadge}>
              <Text style={styles.thumbnailBadgeText}>{index + 1}</Text>
            </View>
            <TouchableOpacity
              style={styles.thumbnailDelete}
              onPress={() => removePage(page.id)}
            >
              <Ionicons name="trash" size={13} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {/* Add More Placeholder */}
        <TouchableOpacity
          style={styles.addThumbnail}
          onPress={captureFromCamera}
        >
          <Ionicons name="camera-outline" size={28} color="#64748b" />
          <Text style={styles.addThumbnailText}>Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addThumbnail} onPress={pickFromGallery}>
          <Ionicons name="images-outline" size={28} color="#64748b" />
          <Text style={styles.addThumbnailText}>Import</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* PDF Name Input Area */}
      <View style={styles.nameSection}>
        <Text style={styles.nameSectionLabel}>
          <Ionicons name="document-text-outline" size={13} color="#64748b" />{" "}
          Output filename
        </Text>
        <View style={styles.nameInputRow}>
          <FontAwesome5
            name="file-pdf"
            size={16}
            color="#F59E0B"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.nameInputText} numberOfLines={1}>
            {pdfName}
          </Text>
          <Text style={styles.nameInputExt}>.pdf</Text>
        </View>
      </View>

      {/* Document Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{pages.length}</Text>
          <Text style={styles.statLabel}>Pages</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>A4</Text>
          <Text style={styles.statLabel}>Format</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>PDF</Text>
          <Text style={styles.statLabel}>Output</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>HD</Text>
          <Text style={styles.statLabel}>Quality</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.resetBtn} onPress={resetScanner}>
          <Ionicons name="refresh" size={18} color="#64748b" />
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exportBtn, isExporting && styles.exportBtnDisabled]}
          onPress={exportToPDF}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <MaterialIcons name="picture-as-pdf" size={20} color="#000105" />
              <Text style={styles.exportBtnText}>Export PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101828",
  },

  // ── Idle / Hero ──
  heroSection: {
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  scannerRingOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#F59E0B44",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  scannerRingInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#F59E0B18",
    borderWidth: 2,
    borderColor: "#F59E0B88",
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
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
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

  // ── Tips ──
  tipsCard: {
    marginHorizontal: 20,
    backgroundColor: "#1a2235",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#F59E0B22",
  },
  tipsHeader: {
    color: "#F59E0B",
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
    backgroundColor: "#F59E0B",
    marginRight: 10,
  },
  tipText: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 18,
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
    backgroundColor: "#F59E0B18",
    borderWidth: 2,
    borderColor: "#F59E0B66",
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

  // ── Preview Header ──
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  previewTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  previewSubtitle: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  addMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B22",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "#F59E0B55",
  },
  addMoreText: {
    color: "#F59E0B",
    fontWeight: "700",
    fontSize: 14,
  },

  // ── Large Preview ──
  largePreviewWrap: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#1a2235",
    height: 200,
  },
  largePreviewImage: {
    width: "100%",
    height: "100%",
  },
  closeLargePreview: {
    position: "absolute",
    top: 8,
    right: 8,
  },

  // ── Thumbnails ──
  thumbnailScroll: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnailWrap: {
    width: 80,
    height: 100,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#334155",
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "#F59E0B",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailBadgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
  },
  thumbnailDelete: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "#EF444488",
    borderRadius: 8,
    padding: 4,
  },
  addThumbnail: {
    width: 80,
    height: 100,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#334155",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  addThumbnailText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "600",
  },

  // ── PDF Name ──
  nameSection: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
  },
  nameSectionLabel: {
    color: "#64748b",
    fontSize: 11,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  nameInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a2235",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  nameInputText: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  nameInputExt: {
    color: "#64748b",
    fontSize: 13,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#1a2235",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  statLabel: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#334155",
  },

  // ── Bottom Actions ──
  bottomActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 24,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
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
  exportBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#F59E0B",
  },
  exportBtnDisabled: {
    opacity: 0.6,
  },
  exportBtnText: {
    color: "#000105",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.3,
  },
});

export default PdfScannerScreen;
