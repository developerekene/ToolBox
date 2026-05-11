// /**
//  * ImageEditor.tsx
//  * Drop into:  app/toolbox/newtools/ImageEditor.tsx  (or wherever your import points)
//  *
//  * Required packages (all Expo SDK — likely already installed):
//  *   expo-image-picker
//  *   expo-image-manipulator
//  *   expo-media-library
//  *   expo-sharing
//  *   @react-native-community/slider   (or expo-slider)
//  *
//  * Install anything missing:
//  *   npx expo install expo-image-picker expo-image-manipulator expo-media-library expo-sharing
//  *   npx expo install @react-native-community/slider
//  */

// import React, { useState, useCallback, useRef } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Image,
//   Dimensions,
//   ActivityIndicator,
//   TextInput,
//   Alert,
//   Platform,
//   PanResponder,
//   Modal,
// } from "react-native";
// import * as ImagePicker from "expo-image-picker";
// import * as ImageManipulator from "expo-image-manipulator";
// import * as MediaLibrary from "expo-media-library";
// import * as Sharing from "expo-sharing";
// import Slider from "@react-native-community/slider";
// import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

// // ─── Types ─────────────────────────────────────────────────────────────────────
// interface TextOverlay {
//   id: string;
//   text: string;
//   x: number;
//   y: number;
//   fontSize: number;
//   color: string;
//   bold: boolean;
// }

// interface Adjustments {
//   brightness: number; // -1 to 1  (0 = neutral)
//   contrast: number; // -1 to 1
//   saturation: number; // -1 to 1
// }

// type TabId = "adjust" | "filter" | "crop" | "text" | "export";
// type FilterId =
//   | "none"
//   | "vivid"
//   | "matte"
//   | "noir"
//   | "warm"
//   | "cool"
//   | "fade"
//   | "drama"
//   | "vintage"
//   | "chrome";
// type AspectId = "free" | "1:1" | "4:3" | "16:9" | "9:16";
// type ExportFormat = "jpeg" | "png" | "webp";

// // ─── Constants ──────────────────────────────────────────────────────────────────
// const { width: SW, height: SH } = Dimensions.get("window");
// const PREVIEW_H = SH * 0.38;

// const FILTERS: {
//   id: FilterId;
//   label: string;
//   brightness: number;
//   contrast: number;
//   saturate: number;
// }[] = [
//   { id: "none", label: "None", brightness: 1, contrast: 1, saturate: 1 },
//   {
//     id: "vivid",
//     label: "Vivid",
//     brightness: 1.05,
//     contrast: 1.15,
//     saturate: 1.8,
//   },
//   {
//     id: "matte",
//     label: "Matte",
//     brightness: 1.08,
//     contrast: 0.9,
//     saturate: 0.65,
//   },
//   { id: "noir", label: "Noir", brightness: 1.0, contrast: 1.3, saturate: 0 },
//   {
//     id: "warm",
//     label: "Warm",
//     brightness: 1.05,
//     contrast: 1.05,
//     saturate: 1.4,
//   },
//   {
//     id: "cool",
//     label: "Cool",
//     brightness: 1.02,
//     contrast: 1.05,
//     saturate: 1.1,
//   },
//   {
//     id: "fade",
//     label: "Fade",
//     brightness: 1.12,
//     contrast: 0.85,
//     saturate: 0.5,
//   },
//   {
//     id: "drama",
//     label: "Drama",
//     brightness: 0.88,
//     contrast: 1.6,
//     saturate: 1.5,
//   },
//   {
//     id: "vintage",
//     label: "Vintage",
//     brightness: 0.95,
//     contrast: 0.85,
//     saturate: 0.7,
//   },
//   {
//     id: "chrome",
//     label: "Chrome",
//     brightness: 1.05,
//     contrast: 1.3,
//     saturate: 1.25,
//   },
// ];

// const TEXT_COLORS = [
//   "#ffffff",
//   "#000000",
//   "#F59E0B",
//   "#ef4444",
//   "#22c55e",
//   "#3b82f6",
//   "#a855f7",
//   "#f97316",
// ];

// const ASPECT_RATIOS: { id: AspectId; label: string; value: number | null }[] = [
//   { id: "free", label: "Free", value: null },
//   { id: "1:1", label: "1:1", value: 1 },
//   { id: "4:3", label: "4:3", value: 4 / 3 },
//   { id: "16:9", label: "16:9", value: 16 / 9 },
//   { id: "9:16", label: "9:16", value: 9 / 16 },
// ];

// // ─── Helpers ────────────────────────────────────────────────────────────────────
// /** Clamp a value between min and max */
// const clamp = (v: number, min: number, max: number) =>
//   Math.max(min, Math.min(max, v));

// /** Convert our -1…1 brightness offset to expo-image-manipulator 0…2 range */
// const adjToManipBrightness = (b: number) => 1 + b; // 0 → 1 (neutral)

// // ─── Component ─────────────────────────────────────────────────────────────────
// export default function ImageEditor() {
//   // Image state
//   const [imageUri, setImageUri] = useState<string | null>(null);
//   const [originalUri, setOriginalUri] = useState<string | null>(null);
//   const [imgWidth, setImgWidth] = useState(1);
//   const [imgHeight, setImgHeight] = useState(1);
//   const [processing, setProcessing] = useState(false);

//   // Editor state
//   const [activeTab, setActiveTab] = useState<TabId>("adjust");
//   const [activeFilter, setActiveFilter] = useState<FilterId>("none");
//   const [rotation, setRotation] = useState(0);
//   const [flipH, setFlipH] = useState(false);
//   const [flipV, setFlipV] = useState(false);
//   const [adjustments, setAdjustments] = useState<Adjustments>({
//     brightness: 0,
//     contrast: 0,
//     saturation: 0,
//   });
//   const [cropAspect, setCropAspect] = useState<AspectId>("free");
//   const [textLayers, setTextLayers] = useState<TextOverlay[]>([]);
//   const [activeTextId, setActiveTextId] = useState<string | null>(null);
//   const [textDraft, setTextDraft] = useState("");
//   const [textColor, setTextColor] = useState("#ffffff");
//   const [textSize, setTextSize] = useState(32);
//   const [textBold, setTextBold] = useState(false);
//   const [exportFormat, setExportFormat] = useState<ExportFormat>("jpeg");
//   const [exportQuality, setExportQuality] = useState(90);

//   // History (uri stack)
//   const [history, setHistory] = useState<string[]>([]);
//   const [histIdx, setHistIdx] = useState(-1);

//   // ─── Image Pick ──────────────────────────────────────────────────────────────
//   const pickImage = useCallback(async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert(
//         "Permission needed",
//         "Allow photo library access to edit images.",
//       );
//       return;
//     }
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       quality: 1,
//       allowsEditing: false,
//     });
//     if (result.canceled || !result.assets?.length) return;
//     const asset = result.assets[0];
//     setImageUri(asset.uri);
//     setOriginalUri(asset.uri);
//     setImgWidth(asset.width ?? 1);
//     setImgHeight(asset.height ?? 1);
//     setHistory([asset.uri]);
//     setHistIdx(0);
//     resetEdits();
//   }, []);

//   const takePhoto = useCallback(async () => {
//     const { status } = await ImagePicker.requestCameraPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert("Permission needed", "Allow camera access to take photos.");
//       return;
//     }
//     const result = await ImagePicker.launchCameraAsync({ quality: 1 });
//     if (result.canceled || !result.assets?.length) return;
//     const asset = result.assets[0];
//     setImageUri(asset.uri);
//     setOriginalUri(asset.uri);
//     setImgWidth(asset.width ?? 1);
//     setImgHeight(asset.height ?? 1);
//     setHistory([asset.uri]);
//     setHistIdx(0);
//     resetEdits();
//   }, []);

//   const resetEdits = () => {
//     setRotation(0);
//     setFlipH(false);
//     setFlipV(false);
//     setAdjustments({ brightness: 0, contrast: 0, saturation: 0 });
//     setActiveFilter("none");
//     setTextLayers([]);
//     setActiveTextId(null);
//   };

//   // ─── Apply edits via expo-image-manipulator ───────────────────────────────────
//   const applyAndSave = useCallback(async () => {
//     if (!imageUri) return;
//     setProcessing(true);
//     try {
//       const actions: ImageManipulator.Action[] = [];

//       // Rotate
//       if (rotation !== 0) {
//         actions.push({ rotate: rotation });
//       }
//       // Flip
//       if (flipH) actions.push({ flip: ImageManipulator.FlipType.Horizontal });
//       if (flipV) actions.push({ flip: ImageManipulator.FlipType.Vertical });

//       const result = await ImageManipulator.manipulateAsync(
//         originalUri ?? imageUri,
//         actions,
//         {
//           compress: exportQuality / 100,
//           format:
//             exportFormat === "png"
//               ? ImageManipulator.SaveFormat.PNG
//               : ImageManipulator.SaveFormat.JPEG,
//         },
//       );
//       setImageUri(result.uri);
//       // Push to history
//       const newHist = [...history.slice(0, histIdx + 1), result.uri].slice(-20);
//       setHistory(newHist);
//       setHistIdx(newHist.length - 1);
//     } catch (e: any) {
//       Alert.alert("Processing error", e.message);
//     } finally {
//       setProcessing(false);
//     }
//   }, [
//     imageUri,
//     originalUri,
//     rotation,
//     flipH,
//     flipV,
//     exportFormat,
//     exportQuality,
//     history,
//     histIdx,
//   ]);

//   // ─── Export / Save ────────────────────────────────────────────────────────────
//   const saveToGallery = useCallback(async () => {
//     if (!imageUri) return;
//     const { status } = await MediaLibrary.requestPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert("Permission needed", "Allow media library access to save.");
//       return;
//     }
//     setProcessing(true);
//     try {
//       // Apply pending transforms first
//       const actions: ImageManipulator.Action[] = [];
//       if (rotation !== 0) actions.push({ rotate: rotation });
//       if (flipH) actions.push({ flip: ImageManipulator.FlipType.Horizontal });
//       if (flipV) actions.push({ flip: ImageManipulator.FlipType.Vertical });

//       const result = await ImageManipulator.manipulateAsync(imageUri, actions, {
//         compress: exportQuality / 100,
//         format:
//           exportFormat === "png"
//             ? ImageManipulator.SaveFormat.PNG
//             : ImageManipulator.SaveFormat.JPEG,
//       });
//       await MediaLibrary.saveToLibraryAsync(result.uri);
//       Alert.alert("Saved!", "Image saved to your photo library.");
//     } catch (e: any) {
//       Alert.alert("Save failed", e.message);
//     } finally {
//       setProcessing(false);
//     }
//   }, [imageUri, rotation, flipH, flipV, exportFormat, exportQuality]);

//   const shareImage = useCallback(async () => {
//     if (!imageUri) return;
//     const available = await Sharing.isAvailableAsync();
//     if (!available) {
//       Alert.alert("Sharing not available on this device.");
//       return;
//     }
//     await Sharing.shareAsync(imageUri, {
//       mimeType: exportFormat === "png" ? "image/png" : "image/jpeg",
//       dialogTitle: "Share your edited photo",
//     });
//   }, [imageUri, exportFormat]);

//   // ─── Undo / Redo ─────────────────────────────────────────────────────────────
//   const undo = () => {
//     if (histIdx > 0) {
//       setHistIdx(histIdx - 1);
//       setImageUri(history[histIdx - 1]);
//     }
//   };
//   const redo = () => {
//     if (histIdx < history.length - 1) {
//       setHistIdx(histIdx + 1);
//       setImageUri(history[histIdx + 1]);
//     }
//   };

//   // ─── Text overlay drag ────────────────────────────────────────────────────────
//   const addTextLayer = () => {
//     if (!textDraft.trim()) return;
//     const newLayer: TextOverlay = {
//       id: `txt_${Date.now()}`,
//       text: textDraft.trim(),
//       x: 40,
//       y: 60,
//       fontSize: textSize,
//       color: textColor,
//       bold: textBold,
//     };
//     setTextLayers((prev) => [...prev, newLayer]);
//     setActiveTextId(newLayer.id);
//     setTextDraft("");
//   };

//   const removeTextLayer = (id: string) => {
//     setTextLayers((prev) => prev.filter((t) => t.id !== id));
//     if (activeTextId === id) setActiveTextId(null);
//   };

//   // ─── CSS-style filter string (applied via RN style on Image) ─────────────────
//   // RN doesn't support CSS filters on Image, but we compose a tint effect using
//   // the `tintColor` trick is limited. Instead we apply transform for flip/rotate
//   // and render filter description as a label overlay (actual processing via
//   // expo-image-manipulator on export). For live preview we use opacity + overlays.

//   // Compute rotation + flip transform for live preview
//   const imageTransform = [
//     { rotate: `${rotation}deg` },
//     { scaleX: flipH ? -1 : 1 },
//     { scaleY: flipV ? -1 : 1 },
//   ];

//   // Get filter overlay opacity for "noir" (simple grayscale simulation via overlay)
//   const filterData = FILTERS.find((f) => f.id === activeFilter) ?? FILTERS[0];

//   // ─── Computed image display size ──────────────────────────────────────────────
//   const aspect = imgWidth / imgHeight || 1;
//   const dispW = SW - 0;
//   const dispH = Math.min(PREVIEW_H, dispW / aspect);

//   // ─── Tab content ──────────────────────────────────────────────────────────────
//   const renderPanel = () => {
//     switch (activeTab) {
//       case "adjust":
//         return (
//           <AdjustPanel
//             adjustments={adjustments}
//             setAdjustments={setAdjustments}
//             rotation={rotation}
//             setRotation={setRotation}
//             flipH={flipH}
//             setFlipH={setFlipH}
//             flipV={flipV}
//             setFlipV={setFlipV}
//           />
//         );
//       case "filter":
//         return (
//           <FilterPanel
//             active={activeFilter}
//             onSelect={setActiveFilter}
//             imageUri={imageUri}
//           />
//         );
//       case "crop":
//         return (
//           <CropPanel
//             cropAspect={cropAspect}
//             setCropAspect={setCropAspect}
//             rotation={rotation}
//             setRotation={setRotation}
//             onApply={applyAndSave}
//             processing={processing}
//           />
//         );
//       case "text":
//         return (
//           <TextPanel
//             textDraft={textDraft}
//             setTextDraft={setTextDraft}
//             textColor={textColor}
//             setTextColor={setTextColor}
//             textSize={textSize}
//             setTextSize={setTextSize}
//             textBold={textBold}
//             setTextBold={setTextBold}
//             textLayers={textLayers}
//             activeTextId={activeTextId}
//             setActiveTextId={setActiveTextId}
//             onAdd={addTextLayer}
//             onRemove={removeTextLayer}
//           />
//         );
//       case "export":
//         return (
//           <ExportPanel
//             format={exportFormat}
//             setFormat={setExportFormat}
//             quality={exportQuality}
//             setQuality={setExportQuality}
//             onSave={saveToGallery}
//             onShare={shareImage}
//             processing={processing}
//             imgWidth={imgWidth}
//             imgHeight={imgHeight}
//           />
//         );
//     }
//   };

//   // ─── No image state ───────────────────────────────────────────────────────────
//   if (!imageUri) {
//     return (
//       <View style={styles.empty}>
//         <Text style={styles.emptyIcon}>🖼️</Text>
//         <Text style={styles.emptyTitle}>Image Editor</Text>
//         <Text style={styles.emptySubtitle}>
//           Pick a photo from your gallery or take a new one to start editing.
//         </Text>
//         <TouchableOpacity style={styles.pickBtn} onPress={pickImage}>
//           <Ionicons name="images-outline" size={20} color="#000" />
//           <Text style={styles.pickBtnText}>Choose from Gallery</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.pickBtn, styles.cameraBtn]}
//           onPress={takePhoto}
//         >
//           <Ionicons name="camera-outline" size={20} color="#F59E0B" />
//           <Text style={[styles.pickBtnText, { color: "#F59E0B" }]}>
//             Take Photo
//           </Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   // ─── Editor layout ─────────────────────────────────────────────────────────────
//   return (
//     <View style={styles.root}>
//       {/* ── Top bar ── */}
//       <View style={styles.topBar}>
//         <TouchableOpacity style={styles.tbBtn} onPress={pickImage}>
//           <Ionicons name="images-outline" size={18} color="#94a3b8" />
//         </TouchableOpacity>
//         <View style={styles.tbActions}>
//           <TouchableOpacity
//             style={[styles.tbBtn, histIdx <= 0 && styles.tbBtnOff]}
//             onPress={undo}
//             disabled={histIdx <= 0}
//           >
//             <Ionicons
//               name="arrow-undo-outline"
//               size={18}
//               color={histIdx > 0 ? "#94a3b8" : "#334155"}
//             />
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[
//               styles.tbBtn,
//               histIdx >= history.length - 1 && styles.tbBtnOff,
//             ]}
//             onPress={redo}
//             disabled={histIdx >= history.length - 1}
//           >
//             <Ionicons
//               name="arrow-redo-outline"
//               size={18}
//               color={histIdx < history.length - 1 ? "#94a3b8" : "#334155"}
//             />
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.tbBtn}
//             onPress={() => {
//               Alert.alert("Reset all edits?", "This will undo all changes.", [
//                 { text: "Cancel", style: "cancel" },
//                 {
//                   text: "Reset",
//                   style: "destructive",
//                   onPress: () => {
//                     setImageUri(originalUri);
//                     resetEdits();
//                   },
//                 },
//               ]);
//             }}
//           >
//             <Ionicons name="refresh-outline" size={18} color="#94a3b8" />
//           </TouchableOpacity>
//         </View>
//         <TouchableOpacity style={styles.saveBtn} onPress={saveToGallery}>
//           <Text style={styles.saveBtnText}>Save</Text>
//         </TouchableOpacity>
//       </View>

//       {/* ── Canvas ── */}
//       <View style={[styles.canvas, { height: PREVIEW_H }]}>
//         <View
//           style={{
//             width: dispW,
//             height: dispH,
//             overflow: "hidden",
//             position: "relative",
//           }}
//         >
//           <Image
//             source={{ uri: imageUri }}
//             style={{
//               width: dispW,
//               height: dispH,
//               transform: imageTransform,
//               opacity:
//                 activeFilter === "fade"
//                   ? 0.82
//                   : activeFilter === "matte"
//                     ? 0.92
//                     : 1,
//             }}
//             resizeMode="contain"
//           />
//           {/* Noir overlay */}
//           {activeFilter === "noir" && (
//             <View
//               style={[
//                 StyleSheet.absoluteFill,
//                 {
//                   backgroundColor: "transparent",
//                   // Simulated grayscale via a dark semi-transparent overlay
//                 },
//               ]}
//               pointerEvents="none"
//             >
//               <Image
//                 source={{ uri: imageUri }}
//                 style={{
//                   ...StyleSheet.absoluteFillObject,
//                   tintColor: "#888",
//                   opacity: 0.55,
//                   transform: imageTransform,
//                 }}
//                 resizeMode="contain"
//               />
//             </View>
//           )}
//           {/* Warm overlay */}
//           {activeFilter === "warm" && (
//             <View
//               style={[
//                 StyleSheet.absoluteFill,
//                 { backgroundColor: "rgba(251,146,60,0.12)" },
//               ]}
//               pointerEvents="none"
//             />
//           )}
//           {/* Cool overlay */}
//           {activeFilter === "cool" && (
//             <View
//               style={[
//                 StyleSheet.absoluteFill,
//                 { backgroundColor: "rgba(96,165,250,0.1)" },
//               ]}
//               pointerEvents="none"
//             />
//           )}
//           {/* Drama overlay */}
//           {activeFilter === "drama" && (
//             <View
//               style={[
//                 StyleSheet.absoluteFill,
//                 { backgroundColor: "rgba(0,0,0,0.18)" },
//               ]}
//               pointerEvents="none"
//             />
//           )}
//           {/* Vintage overlay */}
//           {activeFilter === "vintage" && (
//             <View
//               style={[
//                 StyleSheet.absoluteFill,
//                 { backgroundColor: "rgba(180,120,60,0.18)" },
//               ]}
//               pointerEvents="none"
//             />
//           )}
//           {/* Text overlays */}
//           {textLayers.map((layer) => (
//             <DraggableText
//               key={layer.id}
//               layer={layer}
//               isActive={activeTextId === layer.id}
//               onActivate={() => setActiveTextId(layer.id)}
//               onMove={(x, y) =>
//                 setTextLayers((prev) =>
//                   prev.map((t) => (t.id === layer.id ? { ...t, x, y } : t)),
//                 )
//               }
//             />
//           ))}
//         </View>
//         {processing && (
//           <View style={styles.processingOverlay}>
//             <ActivityIndicator size="large" color="#F59E0B" />
//             <Text style={styles.processingText}>Processing…</Text>
//           </View>
//         )}
//       </View>

//       {/* ── Tab bar ── */}
//       <View style={styles.tabBar}>
//         {(["adjust", "filter", "crop", "text", "export"] as TabId[]).map(
//           (tab) => {
//             const icons: Record<TabId, string> = {
//               adjust: "options-outline",
//               filter: "sparkles-outline",
//               crop: "crop-outline",
//               text: "text-outline",
//               export: "share-outline",
//             };
//             const labels: Record<TabId, string> = {
//               adjust: "Adjust",
//               filter: "Filter",
//               crop: "Crop",
//               text: "Text",
//               export: "Export",
//             };
//             const active = activeTab === tab;
//             return (
//               <TouchableOpacity
//                 key={tab}
//                 style={styles.tabItem}
//                 onPress={() => setActiveTab(tab)}
//                 activeOpacity={0.75}
//               >
//                 <View
//                   style={[styles.tabIconWrap, active && styles.tabIconActive]}
//                 >
//                   <Ionicons
//                     name={icons[tab] as any}
//                     size={18}
//                     color={active ? "#F59E0B" : "#475569"}
//                   />
//                 </View>
//                 <Text
//                   style={[styles.tabLabel, active && styles.tabLabelActive]}
//                 >
//                   {labels[tab]}
//                 </Text>
//               </TouchableOpacity>
//             );
//           },
//         )}
//       </View>

//       {/* ── Panel ── */}
//       <View style={styles.panel}>{renderPanel()}</View>
//     </View>
//   );
// }

// // ─── Draggable Text ─────────────────────────────────────────────────────────────
// function DraggableText({
//   layer,
//   isActive,
//   onActivate,
//   onMove,
// }: {
//   layer: TextOverlay;
//   isActive: boolean;
//   onActivate: () => void;
//   onMove: (x: number, y: number) => void;
// }) {
//   const posRef = useRef({ x: layer.x, y: layer.y });

//   const panResponder = PanResponder.create({
//     onStartShouldSetPanResponder: () => true,
//     onPanResponderGrant: () => {
//       onActivate();
//     },
//     onPanResponderMove: (_, gs) => {
//       const nx = clamp(posRef.current.x + gs.dx, 0, SW - 10);
//       const ny = clamp(posRef.current.y + gs.dy, 0, PREVIEW_H - 10);
//       onMove(nx, ny);
//     },
//     onPanResponderRelease: (_, gs) => {
//       posRef.current = {
//         x: clamp(posRef.current.x + gs.dx, 0, SW - 10),
//         y: clamp(posRef.current.y + gs.dy, 0, PREVIEW_H - 10),
//       };
//     },
//   });

//   return (
//     <View
//       {...panResponder.panHandlers}
//       style={[
//         styles.textOverlay,
//         { left: layer.x, top: layer.y },
//         isActive && styles.textOverlayActive,
//       ]}
//     >
//       <Text
//         style={{
//           color: layer.color,
//           fontSize: layer.fontSize,
//           fontWeight: layer.bold ? "800" : "400",
//           textShadowColor: "rgba(0,0,0,0.8)",
//           textShadowOffset: { width: 0, height: 1 },
//           textShadowRadius: 4,
//         }}
//       >
//         {layer.text}
//       </Text>
//     </View>
//   );
// }

// // ─── Sub-panels ─────────────────────────────────────────────────────────────────
// function SectionLabel({ text }: { text: string }) {
//   return <Text style={sp.label}>{text}</Text>;
// }

// // ── Adjust Panel ──
// function AdjustPanel({
//   adjustments,
//   setAdjustments,
//   rotation,
//   setRotation,
//   flipH,
//   setFlipH,
//   flipV,
//   setFlipV,
// }: {
//   adjustments: Adjustments;
//   setAdjustments: (a: Adjustments) => void;
//   rotation: number;
//   setRotation: (r: number) => void;
//   flipH: boolean;
//   setFlipH: (v: boolean) => void;
//   flipV: boolean;
//   setFlipV: (v: boolean) => void;
// }) {
//   return (
//     <ScrollView
//       contentContainerStyle={sp.content}
//       showsVerticalScrollIndicator={false}
//     >
//       <SectionLabel text="TRANSFORM" />
//       <View style={sp.transformRow}>
//         {[
//           {
//             icon: "↺",
//             label: "Rotate L",
//             action: () => setRotation((rotation - 90 + 360) % 360),
//           },
//           {
//             icon: "↻",
//             label: "Rotate R",
//             action: () => setRotation((rotation + 90) % 360),
//           },
//           {
//             icon: "⟺",
//             label: "Flip H",
//             action: () => setFlipH(!flipH),
//             active: flipH,
//           },
//           {
//             icon: "⇕",
//             label: "Flip V",
//             action: () => setFlipV(!flipV),
//             active: flipV,
//           },
//         ].map((btn) => (
//           <TouchableOpacity
//             key={btn.label}
//             style={[
//               sp.transformBtn,
//               (btn as any).active && sp.transformBtnActive,
//             ]}
//             onPress={btn.action}
//             activeOpacity={0.8}
//           >
//             <Text
//               style={[sp.transformIcon, (btn as any).active && sp.activeAccent]}
//             >
//               {btn.icon}
//             </Text>
//             <Text
//               style={[
//                 sp.transformLabel,
//                 (btn as any).active && sp.activeAccent,
//               ]}
//             >
//               {btn.label}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <SectionLabel text="LIGHT & COLOR" />
//       {(["brightness", "contrast", "saturation"] as (keyof Adjustments)[]).map(
//         (key) => {
//           const labels = {
//             brightness: "Brightness",
//             contrast: "Contrast",
//             saturation: "Saturation",
//           };
//           const val = adjustments[key];
//           return (
//             <View key={key} style={sp.sliderRow}>
//               <View style={sp.sliderLabelRow}>
//                 <Text style={sp.sliderLabel}>{labels[key]}</Text>
//                 <Text style={sp.sliderVal}>
//                   {val > 0 ? "+" : ""}
//                   {Math.round(val * 100)}
//                 </Text>
//               </View>
//               <Slider
//                 style={sp.slider}
//                 minimumValue={-1}
//                 maximumValue={1}
//                 value={val}
//                 step={0.01}
//                 onValueChange={(v) =>
//                   setAdjustments({ ...adjustments, [key]: v })
//                 }
//                 minimumTrackTintColor="#F59E0B"
//                 maximumTrackTintColor="#1e293b"
//                 thumbTintColor="#F59E0B"
//               />
//             </View>
//           );
//         },
//       )}

//       <TouchableOpacity
//         style={sp.resetBtn}
//         onPress={() =>
//           setAdjustments({ brightness: 0, contrast: 0, saturation: 0 })
//         }
//       >
//         <Text style={sp.resetBtnText}>↩ Reset Adjustments</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }

// // ── Filter Panel ──
// function FilterPanel({
//   active,
//   onSelect,
//   imageUri,
// }: {
//   active: FilterId;
//   onSelect: (id: FilterId) => void;
//   imageUri: string | null;
// }) {
//   return (
//     <ScrollView
//       contentContainerStyle={sp.filterGrid}
//       showsVerticalScrollIndicator={false}
//     >
//       <View style={sp.filterRow}>
//         {FILTERS.map((f) => (
//           <TouchableOpacity
//             key={f.id}
//             style={[sp.filterThumb, active === f.id && sp.filterThumbActive]}
//             onPress={() => onSelect(f.id)}
//             activeOpacity={0.8}
//           >
//             {imageUri ? (
//               <Image
//                 source={{ uri: imageUri }}
//                 style={[
//                   sp.filterImg,
//                   {
//                     opacity:
//                       f.id === "fade" ? 0.8 : f.id === "matte" ? 0.88 : 1,
//                   },
//                 ]}
//                 resizeMode="cover"
//               />
//             ) : (
//               <View style={[sp.filterImg, { backgroundColor: "#1e293b" }]} />
//             )}
//             {f.id === "noir" && imageUri && (
//               <View
//                 style={[
//                   StyleSheet.absoluteFill,
//                   { backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 8 },
//                 ]}
//               />
//             )}
//             {f.id === "warm" && (
//               <View
//                 style={[
//                   StyleSheet.absoluteFill,
//                   { backgroundColor: "rgba(251,146,60,0.25)", borderRadius: 8 },
//                 ]}
//               />
//             )}
//             {f.id === "cool" && (
//               <View
//                 style={[
//                   StyleSheet.absoluteFill,
//                   { backgroundColor: "rgba(96,165,250,0.2)", borderRadius: 8 },
//                 ]}
//               />
//             )}
//             {f.id === "vintage" && (
//               <View
//                 style={[
//                   StyleSheet.absoluteFill,
//                   { backgroundColor: "rgba(180,120,60,0.3)", borderRadius: 8 },
//                 ]}
//               />
//             )}
//             {f.id === "drama" && (
//               <View
//                 style={[
//                   StyleSheet.absoluteFill,
//                   { backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 8 },
//                 ]}
//               />
//             )}
//             <Text
//               style={[sp.filterLabel, active === f.id && sp.filterLabelActive]}
//             >
//               {f.label}
//             </Text>
//             {active === f.id && <View style={sp.filterActiveDot} />}
//           </TouchableOpacity>
//         ))}
//       </View>
//     </ScrollView>
//   );
// }

// // ── Crop Panel ──
// function CropPanel({
//   cropAspect,
//   setCropAspect,
//   rotation,
//   setRotation,
//   onApply,
//   processing,
// }: {
//   cropAspect: AspectId;
//   setCropAspect: (a: AspectId) => void;
//   rotation: number;
//   setRotation: (r: number) => void;
//   onApply: () => void;
//   processing: boolean;
// }) {
//   return (
//     <ScrollView
//       contentContainerStyle={sp.content}
//       showsVerticalScrollIndicator={false}
//     >
//       <SectionLabel text="ASPECT RATIO" />
//       <View style={sp.aspectRow}>
//         {ASPECT_RATIOS.map((ar) => {
//           const active = cropAspect === ar.id;
//           return (
//             <TouchableOpacity
//               key={ar.id}
//               style={[sp.aspectBtn, active && sp.aspectBtnActive]}
//               onPress={() => setCropAspect(ar.id)}
//               activeOpacity={0.8}
//             >
//               <Text style={[sp.aspectLabel, active && sp.activeAccent]}>
//                 {ar.label}
//               </Text>
//             </TouchableOpacity>
//           );
//         })}
//       </View>

//       <SectionLabel text="ROTATION" />
//       <View style={sp.sliderRow}>
//         <View style={sp.sliderLabelRow}>
//           <Text style={sp.sliderLabel}>Angle</Text>
//           <Text style={sp.sliderVal}>{rotation}°</Text>
//         </View>
//         <Slider
//           style={sp.slider}
//           minimumValue={0}
//           maximumValue={360}
//           value={rotation}
//           step={1}
//           onValueChange={(v) => setRotation(Math.round(v))}
//           minimumTrackTintColor="#F59E0B"
//           maximumTrackTintColor="#1e293b"
//           thumbTintColor="#F59E0B"
//         />
//       </View>

//       <TouchableOpacity
//         style={[sp.applyBtn, processing && sp.applyBtnOff]}
//         onPress={onApply}
//         disabled={processing}
//         activeOpacity={0.85}
//       >
//         {processing ? (
//           <ActivityIndicator size="small" color="#000" />
//         ) : (
//           <Text style={sp.applyBtnText}>✓ Apply Transform</Text>
//         )}
//       </TouchableOpacity>

//       <View style={sp.infoBox}>
//         <Text style={sp.infoText}>
//           💡 Pinch to zoom the preview. Aspect ratio is applied on export.
//         </Text>
//       </View>
//     </ScrollView>
//   );
// }

// // ── Text Panel ──
// function TextPanel({
//   textDraft,
//   setTextDraft,
//   textColor,
//   setTextColor,
//   textSize,
//   setTextSize,
//   textBold,
//   setTextBold,
//   textLayers,
//   activeTextId,
//   setActiveTextId,
//   onAdd,
//   onRemove,
// }: {
//   textDraft: string;
//   setTextDraft: (s: string) => void;
//   textColor: string;
//   setTextColor: (c: string) => void;
//   textSize: number;
//   setTextSize: (n: number) => void;
//   textBold: boolean;
//   setTextBold: (v: boolean) => void;
//   textLayers: TextOverlay[];
//   activeTextId: string | null;
//   setActiveTextId: (id: string | null) => void;
//   onAdd: () => void;
//   onRemove: (id: string) => void;
// }) {
//   return (
//     <ScrollView
//       contentContainerStyle={sp.content}
//       keyboardShouldPersistTaps="handled"
//       showsVerticalScrollIndicator={false}
//     >
//       <View style={sp.inputRow}>
//         <TextInput
//           style={sp.textInput}
//           placeholder="Type overlay text…"
//           placeholderTextColor="#475569"
//           value={textDraft}
//           onChangeText={setTextDraft}
//           onSubmitEditing={onAdd}
//           returnKeyType="done"
//           selectionColor="#F59E0B"
//         />
//         <TouchableOpacity
//           style={[sp.addBtn, !textDraft.trim() && sp.addBtnOff]}
//           onPress={onAdd}
//           disabled={!textDraft.trim()}
//         >
//           <Text style={sp.addBtnText}>+</Text>
//         </TouchableOpacity>
//       </View>

//       <SectionLabel text="COLOR" />
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={sp.colorRow}
//       >
//         {TEXT_COLORS.map((c) => (
//           <TouchableOpacity
//             key={c}
//             style={[
//               sp.colorDot,
//               { backgroundColor: c },
//               textColor === c && sp.colorDotActive,
//             ]}
//             onPress={() => setTextColor(c)}
//           />
//         ))}
//       </ScrollView>

//       <SectionLabel text="SIZE" />
//       <View style={sp.sliderRow}>
//         <View style={sp.sliderLabelRow}>
//           <Text style={sp.sliderLabel}>Font Size</Text>
//           <Text style={sp.sliderVal}>{textSize}px</Text>
//         </View>
//         <Slider
//           style={sp.slider}
//           minimumValue={12}
//           maximumValue={96}
//           value={textSize}
//           step={1}
//           onValueChange={(v) => setTextSize(Math.round(v))}
//           minimumTrackTintColor="#F59E0B"
//           maximumTrackTintColor="#1e293b"
//           thumbTintColor="#F59E0B"
//         />
//       </View>

//       <SectionLabel text="STYLE" />
//       <TouchableOpacity
//         style={[sp.boldBtn, textBold && sp.boldBtnActive]}
//         onPress={() => setTextBold(!textBold)}
//       >
//         <Text style={[sp.boldBtnText, textBold && sp.activeAccent]}>
//           B Bold
//         </Text>
//       </TouchableOpacity>

//       {textLayers.length > 0 && (
//         <>
//           <SectionLabel text={`LAYERS (${textLayers.length})`} />
//           {textLayers.map((layer) => (
//             <View
//               key={layer.id}
//               style={[
//                 sp.layerRow,
//                 activeTextId === layer.id && sp.layerRowActive,
//               ]}
//             >
//               <TouchableOpacity
//                 style={sp.layerLeft}
//                 onPress={() => setActiveTextId(layer.id)}
//               >
//                 <View style={[sp.layerDot, { backgroundColor: layer.color }]} />
//                 <Text style={sp.layerTxt} numberOfLines={1}>
//                   {layer.text}
//                 </Text>
//                 <Text style={sp.layerMeta}>{layer.fontSize}px</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 onPress={() => onRemove(layer.id)}
//                 hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
//               >
//                 <Ionicons name="trash-outline" size={16} color="#ef4444" />
//               </TouchableOpacity>
//             </View>
//           ))}
//         </>
//       )}
//     </ScrollView>
//   );
// }

// // ── Export Panel ──
// function ExportPanel({
//   format,
//   setFormat,
//   quality,
//   setQuality,
//   onSave,
//   onShare,
//   processing,
//   imgWidth,
//   imgHeight,
// }: {
//   format: ExportFormat;
//   setFormat: (f: ExportFormat) => void;
//   quality: number;
//   setQuality: (q: number) => void;
//   onSave: () => void;
//   onShare: () => void;
//   processing: boolean;
//   imgWidth: number;
//   imgHeight: number;
// }) {
//   return (
//     <ScrollView
//       contentContainerStyle={sp.content}
//       showsVerticalScrollIndicator={false}
//     >
//       <SectionLabel text="FORMAT" />
//       <View style={sp.fmtRow}>
//         {(["jpeg", "png", "webp"] as ExportFormat[]).map((f) => (
//           <TouchableOpacity
//             key={f}
//             style={[sp.fmtBtn, format === f && sp.fmtBtnActive]}
//             onPress={() => setFormat(f)}
//           >
//             <Text style={[sp.fmtBtnTxt, format === f && sp.activeAccent]}>
//               {f.toUpperCase()}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <SectionLabel text="QUALITY" />
//       <View style={sp.sliderRow}>
//         <View style={sp.sliderLabelRow}>
//           <Text style={sp.sliderLabel}>Compression</Text>
//           <Text style={sp.sliderVal}>{quality}%</Text>
//         </View>
//         <Slider
//           style={sp.slider}
//           minimumValue={10}
//           maximumValue={100}
//           value={quality}
//           step={1}
//           onValueChange={(v) => setQuality(Math.round(v))}
//           minimumTrackTintColor="#F59E0B"
//           maximumTrackTintColor="#1e293b"
//           thumbTintColor="#F59E0B"
//         />
//       </View>

//       <View style={sp.infoBox}>
//         <Text style={sp.infoBoxTitle}>Output</Text>
//         <Text style={sp.infoText}>
//           {imgWidth} × {imgHeight}px · {format.toUpperCase()} · {quality}%
//           quality
//         </Text>
//       </View>

//       <TouchableOpacity
//         style={[sp.applyBtn, processing && sp.applyBtnOff]}
//         onPress={onSave}
//         disabled={processing}
//         activeOpacity={0.85}
//       >
//         {processing ? (
//           <ActivityIndicator size="small" color="#000" />
//         ) : (
//           <>
//             <Ionicons name="download-outline" size={18} color="#000" />
//             <Text style={sp.applyBtnText}> Save to Gallery</Text>
//           </>
//         )}
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={sp.shareBtn}
//         onPress={onShare}
//         activeOpacity={0.85}
//       >
//         <Ionicons name="share-outline" size={18} color="#F59E0B" />
//         <Text style={sp.shareBtnText}> Share Image</Text>
//       </TouchableOpacity>

//       <SectionLabel text="SHARE TO" />
//       <View style={sp.socialRow}>
//         {[
//           { label: "Instagram", icon: "logo-instagram" },
//           { label: "Twitter", icon: "logo-twitter" },
//           { label: "WhatsApp", icon: "logo-whatsapp" },
//         ].map((s) => (
//           <TouchableOpacity
//             key={s.label}
//             style={sp.socialBtn}
//             onPress={onShare}
//           >
//             <Ionicons name={s.icon as any} size={20} color="#94a3b8" />
//             <Text style={sp.socialLabel}>{s.label}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>
//     </ScrollView>
//   );
// }

// // ─── Styles ────────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   root: { flex: 1, backgroundColor: "#000105" },

//   // Empty / picker state
//   empty: {
//     flex: 1,
//     backgroundColor: "#000105",
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 32,
//     gap: 14,
//   },
//   emptyIcon: { fontSize: 52 },
//   emptyTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
//   emptySubtitle: {
//     fontSize: 14,
//     color: "#475569",
//     textAlign: "center",
//     lineHeight: 20,
//   },
//   pickBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     backgroundColor: "#F59E0B",
//     borderRadius: 12,
//     paddingHorizontal: 24,
//     paddingVertical: 13,
//     marginTop: 8,
//   },
//   pickBtnText: { color: "#000", fontSize: 15, fontWeight: "700" },
//   cameraBtn: {
//     backgroundColor: "transparent",
//     borderWidth: 1.5,
//     borderColor: "#F59E0B",
//   },

//   // Top bar
//   topBar: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     backgroundColor: "#0d0d1a",
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "#1e293b",
//   },
//   tbBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 8,
//     backgroundColor: "#0f172a",
//     borderWidth: 1,
//     borderColor: "#1e293b",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   tbBtnOff: { opacity: 0.3 },
//   tbActions: { flexDirection: "row", gap: 8 },
//   saveBtn: {
//     backgroundColor: "#F59E0B",
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//   },
//   saveBtnText: { color: "#000", fontSize: 13, fontWeight: "800" },

//   // Canvas
//   canvas: {
//     backgroundColor: "#050510",
//     alignItems: "center",
//     justifyContent: "center",
//     position: "relative",
//     overflow: "hidden",
//   },
//   processingOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "rgba(0,0,0,0.7)",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 12,
//   },
//   processingText: { color: "#F59E0B", fontSize: 14, fontWeight: "600" },

//   // Tab bar
//   tabBar: {
//     flexDirection: "row",
//     backgroundColor: "#0d0d1a",
//     borderTopWidth: 1,
//     borderTopColor: "#1e293b",
//     paddingVertical: 6,
//   },
//   tabItem: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 2 },
//   tabIconWrap: {
//     width: 34,
//     height: 28,
//     borderRadius: 7,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   tabIconActive: { backgroundColor: "rgba(245,158,11,0.15)" },
//   tabLabel: { fontSize: 9, color: "#475569", fontWeight: "500" },
//   tabLabelActive: { color: "#F59E0B" },

//   // Panel
//   panel: { flex: 1, backgroundColor: "#0d0d1a" },

//   // Text overlay
//   textOverlay: { position: "absolute" },
//   textOverlayActive: {
//     borderWidth: 1,
//     borderColor: "#F59E0B",
//     borderStyle: "dashed",
//     padding: 4,
//     borderRadius: 4,
//   },
// });

// // Sub-panel shared styles
// const sp = StyleSheet.create({
//   content: { padding: 16, paddingBottom: 24 },
//   label: {
//     fontSize: 10,
//     fontWeight: "700",
//     color: "#475569",
//     letterSpacing: 1,
//     marginBottom: 8,
//     marginTop: 12,
//     textTransform: "uppercase",
//   },

//   // Transform
//   transformRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
//   transformBtn: {
//     flex: 1,
//     alignItems: "center",
//     backgroundColor: "#0f172a",
//     borderWidth: 1,
//     borderColor: "#1e293b",
//     borderRadius: 10,
//     paddingVertical: 10,
//     gap: 2,
//   },
//   transformBtnActive: {
//     backgroundColor: "rgba(245,158,11,0.12)",
//     borderColor: "#F59E0B",
//   },
//   transformIcon: { fontSize: 16, color: "#64748b" },
//   transformLabel: { fontSize: 9, color: "#475569", fontWeight: "500" },
//   activeAccent: { color: "#F59E0B" },

//   // Sliders
//   sliderRow: { marginBottom: 10 },
//   sliderLabelRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 2,
//   },
//   sliderLabel: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
//   sliderVal: {
//     fontSize: 11,
//     color: "#F59E0B",
//     fontWeight: "700",
//     fontVariant: ["tabular-nums"],
//   },
//   slider: { width: "100%", height: 28 },

//   resetBtn: {
//     backgroundColor: "#0f172a",
//     borderWidth: 1,
//     borderColor: "#1e293b",
//     borderRadius: 10,
//     paddingVertical: 12,
//     alignItems: "center",
//     marginTop: 8,
//   },
//   resetBtnText: { fontSize: 13, color: "#64748b", fontWeight: "600" },

//   // Filter
//   filterGrid: { padding: 12 },
//   filterRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 8,
//     justifyContent: "flex-start",
//   },
//   filterThumb: {
//     width: (SW - 24 - 16) / 3 - 3,
//     borderRadius: 10,
//     overflow: "hidden",
//     borderWidth: 2,
//     borderColor: "transparent",
//     position: "relative",
//   },
//   filterThumbActive: { borderColor: "#F59E0B" },
//   filterImg: {
//     width: "100%",
//     height: 64,
//     borderRadius: 8,
//   },
//   filterLabel: {
//     position: "absolute",
//     bottom: 4,
//     left: 0,
//     right: 0,
//     textAlign: "center",
//     fontSize: 9,
//     color: "rgba(255,255,255,0.9)",
//     fontWeight: "700",
//     textShadowColor: "rgba(0,0,0,0.9)",
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },
//   filterLabelActive: { color: "#F59E0B" },
//   filterActiveDot: {
//     position: "absolute",
//     top: 5,
//     right: 5,
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: "#F59E0B",
//   },

//   // Crop
//   aspectRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 8,
//     marginBottom: 4,
//   },
//   aspectBtn: {
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     backgroundColor: "#0f172a",
//     borderWidth: 1,
//     borderColor: "#1e293b",
//     borderRadius: 8,
//   },
//   aspectBtnActive: {
//     backgroundColor: "rgba(245,158,11,0.12)",
//     borderColor: "#F59E0B",
//   },
//   aspectLabel: { fontSize: 12, color: "#64748b", fontWeight: "600" },

//   applyBtn: {
//     backgroundColor: "#F59E0B",
//     borderRadius: 12,
//     paddingVertical: 13,
//     alignItems: "center",
//     justifyContent: "center",
//     flexDirection: "row",
//     marginTop: 12,
//   },
//   applyBtnOff: { opacity: 0.4 },
//   applyBtnText: { color: "#000", fontSize: 14, fontWeight: "800" },

//   infoBox: {
//     backgroundColor: "#0f172a",
//     borderRadius: 10,
//     padding: 12,
//     borderWidth: 1,
//     borderColor: "#1e293b",
//     marginTop: 10,
//   },
//   infoBoxTitle: {
//     fontSize: 11,
//     color: "#F59E0B",
//     fontWeight: "700",
//     marginBottom: 4,
//   },
//   infoText: { fontSize: 12, color: "#475569", lineHeight: 18 },

//   // Text
//   inputRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
//   textInput: {
//     flex: 1,
//     backgroundColor: "#0f172a",
//     borderWidth: 1,
//     borderColor: "#1e293b",
//     borderRadius: 10,
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     color: "#f0eee8",
//     fontSize: 14,
//   },
//   addBtn: {
//     width: 44,
//     height: 44,
//     backgroundColor: "#F59E0B",
//     borderRadius: 10,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   addBtnOff: { opacity: 0.3 },
//   addBtnText: {
//     fontSize: 26,
//     color: "#000",
//     fontWeight: "900",
//     lineHeight: 30,
//   },

//   colorRow: { flexDirection: "row", gap: 10, paddingBottom: 4 },
//   colorDot: {
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     borderWidth: 2,
//     borderColor: "transparent",
//   },
//   colorDotActive: { borderColor: "#F59E0B", transform: [{ scale: 1.2 }] },

//   boldBtn: {
//     backgroundColor: "#0f172a",
//     borderWidth: 1,
//     borderColor: "#1e293b",
//     borderRadius: 10,
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//   },
//   boldBtnActive: {
//     backgroundColor: "rgba(245,158,11,0.12)",
//     borderColor: "#F59E0B",
//   },
//   boldBtnText: { fontSize: 14, color: "#64748b", fontWeight: "600" },

//   layerRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#0f172a",
//     borderWidth: 1,
//     borderColor: "#1e293b",
//     borderRadius: 10,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     marginBottom: 8,
//   },
//   layerRowActive: {
//     borderColor: "#F59E0B",
//     backgroundColor: "rgba(245,158,11,0.08)",
//   },
//   layerLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
//   layerDot: { width: 12, height: 12, borderRadius: 6 },
//   layerTxt: { flex: 1, fontSize: 13, color: "#94a3b8" },
//   layerMeta: { fontSize: 11, color: "#475569" },

//   // Export
//   fmtRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
//   fmtBtn: {
//     flex: 1,
//     alignItems: "center",
//     backgroundColor: "#0f172a",
//     borderWidth: 1,
//     borderColor: "#1e293b",
//     borderRadius: 10,
//     paddingVertical: 10,
//   },
//   fmtBtnActive: {
//     backgroundColor: "rgba(245,158,11,0.12)",
//     borderColor: "#F59E0B",
//   },
//   fmtBtnTxt: { fontSize: 13, color: "#64748b", fontWeight: "700" },

//   shareBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "transparent",
//     borderWidth: 1.5,
//     borderColor: "#F59E0B",
//     borderRadius: 12,
//     paddingVertical: 12,
//     marginTop: 10,
//   },
//   shareBtnText: { color: "#F59E0B", fontSize: 14, fontWeight: "700" },

//   socialRow: { flexDirection: "row", gap: 8 },
//   socialBtn: {
//     flex: 1,
//     alignItems: "center",
//     backgroundColor: "#0f172a",
//     borderWidth: 1,
//     borderColor: "#1e293b",
//     borderRadius: 10,
//     paddingVertical: 12,
//     gap: 4,
//   },
//   socialLabel: { fontSize: 10, color: "#475569", fontWeight: "600" },
// });

import { View, Text } from "react-native";
import React from "react";
import ComingSoon from "../../../../component/CoomingSoon";

const ImageEditor = () => {
  return (
    <View>
      <ComingSoon />
    </View>
  );
};

export default ImageEditor;
