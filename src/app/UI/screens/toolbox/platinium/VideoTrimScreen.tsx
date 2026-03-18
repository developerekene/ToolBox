// import { View, Text } from "react-native";
// import React from "react";

// const VideoTrimScreen = () => {
//   return (
//     <View>
//       <Text>VideoTrimScreen</Text>
//     </View>
//   );
// };

// export default VideoTrimScreen;

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
  Platform,
  PanResponder,
} from "react-native";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { FFmpegKit, ReturnCode } from "ffmpeg-kit-react-native";

const { width } = Dimensions.get("window");
const TRIM_BAR_WIDTH = width - 48;

// ── Safe writable temp path — no expo-file-system needed ──
const getTempOutputPath = (): string => {
  const filename = `trimmed_${Date.now()}.mp4`;
  if (Platform.OS === "ios") {
    return `${Platform.select({ ios: "/tmp" })}/${filename}`;
  }
  return `/data/data/com.devekene.DroidOne/cache/${filename}`;
};

type TrimMode = "idle" | "preview" | "trimming" | "done";

type VideoInfo = {
  uri: string;
  duration: number;
  filename: string;
};

// ── Replaces String.padStart (not available in older TS targets) ──
const pad2 = (n: number): string => (n < 10 ? "0" + n : "" + n);

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${m}:${pad2(s)}.${ms}`;
};

const VideoTrimScreen: React.FC = () => {
  const [mode, setMode] = useState<TrimMode>("idle");
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [trimmedUri, setTrimmedUri] = useState<string | null>(null);

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPos, setPlaybackPos] = useState(0);
  const videoRef = useRef<Video>(null);
  const trimmedVideoRef = useRef<Video>(null);

  const [startHandleX, setStartHandleX] = useState(0);
  const [endHandleX, setEndHandleX] = useState(TRIM_BAR_WIDTH);
  const startRatio = useRef(0);
  const endRatio = useRef(1);

  const [isSaving, setIsSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  // ── Pick video ──
  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const durationSec = (asset.duration ?? 0) / 1000;
      const info: VideoInfo = {
        uri: asset.uri,
        duration: durationSec,
        filename: asset.fileName ?? `video_${Date.now()}.mp4`,
      };
      setVideo(info);
      setStartTime(0);
      setEndTime(durationSec);
      setStartHandleX(0);
      setEndHandleX(TRIM_BAR_WIDTH);
      startRatio.current = 0;
      endRatio.current = 1;
      setTrimmedUri(null);
      setIsPlaying(false);
      setPlaybackPos(0);
      setMode("preview");
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  };

  // ── Pan responders for trim handles ──
  const makeHandlePanResponder = (handle: "start" | "end") =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        if (!video) return;
        if (handle === "start") {
          const newX = Math.max(
            0,
            Math.min(startHandleX + gs.dx, endHandleX - 20),
          );
          setStartHandleX(newX);
          startRatio.current = newX / TRIM_BAR_WIDTH;
          setStartTime((newX / TRIM_BAR_WIDTH) * video.duration);
        } else {
          const newX = Math.max(
            startHandleX + 20,
            Math.min(endHandleX + gs.dx, TRIM_BAR_WIDTH),
          );
          setEndHandleX(newX);
          endRatio.current = newX / TRIM_BAR_WIDTH;
          setEndTime((newX / TRIM_BAR_WIDTH) * video.duration);
        }
      },
      onPanResponderRelease: () => {
        videoRef.current?.setPositionAsync(startTime * 1000);
      },
    });

  const startHandlePan = useRef(makeHandlePanResponder("start")).current;
  const endHandlePan = useRef(makeHandlePanResponder("end")).current;

  // ── Playback ──
  const onPlaybackUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded || !video) return;
    const posSec = (status.positionMillis ?? 0) / 1000;
    setPlaybackPos(posSec);
    if (isPlaying && posSec >= endTime) {
      videoRef.current?.setPositionAsync(startTime * 1000);
    }
  };

  const togglePlay = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.setPositionAsync(startTime * 1000);
      await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  // ── Trim using FFmpeg ──
  const trimVideo = async () => {
    if (!video) return;
    setMode("trimming");

    const outputPath = getTempOutputPath();
    const duration = endTime - startTime;
    const command = `-y -ss ${startTime.toFixed(3)} -i "${video.uri}" -t ${duration.toFixed(3)} -c:v copy -c:a copy "${outputPath}"`;

    try {
      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        setTrimmedUri(outputPath);
        setMode("done");
        fadeAnim.setValue(0);
        fadeIn();
      } else {
        const logs = await session.getAllLogsAsString();
        console.error("FFmpeg failed:", logs);
        Alert.alert(
          "Trim Failed",
          "Could not trim the video. Please try again.",
        );
        setMode("preview");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong during trimming.");
      setMode("preview");
    }
  };

  // ── Save to gallery ──
  const saveToGallery = async () => {
    if (!trimmedUri) return;
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
      const asset = await MediaLibrary.createAssetAsync(trimmedUri);
      await MediaLibrary.createAlbumAsync("D'roid One", asset, false);
      Alert.alert(
        "✅ Saved!",
        "Trimmed video saved to your gallery in the 'D'roid One' album.",
      );
    } catch (err) {
      Alert.alert("Save Failed", "Could not save video to gallery.");
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    setMode("idle");
    setVideo(null);
    setTrimmedUri(null);
    setIsPlaying(false);
    fadeAnim.setValue(0);
  };

  const trimDuration = endTime - startTime;
  const playbackRatio = video ? Math.min(playbackPos / video.duration, 1) : 0;

  // ════════════════════════════════════════
  // IDLE
  // ════════════════════════════════════════
  if (mode === "idle") {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.idleContent}
      >
        <View style={styles.heroSection}>
          <View style={styles.heroRingOuter}>
            <View style={styles.heroRingInner}>
              <FontAwesome5 name="film" size={36} color="#EF4444" />
            </View>
          </View>
          <Text style={styles.heroTitle}>Video Trimmer</Text>
          <Text style={styles.heroSubtitle}>
            Cut and trim your videos with{"\n"}precision frame controls
          </Text>
        </View>

        <TouchableOpacity style={styles.uploadBtn} onPress={pickVideo}>
          <View style={styles.uploadIconWrap}>
            <Ionicons name="cloud-upload-outline" size={36} color="#EF4444" />
          </View>
          <Text style={styles.uploadBtnTitle}>Upload Video</Text>
          <Text style={styles.uploadBtnSub}>MP4, MOV, AVI supported</Text>
        </TouchableOpacity>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={14} color="#EF4444" />
            {"  "}How it works
          </Text>
          {[
            "Select a video from your gallery",
            "Drag the trim handles to set start & end",
            "Preview your trimmed clip in real-time",
            "Export and save to your gallery",
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.tipDot, { backgroundColor: "#EF4444" }]} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="flash" size={18} color="#F59E0B" />
            <Text style={styles.infoText}>
              Powered by FFmpeg — fast, lossless trimming
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={18} color="#10B981" />
            <Text style={styles.infoText}>
              All processing done locally on device
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ════════════════════════════════════════
  // TRIMMING
  // ════════════════════════════════════════
  if (mode === "trimming") {
    return (
      <View style={styles.processingContainer}>
        <View style={styles.processingRing}>
          <ActivityIndicator size="large" color="#EF4444" />
        </View>
        <Text style={styles.processingTitle}>Trimming Video…</Text>
        <Text style={styles.processingSubtitle}>
          {formatTime(startTime)} → {formatTime(endTime)} (
          {formatTime(trimDuration)})
        </Text>
        <View style={styles.processingSteps}>
          {[
            "Reading video stream",
            "Cutting to selection",
            "Encoding output",
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

  // ════════════════════════════════════════
  // DONE
  // ════════════════════════════════════════
  if (mode === "done" && trimmedUri) {
    return (
      <Animated.ScrollView
        style={[styles.container, { opacity: fadeAnim }]}
        contentContainerStyle={styles.doneContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.doneHeader}>
          <View style={styles.doneBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.doneBadgeText}>Trim Complete</Text>
          </View>
        </View>

        <View style={styles.videoPlayerWrap}>
          <Video
            ref={trimmedVideoRef}
            source={{ uri: trimmedUri }}
            style={styles.videoPlayer}
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            useNativeControls
          />
        </View>

        <View style={styles.statsGrid}>
          {[
            { label: "Start", value: formatTime(startTime) },
            { label: "End", value: formatTime(endTime) },
            { label: "Duration", value: formatTime(trimDuration) },
            { label: "Original", value: formatTime(video?.duration ?? 0) },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.resetBtn} onPress={reset}>
            <Ionicons name="arrow-back" size={18} color="#64748b" />
            <Text style={styles.resetBtnText}>New</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.retrimBtn}
            onPress={() => setMode("preview")}
          >
            <Ionicons name="cut-outline" size={18} color="#fff" />
            <Text style={styles.retrimBtnText}>Re-trim</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
            onPress={saveToGallery}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    );
  }

  // ════════════════════════════════════════
  // PREVIEW — trim controls
  // ════════════════════════════════════════
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.previewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.videoPlayerWrap}>
          {video && (
            <Video
              ref={videoRef}
              source={{ uri: video.uri }}
              style={styles.videoPlayer}
              resizeMode={ResizeMode.CONTAIN}
              onPlaybackStatusUpdate={onPlaybackUpdate}
            />
          )}
          <TouchableOpacity style={styles.playOverlay} onPress={togglePlay}>
            <View style={styles.playBtn}>
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={28}
                color="#fff"
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(playbackPos)}</Text>
          <Text style={styles.timeDivider}>/</Text>
          <Text style={styles.timeTextTotal}>
            {formatTime(video?.duration ?? 0)}
          </Text>
        </View>

        {/* Trim Bar */}
        <View style={styles.trimSection}>
          <Text style={styles.trimSectionLabel}>Trim Selection</Text>
          <View style={styles.trimBarContainer}>
            <View style={styles.trimTrack} />
            <View
              style={[
                styles.trimSelection,
                { left: startHandleX, width: endHandleX - startHandleX },
              ]}
            />
            <View
              style={[
                styles.playbackCursor,
                { left: playbackRatio * TRIM_BAR_WIDTH - 1 },
              ]}
            />
            <View
              style={[styles.trimHandle, { left: startHandleX - 12 }]}
              {...startHandlePan.panHandlers}
            >
              <View style={styles.handleBar} />
              <Text style={styles.handleLabel}>▶</Text>
            </View>
            <View
              style={[styles.trimHandle, { left: endHandleX - 12 }]}
              {...endHandlePan.panHandlers}
            >
              <View style={styles.handleBar} />
              <Text style={styles.handleLabel}>◀</Text>
            </View>
          </View>

          <View style={styles.trimTimestamps}>
            <View style={styles.timestampBox}>
              <Text style={styles.timestampLabel}>Start</Text>
              <Text style={styles.timestampValue}>{formatTime(startTime)}</Text>
            </View>
            <View style={styles.durationPill}>
              <Ionicons name="time-outline" size={13} color="#EF4444" />
              <Text style={styles.durationText}>
                {formatTime(trimDuration)}
              </Text>
            </View>
            <View style={styles.timestampBox}>
              <Text style={styles.timestampLabel}>End</Text>
              <Text style={styles.timestampValue}>{formatTime(endTime)}</Text>
            </View>
          </View>
        </View>

        {/* Quick Trim Presets */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quick Trim</Text>
          <View style={styles.quickTrimRow}>
            {[
              { label: "First 15s", start: 0, end: 15 },
              { label: "First 30s", start: 0, end: 30 },
              { label: "First 60s", start: 0, end: 60 },
              { label: "Reset", start: 0, end: video?.duration ?? 0 },
            ].map((preset) => (
              <TouchableOpacity
                key={preset.label}
                style={styles.quickTrimBtn}
                onPress={() => {
                  if (!video) return;
                  const s = preset.start;
                  const e = Math.min(preset.end, video.duration);
                  setStartTime(s);
                  setEndTime(e);
                  setStartHandleX((s / video.duration) * TRIM_BAR_WIDTH);
                  setEndHandleX((e / video.duration) * TRIM_BAR_WIDTH);
                  startRatio.current = s / video.duration;
                  endRatio.current = e / video.duration;
                }}
              >
                <Text style={styles.quickTrimText}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.resetBtn} onPress={reset}>
            <Ionicons name="arrow-back" size={18} color="#64748b" />
            <Text style={styles.resetBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.trimBtn} onPress={trimVideo}>
            <MaterialIcons name="content-cut" size={20} color="#fff" />
            <Text style={styles.trimBtnText}>Trim Video</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

// ─── STYLES ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101828" },
  idleContent: { padding: 20, paddingBottom: 40 },
  doneContent: { padding: 20, paddingBottom: 40 },
  previewContent: { padding: 20, paddingBottom: 40 },

  heroSection: { alignItems: "center", paddingTop: 30, paddingBottom: 32 },
  heroRingOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#EF444444",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  heroRingInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#EF444418",
    borderWidth: 2,
    borderColor: "#EF444488",
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

  uploadBtn: {
    backgroundColor: "#1a2235",
    borderRadius: 18,
    padding: 32,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#EF444433",
    borderStyle: "dashed",
    marginBottom: 24,
  },
  uploadIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EF444418",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  uploadBtnTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
    marginBottom: 4,
  },
  uploadBtnSub: { color: "#64748b", fontSize: 13 },

  tipsCard: {
    backgroundColor: "#1a2235",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#EF444422",
    marginBottom: 16,
  },
  tipsHeader: {
    color: "#EF4444",
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 12,
  },
  tipRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  tipDot: { width: 5, height: 5, borderRadius: 3, marginRight: 10 },
  tipText: { color: "#94a3b8", fontSize: 13, lineHeight: 18, flex: 1 },

  infoCard: {
    backgroundColor: "#1a2235",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#334155",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  infoText: { color: "#94a3b8", fontSize: 13, flex: 1 },

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
    backgroundColor: "#EF444418",
    borderWidth: 2,
    borderColor: "#EF444466",
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
    textAlign: "center",
  },
  processingSteps: {
    gap: 12,
    alignSelf: "stretch",
    backgroundColor: "#1a2235",
    borderRadius: 14,
    padding: 18,
  },
  processingStep: { flexDirection: "row", alignItems: "center", gap: 10 },
  processingStepText: { color: "#94a3b8", fontSize: 14 },

  videoPlayerWrap: {
    width: "100%",
    height: 220,
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    position: "relative",
  },
  videoPlayer: { width: "100%", height: "100%" },
  playOverlay: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    left: "50%",
    transform: [{ translateX: -24 }],
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 20,
  },
  timeText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  timeDivider: { color: "#334155", fontSize: 15 },
  timeTextTotal: { color: "#64748b", fontSize: 15 },

  trimSection: { marginBottom: 24 },
  trimSectionLabel: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  trimBarContainer: {
    height: 48,
    width: TRIM_BAR_WIDTH,
    position: "relative",
    justifyContent: "center",
    marginBottom: 12,
  },
  trimTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: "#1E293B",
    borderRadius: 3,
  },
  trimSelection: {
    position: "absolute",
    height: 6,
    backgroundColor: "#EF4444",
    borderRadius: 3,
  },
  playbackCursor: {
    position: "absolute",
    width: 2,
    height: 28,
    backgroundColor: "#fff",
    borderRadius: 1,
    top: 10,
  },
  trimHandle: {
    position: "absolute",
    width: 24,
    height: 48,
    backgroundColor: "#EF4444",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    top: 0,
    zIndex: 10,
    gap: 2,
  },
  handleBar: { width: 3, height: 16, backgroundColor: "#fff", borderRadius: 2 },
  handleLabel: { color: "#fff", fontSize: 8 },

  trimTimestamps: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timestampBox: { alignItems: "center", gap: 2 },
  timestampLabel: {
    color: "#64748b",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  timestampValue: { color: "#fff", fontWeight: "800", fontSize: 14 },
  durationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EF444418",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EF444433",
  },
  durationText: { color: "#EF4444", fontWeight: "700", fontSize: 13 },

  section: { marginBottom: 24 },
  sectionLabel: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  quickTrimRow: { flexDirection: "row", gap: 8 },
  quickTrimBtn: {
    flex: 1,
    backgroundColor: "#1a2235",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  quickTrimText: { color: "#94a3b8", fontSize: 12, fontWeight: "600" },

  doneHeader: { alignItems: "center", marginBottom: 20 },
  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#10B98118",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#10B98133",
  },
  doneBadgeText: { color: "#10B981", fontWeight: "700", fontSize: 15 },

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
  statLabel: { color: "#64748b", fontSize: 12 },

  bottomActions: { flexDirection: "row", gap: 10, marginTop: 4 },
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
  resetBtnText: { color: "#64748b", fontWeight: "700", fontSize: 14 },
  trimBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#EF4444",
  },
  trimBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  retrimBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#334155",
  },
  retrimBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#EF4444",
  },
  saveBtnText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});

export default VideoTrimScreen;
