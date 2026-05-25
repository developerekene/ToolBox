// PdfEditor.tsx - TypeScript errors fixed
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";

const { width, height } = Dimensions.get("window");

// ---------------------------------------------------------------------------
// expo-file-system compatibility shim
// ---------------------------------------------------------------------------
// expo-file-system changed its public surface across SDK versions.
// On some SDK versions (≥ 51 with the "next" build) the top-level namespace
// no longer re-exports `documentDirectory` or `writeAsStringAsync` directly,
// causing TS error TS2339.  We cast to `any` once here and re-export typed
// helpers so the rest of the file stays fully typed.
// ---------------------------------------------------------------------------
const _fs = FileSystem as any; // eslint-disable-line @typescript-eslint/no-explicit-any

const documentDirectory: string =
  _fs.documentDirectory ??
  _fs.FileSystem?.documentDirectory ??
  _fs.default?.documentDirectory ??
  "";

const writeAsStringAsync = (
  fileUri: string,
  contents: string,
  options?: object,
): Promise<void> => {
  const fn: Function =
    _fs.writeAsStringAsync ??
    _fs.FileSystem?.writeAsStringAsync ??
    _fs.default?.writeAsStringAsync;
  if (!fn) throw new Error("expo-file-system: writeAsStringAsync not found");
  return fn(fileUri, contents, options);
};

// Types
interface Annotation {
  id: string;
  type: "text" | "draw" | "highlight";
  page: number;
  content?: string;
  points?: { x: number; y: number }[];
  color: string;
  position?: { x: number; y: number };
}

interface PDFFile {
  uri: string;
  name: string;
  size: number;
  pages?: number;
}

const PdfEditor: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<PDFFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [annotationText, setAnnotationText] = useState("");
  const [selectedColor, setSelectedColor] = useState("#FF6B6B");
  const [toolMode, setToolMode] = useState<"view" | "annotate" | "draw">(
    "view",
  );
  // FIX 1: removed unused isDrawing / drawingPoints state that caused
  // "declared but never read" TypeScript errors.
  const [zoomLevel, setZoomLevel] = useState(1);

  // FIX 2: Modal-based "new document name" flow replaces the Alert.alert
  // approach whose onPress callback does NOT receive a string argument on
  // Android (only Alert.prompt on iOS does), making `fileName?: string`
  // a type error in cross-platform code.
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocName, setNewDocName] = useState("");

  const scrollViewRef = useRef<ScrollView>(null);

  const colors: string[] = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#FFB347",
    "#779ECB",
    "#FF6B6B",
    "#98D8C8",
  ];

  // Import PDF from device
  const importPDF = async () => {
    try {
      // FIX 3: expo-document-picker v11+ returns a discriminated union where
      // the success branch no longer has a `type` field; instead `canceled`
      // is a boolean on the top-level result.
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      // `result.assets` is the new API (array of picked assets).
      const asset = result.assets[0];
      if (!asset) return;

      setIsLoading(true);

      const pdfInfo: PDFFile = {
        uri: asset.uri,
        name: asset.name ?? "document.pdf",
        size: asset.size ?? 0,
      };

      setPdfFile(pdfInfo);

      setTimeout(() => {
        setTotalPages(Math.floor(Math.random() * 20) + 5);
        setIsLoading(false);
        Toast.show({
          type: "success",
          text1: "PDF Loaded",
          text2: `${asset.name} loaded successfully`,
        });
      }, 1000);
    } catch (error) {
      console.error("Error importing PDF:", error);
      Toast.show({
        type: "error",
        text1: "Import Failed",
        text2: "Could not load PDF file",
      });
      setIsLoading(false);
    }
  };

  // Create new blank PDF — opens a modal to collect the name
  const createNewPDF = () => {
    setNewDocName("");
    setShowNewDocModal(true);
  };

  // Called when the user confirms the name in the modal
  const handleCreatePDF = async () => {
    const fileName = newDocName.trim();
    if (!fileName) {
      Alert.alert("Error", "Please enter a document name.");
      return;
    }
    setShowNewDocModal(false);
    setIsLoading(true);

    const fileUri = `${documentDirectory}${fileName}.pdf`;

    const blankPDFContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj
4 0 obj
<<
/Length 88
>>
stream
BT
/F1 24 Tf
100 700 Td
(New Document Created) Tj
ET
endstream
endobj
5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000234 00000 n
0000000381 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
448
%%EOF`;

    try {
      await writeAsStringAsync(fileUri, blankPDFContent);
      setPdfFile({
        uri: fileUri,
        name: `${fileName}.pdf`,
        size: blankPDFContent.length,
      });
      setTotalPages(1);
      Toast.show({
        type: "success",
        text1: "Created",
        text2: "New PDF document created",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not create PDF",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add text annotation
  const addTextAnnotation = () => {
    if (!annotationText.trim()) {
      Alert.alert("Error", "Please enter annotation text");
      return;
    }

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: "text",
      page: currentPage,
      content: annotationText,
      color: selectedColor,
      position: { x: 100, y: 100 + annotations.length * 30 },
    };

    setAnnotations([...annotations, newAnnotation]);
    setAnnotationText("");
    setShowAnnotationModal(false);

    Toast.show({
      type: "success",
      text1: "Annotation Added",
      text2: "Text annotation added to page",
    });
  };

  // Add highlight annotation
  const addHighlight = () => {
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: "highlight",
      page: currentPage,
      color: selectedColor,
      position: { x: 50, y: 200 + annotations.length * 40 },
    };

    setAnnotations([...annotations, newAnnotation]);

    Toast.show({
      type: "success",
      text1: "Highlight Added",
      text2: "Highlight added to page",
    });
  };

  // Delete annotation
  const deleteAnnotation = (id: string) => {
    Alert.alert(
      "Delete Annotation",
      "Are you sure you want to delete this annotation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setAnnotations(annotations.filter((ann) => ann.id !== id));
            Toast.show({
              type: "success",
              text1: "Deleted",
              text2: "Annotation removed",
            });
          },
        },
      ],
    );
  };

  // Export PDF with annotations
  const exportPDF = async () => {
    if (!pdfFile) return;

    setIsLoading(true);
    try {
      const annotationsPath = `${documentDirectory}${pdfFile.name.replace(".pdf", "_annotations.json")}`;
      await writeAsStringAsync(
        annotationsPath,
        JSON.stringify(annotations, null, 2),
      );

      Toast.show({
        type: "success",
        text1: "Exported",
        text2: "PDF saved with annotations",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Export Failed",
        text2: "Could not export PDF",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Share PDF
  const sharePDF = async () => {
    if (!pdfFile) return;

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(pdfFile.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share PDF",
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Share Failed",
        text2: "Could not share PDF",
      });
    }
  };

  // Clear all annotations
  const clearAllAnnotations = () => {
    Alert.alert(
      "Clear All Annotations",
      "Are you sure you want to remove all annotations?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            setAnnotations([]);
            Toast.show({
              type: "success",
              text1: "Cleared",
              text2: "All annotations removed",
            });
          },
        },
      ],
    );
  };

  // Zoom controls
  const zoomIn = () => setZoomLevel(Math.min(zoomLevel + 0.2, 3));
  const zoomOut = () => setZoomLevel(Math.max(zoomLevel - 0.2, 0.5));

  // Navigation
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // Render PDF content preview
  const renderPDFContent = () => {
    if (!pdfFile) {
      return (
        <View style={styles.emptyState}>
          <FontAwesome5 name="file-pdf" size={80} color="#666" />
          <Text style={styles.emptyStateTitle}>No PDF Loaded</Text>
          <Text style={styles.emptyStateText}>
            Import a PDF file or create a new one to start editing
          </Text>
          <View style={styles.emptyStateButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.importBtn]}
              onPress={importPDF}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Import PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.createBtn]}
              onPress={createNewPDF}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Create New</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <ScrollView
        ref={scrollViewRef}
        style={styles.pdfContainer}
        showsVerticalScrollIndicator={true}
        pinchGestureEnabled={true}
      >
        <View
          style={[styles.pageContainer, { transform: [{ scale: zoomLevel }] }]}
        >
          <View style={styles.pdfPage}>
            <Text style={styles.pdfPageNumber}>Page {currentPage}</Text>
            <View style={styles.pdfContent}>
              <Text style={styles.placeholderText}>
                PDF Content Preview{"\n"}
                This is a placeholder for the actual PDF rendering.
              </Text>
              <Text style={styles.placeholderText}>
                File: {pdfFile.name}
                {"\n"}
                Size: {(pdfFile.size / 1024).toFixed(2)} KB
              </Text>
            </View>

            {/* Render annotations */}
            {annotations
              .filter((ann) => ann.page === currentPage)
              .map((annotation) => (
                <View key={annotation.id} style={styles.annotationContainer}>
                  {annotation.type === "text" && (
                    <View
                      style={[
                        styles.textAnnotation,
                        { backgroundColor: annotation.color + "20" },
                      ]}
                    >
                      {/* FIX 4: annotationColorBar height was "100%" which is
                          invalid in RN StyleSheet for non-absolutely-positioned
                          children with unknown parent height. Use alignSelf
                          "stretch" instead so it fills the flex row correctly. */}
                      <View
                        style={[
                          styles.annotationColorBar,
                          { backgroundColor: annotation.color },
                        ]}
                      />
                      <Text style={styles.annotationText}>
                        {annotation.content}
                      </Text>
                      <TouchableOpacity
                        onPress={() => deleteAnnotation(annotation.id)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#ff4444"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                  {annotation.type === "highlight" && (
                    <View
                      style={[
                        styles.highlight,
                        { backgroundColor: annotation.color + "40" },
                      ]}
                    />
                  )}
                </View>
              ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      {pdfFile && (
        <View style={styles.controlsBar}>
          <TouchableOpacity style={styles.controlBtn} onPress={prevPage}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>
            {currentPage} / {totalPages}
          </Text>
          <TouchableOpacity style={styles.controlBtn} onPress={nextPage}>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomBtn} onPress={zoomOut}>
              <Ionicons name="remove-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.zoomText}>{Math.round(zoomLevel * 100)}%</Text>
            <TouchableOpacity style={styles.zoomBtn} onPress={zoomIn}>
              <Ionicons name="add-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {renderPDFContent()}

      {pdfFile && (
        <View style={styles.toolbar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.toolBtn,
                toolMode === "view" && styles.toolBtnActive,
              ]}
              onPress={() => setToolMode("view")}
            >
              <Ionicons
                name="eye-outline"
                size={22}
                color={toolMode === "view" ? "#FF6B6B" : "#fff"}
              />
              <Text style={styles.toolBtnText}>View</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => setShowAnnotationModal(true)}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#fff" />
              <Text style={styles.toolBtnText}>Text</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={addHighlight}>
              <FontAwesome5 name="highlighter" size={18} color="#fff" />
              <Text style={styles.toolBtnText}>Highlight</Text>
            </TouchableOpacity>

            {/* FIX 5: moved flexDirection:"row" from ScrollView style to
                contentContainerStyle — it has no effect on the ScrollView
                root style and caused a TS strict-mode warning. */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.colorPicker}
              contentContainerStyle={styles.colorPickerContent}
            >
              {colors.map((color, index) => (
                <TouchableOpacity
                  // FIX 6: using index suffix to avoid duplicate-key warning
                  // from the repeated "#FF6B6B" value in the colors array.
                  key={`${color}-${index}`}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.toolBtn} onPress={exportPDF}>
              <Ionicons name="download-outline" size={22} color="#fff" />
              <Text style={styles.toolBtnText}>Export</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={sharePDF}>
              <Ionicons name="share-outline" size={22} color="#fff" />
              <Text style={styles.toolBtnText}>Share</Text>
            </TouchableOpacity>

            {annotations.length > 0 && (
              <TouchableOpacity
                style={styles.toolBtn}
                onPress={clearAllAnnotations}
              >
                <Ionicons name="trash-outline" size={22} color="#ff4444" />
                <Text style={[styles.toolBtnText, { color: "#ff4444" }]}>
                  Clear
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* Text annotation modal */}
      <Modal
        visible={showAnnotationModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Text Annotation</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter your annotation text..."
              placeholderTextColor="#666"
              value={annotationText}
              onChangeText={setAnnotationText}
              multiline
              numberOfLines={4}
            />
            <Text style={styles.colorLabel}>Choose Color</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.modalColorPicker}
              contentContainerStyle={styles.modalColorPickerContent}
            >
              {colors.map((color, index) => (
                <TouchableOpacity
                  key={`${color}-${index}`}
                  style={[
                    styles.modalColorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.modalColorSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowAnnotationModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.addBtn]}
                onPress={addTextAnnotation}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* New document name modal (replaces broken Alert.alert string callback) */}
      <Modal visible={showNewDocModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New PDF Document</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 48 }]}
              placeholder="Enter document name..."
              placeholderTextColor="#666"
              value={newDocName}
              onChangeText={setNewDocName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowNewDocModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.addBtn]}
                onPress={handleCreatePDF}
              >
                <Text style={styles.addBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {!pdfFile && (
        <TouchableOpacity style={styles.fab} onPress={importPDF}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  controlsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  controlBtn: { padding: 8, backgroundColor: "#334155", borderRadius: 8 },
  pageIndicator: { color: "#fff", fontSize: 16, fontWeight: "600" },
  zoomControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#334155",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  zoomBtn: { padding: 8 },
  zoomText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 8,
  },
  pdfContainer: { flex: 1 },
  pageContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  pdfPage: {
    width: width - 40,
    minHeight: height - 200,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
    position: "relative",
  },
  pdfPageNumber: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    color: "#fff",
    fontSize: 12,
    zIndex: 1,
  },
  pdfContent: {
    padding: 40,
    minHeight: 500,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginVertical: 8,
  },
  toolbar: {
    backgroundColor: "#1e293b",
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingVertical: 8,
    maxHeight: 80,
  },
  toolBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#334155",
  },
  toolBtnActive: {
    backgroundColor: "#FF6B6B20",
    borderWidth: 1,
    borderColor: "#FF6B6B",
  },
  toolBtnText: { color: "#fff", fontSize: 12, marginTop: 4 },
  colorPicker: { marginHorizontal: 8 },
  // FIX 5 (continued): flexDirection now lives in contentContainerStyle only
  colorPickerContent: { flexDirection: "row", alignItems: "center" },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: "#334155",
  },
  colorOptionSelected: { borderColor: "#fff", transform: [{ scale: 1.1 }] },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 30,
  },
  emptyStateButtons: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  importBtn: { backgroundColor: "#3b82f6" },
  createBtn: { backgroundColor: "#10b981" },
  actionBtnText: { color: "#fff", fontWeight: "600", marginLeft: 8 },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#FF6B6B",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 20,
    width: width - 40,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  colorLabel: { color: "#fff", fontSize: 14, marginBottom: 8 },
  modalColorPicker: { marginBottom: 20 },
  // FIX 5 (continued): flexDirection moved here from modalColorPicker style
  modalColorPickerContent: { flexDirection: "row" },
  modalColorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: "#334155",
  },
  modalColorSelected: { borderColor: "#fff", transform: [{ scale: 1.1 }] },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: "center",
  },
  cancelBtn: { backgroundColor: "#334155" },
  cancelBtnText: { color: "#fff", fontWeight: "600" },
  addBtn: { backgroundColor: "#FF6B6B" },
  addBtnText: { color: "#fff", fontWeight: "600" },
  annotationContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  textAnnotation: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 8,
    padding: 8,
    margin: 8,
    maxWidth: "80%",
  },
  // FIX 4: replaced invalid `height: "100%"` with `alignSelf: "stretch"`
  annotationColorBar: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 2,
    marginRight: 8,
  },
  annotationText: { color: "#fff", fontSize: 14, flex: 1 },
  highlight: { position: "absolute", width: "100%", height: 20, opacity: 0.3 },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: { color: "#fff", marginTop: 12, fontSize: 16 },
});

export default PdfEditor;

// // PdfEditor.tsx - TypeScript errors fixed
// import React, { useState, useRef } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Modal,
//   TextInput,
//   Alert,
//   Dimensions,
//   ActivityIndicator,
// } from "react-native";
// import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
// import * as DocumentPicker from "expo-document-picker";
// import * as FileSystem from "expo-file-system";
// import * as Sharing from "expo-sharing";
// import Toast from "react-native-toast-message";

// const { width, height } = Dimensions.get("window");

// // Types
// interface Annotation {
//   id: string;
//   type: "text" | "draw" | "highlight";
//   page: number;
//   content?: string;
//   points?: { x: number; y: number }[];
//   color: string;
//   position?: { x: number; y: number };
// }

// interface PDFFile {
//   uri: string;
//   name: string;
//   size: number;
//   pages?: number;
// }

// const PdfEditor: React.FC = () => {
//   const [pdfFile, setPdfFile] = useState<PDFFile | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(0);
//   const [annotations, setAnnotations] = useState<Annotation[]>([]);
//   const [showAnnotationModal, setShowAnnotationModal] = useState(false);
//   const [annotationText, setAnnotationText] = useState("");
//   const [selectedColor, setSelectedColor] = useState("#FF6B6B");
//   const [toolMode, setToolMode] = useState<"view" | "annotate" | "draw">(
//     "view",
//   );
//   // FIX 1: removed unused isDrawing / drawingPoints state that caused
//   // "declared but never read" TypeScript errors.
//   const [zoomLevel, setZoomLevel] = useState(1);

//   // FIX 2: Modal-based "new document name" flow replaces the Alert.alert
//   // approach whose onPress callback does NOT receive a string argument on
//   // Android (only Alert.prompt on iOS does), making `fileName?: string`
//   // a type error in cross-platform code.
//   const [showNewDocModal, setShowNewDocModal] = useState(false);
//   const [newDocName, setNewDocName] = useState("");

//   const scrollViewRef = useRef<ScrollView>(null);

//   const colors: string[] = [
//     "#FF6B6B",
//     "#4ECDC4",
//     "#45B7D1",
//     "#96CEB4",
//     "#FFEAA7",
//     "#DDA0DD",
//     "#FFB347",
//     "#779ECB",
//     "#FF6B6B",
//     "#98D8C8",
//   ];

//   // Import PDF from device
//   const importPDF = async () => {
//     try {
//       // FIX 3: expo-document-picker v11+ returns a discriminated union where
//       // the success branch no longer has a `type` field; instead `canceled`
//       // is a boolean on the top-level result.
//       const result = await DocumentPicker.getDocumentAsync({
//         type: "application/pdf",
//         copyToCacheDirectory: true,
//       });

//       if (result.canceled) {
//         return;
//       }

//       // `result.assets` is the new API (array of picked assets).
//       const asset = result.assets[0];
//       if (!asset) return;

//       setIsLoading(true);

//       const pdfInfo: PDFFile = {
//         uri: asset.uri,
//         name: asset.name ?? "document.pdf",
//         size: asset.size ?? 0,
//       };

//       setPdfFile(pdfInfo);

//       setTimeout(() => {
//         setTotalPages(Math.floor(Math.random() * 20) + 5);
//         setIsLoading(false);
//         Toast.show({
//           type: "success",
//           text1: "PDF Loaded",
//           text2: `${asset.name} loaded successfully`,
//         });
//       }, 1000);
//     } catch (error) {
//       console.error("Error importing PDF:", error);
//       Toast.show({
//         type: "error",
//         text1: "Import Failed",
//         text2: "Could not load PDF file",
//       });
//       setIsLoading(false);
//     }
//   };

//   // Create new blank PDF — opens a modal to collect the name
//   const createNewPDF = () => {
//     setNewDocName("");
//     setShowNewDocModal(true);
//   };

//   // Called when the user confirms the name in the modal
//   const handleCreatePDF = async () => {
//     const fileName = newDocName.trim();
//     if (!fileName) {
//       Alert.alert("Error", "Please enter a document name.");
//       return;
//     }
//     setShowNewDocModal(false);
//     setIsLoading(true);

//     const fileUri = `${FileSystem.documentDirectory}${fileName}.pdf`;

//     const blankPDFContent = `%PDF-1.4
// 1 0 obj
// <<
// /Type /Catalog
// /Pages 2 0 R
// >>
// endobj
// 2 0 obj
// <<
// /Type /Pages
// /Kids [3 0 R]
// /Count 1
// >>
// endobj
// 3 0 obj
// <<
// /Type /Page
// /Parent 2 0 R
// /MediaBox [0 0 612 792]
// /Contents 4 0 R
// /Resources <<
// /Font <<
// /F1 5 0 R
// >>
// >>
// >>
// endobj
// 4 0 obj
// <<
// /Length 88
// >>
// stream
// BT
// /F1 24 Tf
// 100 700 Td
// (New Document Created) Tj
// ET
// endstream
// endobj
// 5 0 obj
// <<
// /Type /Font
// /Subtype /Type1
// /BaseFont /Helvetica
// >>
// endobj
// xref
// 0 6
// 0000000000 65535 f
// 0000000009 00000 n
// 0000000058 00000 n
// 0000000115 00000 n
// 0000000234 00000 n
// 0000000381 00000 n
// trailer
// <<
// /Size 6
// /Root 1 0 R
// >>
// startxref
// 448
// %%EOF`;

//     try {
//       await FileSystem.writeAsStringAsync(fileUri, blankPDFContent);
//       setPdfFile({
//         uri: fileUri,
//         name: `${fileName}.pdf`,
//         size: blankPDFContent.length,
//       });
//       setTotalPages(1);
//       Toast.show({
//         type: "success",
//         text1: "Created",
//         text2: "New PDF document created",
//       });
//     } catch (error) {
//       Toast.show({
//         type: "error",
//         text1: "Error",
//         text2: "Could not create PDF",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Add text annotation
//   const addTextAnnotation = () => {
//     if (!annotationText.trim()) {
//       Alert.alert("Error", "Please enter annotation text");
//       return;
//     }

//     const newAnnotation: Annotation = {
//       id: Date.now().toString(),
//       type: "text",
//       page: currentPage,
//       content: annotationText,
//       color: selectedColor,
//       position: { x: 100, y: 100 + annotations.length * 30 },
//     };

//     setAnnotations([...annotations, newAnnotation]);
//     setAnnotationText("");
//     setShowAnnotationModal(false);

//     Toast.show({
//       type: "success",
//       text1: "Annotation Added",
//       text2: "Text annotation added to page",
//     });
//   };

//   // Add highlight annotation
//   const addHighlight = () => {
//     const newAnnotation: Annotation = {
//       id: Date.now().toString(),
//       type: "highlight",
//       page: currentPage,
//       color: selectedColor,
//       position: { x: 50, y: 200 + annotations.length * 40 },
//     };

//     setAnnotations([...annotations, newAnnotation]);

//     Toast.show({
//       type: "success",
//       text1: "Highlight Added",
//       text2: "Highlight added to page",
//     });
//   };

//   // Delete annotation
//   const deleteAnnotation = (id: string) => {
//     Alert.alert(
//       "Delete Annotation",
//       "Are you sure you want to delete this annotation?",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Delete",
//           style: "destructive",
//           onPress: () => {
//             setAnnotations(annotations.filter((ann) => ann.id !== id));
//             Toast.show({
//               type: "success",
//               text1: "Deleted",
//               text2: "Annotation removed",
//             });
//           },
//         },
//       ],
//     );
//   };

//   // Export PDF with annotations
//   const exportPDF = async () => {
//     if (!pdfFile) return;

//     setIsLoading(true);
//     try {
//       const annotationsPath = `${FileSystem.documentDirectory}${pdfFile.name.replace(".pdf", "_annotations.json")}`;
//       await FileSystem.writeAsStringAsync(
//         annotationsPath,
//         JSON.stringify(annotations, null, 2),
//       );

//       Toast.show({
//         type: "success",
//         text1: "Exported",
//         text2: "PDF saved with annotations",
//       });
//     } catch (error) {
//       Toast.show({
//         type: "error",
//         text1: "Export Failed",
//         text2: "Could not export PDF",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Share PDF
//   const sharePDF = async () => {
//     if (!pdfFile) return;

//     try {
//       const isAvailable = await Sharing.isAvailableAsync();
//       if (isAvailable) {
//         await Sharing.shareAsync(pdfFile.uri, {
//           mimeType: "application/pdf",
//           dialogTitle: "Share PDF",
//         });
//       } else {
//         Alert.alert("Error", "Sharing is not available on this device");
//       }
//     } catch (error) {
//       Toast.show({
//         type: "error",
//         text1: "Share Failed",
//         text2: "Could not share PDF",
//       });
//     }
//   };

//   // Clear all annotations
//   const clearAllAnnotations = () => {
//     Alert.alert(
//       "Clear All Annotations",
//       "Are you sure you want to remove all annotations?",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Clear All",
//           style: "destructive",
//           onPress: () => {
//             setAnnotations([]);
//             Toast.show({
//               type: "success",
//               text1: "Cleared",
//               text2: "All annotations removed",
//             });
//           },
//         },
//       ],
//     );
//   };

//   // Zoom controls
//   const zoomIn = () => setZoomLevel(Math.min(zoomLevel + 0.2, 3));
//   const zoomOut = () => setZoomLevel(Math.max(zoomLevel - 0.2, 0.5));

//   // Navigation
//   const nextPage = () => {
//     if (currentPage < totalPages) {
//       setCurrentPage(currentPage + 1);
//       scrollViewRef.current?.scrollTo({ y: 0, animated: true });
//     }
//   };

//   const prevPage = () => {
//     if (currentPage > 1) {
//       setCurrentPage(currentPage - 1);
//       scrollViewRef.current?.scrollTo({ y: 0, animated: true });
//     }
//   };

//   // Render PDF content preview
//   const renderPDFContent = () => {
//     if (!pdfFile) {
//       return (
//         <View style={styles.emptyState}>
//           <FontAwesome5 name="file-pdf" size={80} color="#666" />
//           <Text style={styles.emptyStateTitle}>No PDF Loaded</Text>
//           <Text style={styles.emptyStateText}>
//             Import a PDF file or create a new one to start editing
//           </Text>
//           <View style={styles.emptyStateButtons}>
//             <TouchableOpacity
//               style={[styles.actionBtn, styles.importBtn]}
//               onPress={importPDF}
//             >
//               <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
//               <Text style={styles.actionBtnText}>Import PDF</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[styles.actionBtn, styles.createBtn]}
//               onPress={createNewPDF}
//             >
//               <Ionicons name="create-outline" size={20} color="#fff" />
//               <Text style={styles.actionBtnText}>Create New</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       );
//     }

//     return (
//       <ScrollView
//         ref={scrollViewRef}
//         style={styles.pdfContainer}
//         showsVerticalScrollIndicator={true}
//         pinchGestureEnabled={true}
//       >
//         <View
//           style={[styles.pageContainer, { transform: [{ scale: zoomLevel }] }]}
//         >
//           <View style={styles.pdfPage}>
//             <Text style={styles.pdfPageNumber}>Page {currentPage}</Text>
//             <View style={styles.pdfContent}>
//               <Text style={styles.placeholderText}>
//                 PDF Content Preview{"\n"}
//                 This is a placeholder for the actual PDF rendering.
//               </Text>
//               <Text style={styles.placeholderText}>
//                 File: {pdfFile.name}
//                 {"\n"}
//                 Size: {(pdfFile.size / 1024).toFixed(2)} KB
//               </Text>
//             </View>

//             {/* Render annotations */}
//             {annotations
//               .filter((ann) => ann.page === currentPage)
//               .map((annotation) => (
//                 <View key={annotation.id} style={styles.annotationContainer}>
//                   {annotation.type === "text" && (
//                     <View
//                       style={[
//                         styles.textAnnotation,
//                         { backgroundColor: annotation.color + "20" },
//                       ]}
//                     >
//                       {/* FIX 4: annotationColorBar height was "100%" which is
//                           invalid in RN StyleSheet for non-absolutely-positioned
//                           children with unknown parent height. Use alignSelf
//                           "stretch" instead so it fills the flex row correctly. */}
//                       <View
//                         style={[
//                           styles.annotationColorBar,
//                           { backgroundColor: annotation.color },
//                         ]}
//                       />
//                       <Text style={styles.annotationText}>
//                         {annotation.content}
//                       </Text>
//                       <TouchableOpacity
//                         onPress={() => deleteAnnotation(annotation.id)}
//                       >
//                         <Ionicons
//                           name="close-circle"
//                           size={20}
//                           color="#ff4444"
//                         />
//                       </TouchableOpacity>
//                     </View>
//                   )}
//                   {annotation.type === "highlight" && (
//                     <View
//                       style={[
//                         styles.highlight,
//                         { backgroundColor: annotation.color + "40" },
//                       ]}
//                     />
//                   )}
//                 </View>
//               ))}
//           </View>
//         </View>
//       </ScrollView>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       {isLoading && (
//         <View style={styles.loadingOverlay}>
//           <ActivityIndicator size="large" color="#FF6B6B" />
//           <Text style={styles.loadingText}>Processing...</Text>
//         </View>
//       )}

//       {pdfFile && (
//         <View style={styles.controlsBar}>
//           <TouchableOpacity style={styles.controlBtn} onPress={prevPage}>
//             <Ionicons name="chevron-back" size={24} color="#fff" />
//           </TouchableOpacity>
//           <Text style={styles.pageIndicator}>
//             {currentPage} / {totalPages}
//           </Text>
//           <TouchableOpacity style={styles.controlBtn} onPress={nextPage}>
//             <Ionicons name="chevron-forward" size={24} color="#fff" />
//           </TouchableOpacity>
//           <View style={styles.zoomControls}>
//             <TouchableOpacity style={styles.zoomBtn} onPress={zoomOut}>
//               <Ionicons name="remove-outline" size={20} color="#fff" />
//             </TouchableOpacity>
//             <Text style={styles.zoomText}>{Math.round(zoomLevel * 100)}%</Text>
//             <TouchableOpacity style={styles.zoomBtn} onPress={zoomIn}>
//               <Ionicons name="add-outline" size={20} color="#fff" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}

//       {renderPDFContent()}

//       {pdfFile && (
//         <View style={styles.toolbar}>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             <TouchableOpacity
//               style={[
//                 styles.toolBtn,
//                 toolMode === "view" && styles.toolBtnActive,
//               ]}
//               onPress={() => setToolMode("view")}
//             >
//               <Ionicons
//                 name="eye-outline"
//                 size={22}
//                 color={toolMode === "view" ? "#FF6B6B" : "#fff"}
//               />
//               <Text style={styles.toolBtnText}>View</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.toolBtn}
//               onPress={() => setShowAnnotationModal(true)}
//             >
//               <Ionicons name="chatbubble-outline" size={22} color="#fff" />
//               <Text style={styles.toolBtnText}>Text</Text>
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.toolBtn} onPress={addHighlight}>
//               <FontAwesome5 name="highlighter" size={18} color="#fff" />
//               <Text style={styles.toolBtnText}>Highlight</Text>
//             </TouchableOpacity>

//             {/* FIX 5: moved flexDirection:"row" from ScrollView style to
//                 contentContainerStyle — it has no effect on the ScrollView
//                 root style and caused a TS strict-mode warning. */}
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               style={styles.colorPicker}
//               contentContainerStyle={styles.colorPickerContent}
//             >
//               {colors.map((color, index) => (
//                 <TouchableOpacity
//                   // FIX 6: using index suffix to avoid duplicate-key warning
//                   // from the repeated "#FF6B6B" value in the colors array.
//                   key={`${color}-${index}`}
//                   style={[
//                     styles.colorOption,
//                     { backgroundColor: color },
//                     selectedColor === color && styles.colorOptionSelected,
//                   ]}
//                   onPress={() => setSelectedColor(color)}
//                 />
//               ))}
//             </ScrollView>

//             <TouchableOpacity style={styles.toolBtn} onPress={exportPDF}>
//               <Ionicons name="download-outline" size={22} color="#fff" />
//               <Text style={styles.toolBtnText}>Export</Text>
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.toolBtn} onPress={sharePDF}>
//               <Ionicons name="share-outline" size={22} color="#fff" />
//               <Text style={styles.toolBtnText}>Share</Text>
//             </TouchableOpacity>

//             {annotations.length > 0 && (
//               <TouchableOpacity
//                 style={styles.toolBtn}
//                 onPress={clearAllAnnotations}
//               >
//                 <Ionicons name="trash-outline" size={22} color="#ff4444" />
//                 <Text style={[styles.toolBtnText, { color: "#ff4444" }]}>
//                   Clear
//                 </Text>
//               </TouchableOpacity>
//             )}
//           </ScrollView>
//         </View>
//       )}

//       {/* Text annotation modal */}
//       <Modal
//         visible={showAnnotationModal}
//         animationType="slide"
//         transparent={true}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Add Text Annotation</Text>
//             <TextInput
//               style={styles.modalInput}
//               placeholder="Enter your annotation text..."
//               placeholderTextColor="#666"
//               value={annotationText}
//               onChangeText={setAnnotationText}
//               multiline
//               numberOfLines={4}
//             />
//             <Text style={styles.colorLabel}>Choose Color</Text>
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               style={styles.modalColorPicker}
//               contentContainerStyle={styles.modalColorPickerContent}
//             >
//               {colors.map((color, index) => (
//                 <TouchableOpacity
//                   key={`${color}-${index}`}
//                   style={[
//                     styles.modalColorOption,
//                     { backgroundColor: color },
//                     selectedColor === color && styles.modalColorSelected,
//                   ]}
//                   onPress={() => setSelectedColor(color)}
//                 />
//               ))}
//             </ScrollView>
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalBtn, styles.cancelBtn]}
//                 onPress={() => setShowAnnotationModal(false)}
//               >
//                 <Text style={styles.cancelBtnText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalBtn, styles.addBtn]}
//                 onPress={addTextAnnotation}
//               >
//                 <Text style={styles.addBtnText}>Add</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* New document name modal (replaces broken Alert.alert string callback) */}
//       <Modal visible={showNewDocModal} animationType="slide" transparent={true}>
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>New PDF Document</Text>
//             <TextInput
//               style={[styles.modalInput, { minHeight: 48 }]}
//               placeholder="Enter document name..."
//               placeholderTextColor="#666"
//               value={newDocName}
//               onChangeText={setNewDocName}
//               autoFocus
//             />
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalBtn, styles.cancelBtn]}
//                 onPress={() => setShowNewDocModal(false)}
//               >
//                 <Text style={styles.cancelBtnText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalBtn, styles.addBtn]}
//                 onPress={handleCreatePDF}
//               >
//                 <Text style={styles.addBtnText}>Create</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {!pdfFile && (
//         <TouchableOpacity style={styles.fab} onPress={importPDF}>
//           <Ionicons name="add" size={30} color="#fff" />
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#0f172a" },
//   controlsBar: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: "#1e293b",
//     borderBottomWidth: 1,
//     borderBottomColor: "#334155",
//   },
//   controlBtn: { padding: 8, backgroundColor: "#334155", borderRadius: 8 },
//   pageIndicator: { color: "#fff", fontSize: 16, fontWeight: "600" },
//   zoomControls: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#334155",
//     borderRadius: 8,
//     paddingHorizontal: 8,
//   },
//   zoomBtn: { padding: 8 },
//   zoomText: {
//     color: "#fff",
//     fontSize: 14,
//     fontWeight: "600",
//     marginHorizontal: 8,
//   },
//   pdfContainer: { flex: 1 },
//   pageContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 20,
//   },
//   pdfPage: {
//     width: width - 40,
//     minHeight: height - 200,
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 8,
//     elevation: 5,
//     overflow: "hidden",
//     position: "relative",
//   },
//   pdfPageNumber: {
//     position: "absolute",
//     top: 10,
//     right: 10,
//     backgroundColor: "rgba(0,0,0,0.6)",
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     color: "#fff",
//     fontSize: 12,
//     zIndex: 1,
//   },
//   pdfContent: {
//     padding: 40,
//     minHeight: 500,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   placeholderText: {
//     color: "#666",
//     textAlign: "center",
//     lineHeight: 24,
//     marginVertical: 8,
//   },
//   toolbar: {
//     backgroundColor: "#1e293b",
//     borderTopWidth: 1,
//     borderTopColor: "#334155",
//     paddingVertical: 8,
//     maxHeight: 80,
//   },
//   toolBtn: {
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     marginHorizontal: 4,
//     borderRadius: 8,
//     backgroundColor: "#334155",
//   },
//   toolBtnActive: {
//     backgroundColor: "#FF6B6B20",
//     borderWidth: 1,
//     borderColor: "#FF6B6B",
//   },
//   toolBtnText: { color: "#fff", fontSize: 12, marginTop: 4 },
//   colorPicker: { marginHorizontal: 8 },
//   // FIX 5 (continued): flexDirection now lives in contentContainerStyle only
//   colorPickerContent: { flexDirection: "row", alignItems: "center" },
//   colorOption: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     marginHorizontal: 4,
//     borderWidth: 2,
//     borderColor: "#334155",
//   },
//   colorOptionSelected: { borderColor: "#fff", transform: [{ scale: 1.1 }] },
//   emptyState: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 40,
//   },
//   emptyStateTitle: {
//     fontSize: 24,
//     fontWeight: "700",
//     color: "#fff",
//     marginTop: 20,
//     marginBottom: 10,
//   },
//   emptyStateText: {
//     fontSize: 14,
//     color: "#94a3b8",
//     textAlign: "center",
//     marginBottom: 30,
//   },
//   emptyStateButtons: { flexDirection: "row", gap: 12 },
//   actionBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 12,
//     marginHorizontal: 8,
//   },
//   importBtn: { backgroundColor: "#3b82f6" },
//   createBtn: { backgroundColor: "#10b981" },
//   actionBtnText: { color: "#fff", fontWeight: "600", marginLeft: 8 },
//   fab: {
//     position: "absolute",
//     bottom: 20,
//     right: 20,
//     backgroundColor: "#FF6B6B",
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     justifyContent: "center",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 8,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   modalContent: {
//     backgroundColor: "#1e293b",
//     borderRadius: 16,
//     padding: 20,
//     width: width - 40,
//     maxWidth: 400,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#fff",
//     marginBottom: 20,
//     textAlign: "center",
//   },
//   modalInput: {
//     backgroundColor: "#0f172a",
//     borderRadius: 12,
//     padding: 12,
//     color: "#fff",
//     fontSize: 16,
//     minHeight: 100,
//     textAlignVertical: "top",
//     marginBottom: 16,
//   },
//   colorLabel: { color: "#fff", fontSize: 14, marginBottom: 8 },
//   modalColorPicker: { marginBottom: 20 },
//   // FIX 5 (continued): flexDirection moved here from modalColorPicker style
//   modalColorPickerContent: { flexDirection: "row" },
//   modalColorOption: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     marginHorizontal: 6,
//     borderWidth: 2,
//     borderColor: "#334155",
//   },
//   modalColorSelected: { borderColor: "#fff", transform: [{ scale: 1.1 }] },
//   modalButtons: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 12,
//   },
//   modalBtn: {
//     flex: 1,
//     paddingVertical: 12,
//     borderRadius: 8,
//     marginHorizontal: 8,
//     alignItems: "center",
//   },
//   cancelBtn: { backgroundColor: "#334155" },
//   cancelBtnText: { color: "#fff", fontWeight: "600" },
//   addBtn: { backgroundColor: "#FF6B6B" },
//   addBtnText: { color: "#fff", fontWeight: "600" },
//   annotationContainer: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//   },
//   textAnnotation: {
//     position: "absolute",
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "rgba(0,0,0,0.8)",
//     borderRadius: 8,
//     padding: 8,
//     margin: 8,
//     maxWidth: "80%",
//   },
//   // FIX 4: replaced invalid `height: "100%"` with `alignSelf: "stretch"`
//   annotationColorBar: {
//     width: 4,
//     alignSelf: "stretch",
//     borderRadius: 2,
//     marginRight: 8,
//   },
//   annotationText: { color: "#fff", fontSize: 14, flex: 1 },
//   highlight: { position: "absolute", width: "100%", height: 20, opacity: 0.3 },
//   loadingOverlay: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: "rgba(0,0,0,0.7)",
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 1000,
//   },
//   loadingText: { color: "#fff", marginTop: 12, fontSize: 16 },
// });

// export default PdfEditor;
