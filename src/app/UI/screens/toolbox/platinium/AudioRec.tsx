import React, { useState, useRef, useEffect } from "react";
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
  Dimensions,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Audio, AVPlaybackStatus } from "expo-av";
import * as MediaLibrary from "expo-media-library";

const { width } = Dimensions.get("window");

// ── Helpers ──────────────────────────────────────────────────────
const pad2 = (n: number): string => (n < 10 ? "0" + n : "" + n);

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${pad2(m)}:${pad2(s)}`;
};

const formatShort = (ms: number): string => formatDuration(ms / 1000);

const generateWaveform = (count: number): number[] => {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    bars.push(Math.random() * 0.8 + 0.2);
  }
  return bars;
};

// ── Types ─────────────────────────────────────────────────────────
type RecordingState = "idle" | "recording" | "paused" | "stopped";

interface RecordingEntry {
  id: string;
  uri: string;
  name: string;
  durationMs: number;
  createdAt: Date;
  waveform: number[];
}

// ── Constants ─────────────────────────────────────────────────────
const WAVEFORM_BARS = 40;
const BAR_WIDTH = (width - 80) / WAVEFORM_BARS - 2;

const AudioRec: React.FC = () => {
  // Recording state
  const [recState, setRecState] = useState<RecordingState>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [recordings, setRecordings] = useState<RecordingEntry[]>([]);

  // Playback
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackMs, setPlaybackMs] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef(
    Array.from({ length: WAVEFORM_BARS }, () => new Animated.Value(0.15)),
  ).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    return () => {
      stopTimer();
      stopWaveAnimation();
    };
  }, []);

  // ── Pulse animation for record button ──
  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // ── Waveform animation ──
  const startWaveAnimation = () => {
    const animate = () => {
      const anims = waveAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: Math.random() * 0.85 + 0.15,
          duration: 150 + Math.random() * 200,
          useNativeDriver: false,
        }),
      );
      Animated.parallel(anims).start(() => {
        if (recState === "recording") animate();
      });
    };
    animate();
  };

  const stopWaveAnimation = () => {
    waveAnims.forEach((anim) =>
      Animated.timing(anim, {
        toValue: 0.15,
        duration: 300,
        useNativeDriver: false,
      }).start(),
    );
  };

  // ── Timer ──
  const startTimer = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(
        accumulatedRef.current + (Date.now() - startTimeRef.current),
      );
    }, 100);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ── Request permissions ──
  const ensurePermissions = async (): Promise<boolean> => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Microphone access is needed to record audio.",
      );
      return false;
    }
    return true;
  };

  // ── Start recording ──
  const startRecording = async () => {
    const ok = await ensurePermissions();
    if (!ok) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      recordingRef.current = recording;
      accumulatedRef.current = 0;
      setElapsedMs(0);
      setRecState("recording");
      startTimer();
      startPulse();
      startWaveAnimation();
    } catch (err) {
      Alert.alert("Error", "Could not start recording.");
      console.error(err);
    }
  };

  // ── Pause recording ──
  const pauseRecording = async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.pauseAsync();
      accumulatedRef.current = elapsedMs;
      stopTimer();
      stopPulse();
      stopWaveAnimation();
      setRecState("paused");
    } catch (err) {
      console.error(err);
    }
  };

  // ── Resume recording ──
  const resumeRecording = async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.startAsync();
      setRecState("recording");
      startTimer();
      startPulse();
      startWaveAnimation();
    } catch (err) {
      console.error(err);
    }
  };

  // ── Stop recording ──
  const stopRecording = async () => {
    if (!recordingRef.current) return;
    stopTimer();
    stopPulse();
    stopWaveAnimation();

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const status = await recordingRef.current.getStatusAsync();
      const durationMs = (status as any).durationMillis ?? elapsedMs;

      if (uri) {
        const entry: RecordingEntry = {
          id: Date.now().toString(),
          uri,
          name: `Recording ${recordings.length + 1}`,
          durationMs,
          createdAt: new Date(),
          waveform: generateWaveform(WAVEFORM_BARS),
        };
        setRecordings((prev) => [entry, ...prev]);
      }

      recordingRef.current = null;
      accumulatedRef.current = 0;
      setElapsedMs(0);
      setRecState("idle");

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not stop recording.");
    }
  };

  // ── Discard recording ──
  const discardRecording = async () => {
    Alert.alert(
      "Discard Recording",
      "Are you sure you want to discard this recording?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            if (!recordingRef.current) return;
            stopTimer();
            stopPulse();
            stopWaveAnimation();
            try {
              await recordingRef.current.stopAndUnloadAsync();
            } catch {}
            recordingRef.current = null;
            accumulatedRef.current = 0;
            setElapsedMs(0);
            setRecState("idle");
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
          },
        },
      ],
    );
  };

  // ── Playback ──
  const playRecording = async (entry: RecordingEntry) => {
    // Stop any current playback
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    if (playingId === entry.id) {
      setPlayingId(null);
      setPlaybackMs(0);
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri: entry.uri },
        { shouldPlay: true },
        (status: AVPlaybackStatus) => {
          if (status.isLoaded) {
            setPlaybackMs(status.positionMillis ?? 0);
            setPlaybackDuration(status.durationMillis ?? entry.durationMs);
            if (status.didJustFinish) {
              setPlayingId(null);
              setPlaybackMs(0);
            }
          }
        },
      );
      soundRef.current = sound;
      setPlayingId(entry.id);
    } catch (err) {
      Alert.alert("Playback Error", "Could not play this recording.");
      console.error(err);
    }
  };

  // ── Delete recording ──
  const deleteRecording = (id: string) => {
    Alert.alert("Delete Recording", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (playingId === id && soundRef.current) {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
            soundRef.current = null;
            setPlayingId(null);
          }
          setRecordings((prev) => prev.filter((r) => r.id !== id));
        },
      },
    ]);
  };

  // ── Save to gallery ──
  const saveRecording = async (entry: RecordingEntry) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Enable media library access in Settings.",
        );
        return;
      }
      await MediaLibrary.createAssetAsync(entry.uri);
      Alert.alert("✅ Saved", `"${entry.name}" saved to your media library.`);
    } catch {
      Alert.alert("Save Failed", "Could not save recording.");
    }
  };

  const isRecording = recState === "recording";
  const isPaused = recState === "paused";
  const isActive = isRecording || isPaused;

  // ════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Audio Recorder</Text>
          <Text style={styles.subheaderText}>
            Record, playback & save audio
          </Text>
        </View>

        {/* Recorder Card */}
        <View style={styles.recorderCard}>
          {/* Waveform */}
          <View style={styles.waveformContainer}>
            {waveAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.waveBar,
                  {
                    height: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [4, 48],
                    }),
                    backgroundColor: isRecording
                      ? "#EF4444"
                      : isPaused
                        ? "#F59E0B"
                        : "#334155",
                  },
                ]}
              />
            ))}
          </View>

          {/* Timer */}
          <View style={styles.timerRow}>
            {isActive && (
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isRecording ? "#EF4444" : "#F59E0B" },
                ]}
              />
            )}
            <Text
              style={[styles.timerText, isRecording && styles.timerTextActive]}
            >
              {formatDuration(elapsedMs / 1000)}
            </Text>
            {isActive && (
              <Text style={styles.recStateLabel}>
                {isRecording ? "REC" : "PAUSED"}
              </Text>
            )}
          </View>

          {/* Main Record Button */}
          <View style={styles.recButtonArea}>
            {isActive && (
              <TouchableOpacity
                style={styles.sideActionBtn}
                onPress={discardRecording}
              >
                <Ionicons name="trash-outline" size={22} color="#64748B" />
                <Text style={styles.sideActionText}>Discard</Text>
              </TouchableOpacity>
            )}

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.recButton,
                  isRecording && styles.recButtonActive,
                  isPaused && styles.recButtonPaused,
                ]}
                onPress={
                  !isActive
                    ? startRecording
                    : isRecording
                      ? pauseRecording
                      : resumeRecording
                }
                activeOpacity={0.85}
              >
                {!isActive ? (
                  <Ionicons name="mic" size={38} color="#fff" />
                ) : isRecording ? (
                  <Ionicons name="pause" size={38} color="#fff" />
                ) : (
                  <Ionicons name="mic" size={38} color="#fff" />
                )}
              </TouchableOpacity>
            </Animated.View>

            {isActive && (
              <TouchableOpacity
                style={styles.sideActionBtn}
                onPress={stopRecording}
              >
                <View style={styles.stopIcon} />
                <Text style={styles.sideActionText}>Stop</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.recHint}>
            {!isActive
              ? "Tap the mic to start recording"
              : isRecording
                ? "Tap to pause  •  Tap Stop to finish"
                : "Tap the mic to resume  •  Tap Stop to finish"}
          </Text>
        </View>

        {/* Recordings List */}
        {recordings.length > 0 && (
          <View style={styles.listSection}>
            <Text style={styles.listTitle}>
              Recordings{" "}
              <Text style={styles.listCount}>({recordings.length})</Text>
            </Text>

            {recordings.map((entry) => {
              const isPlaying = playingId === entry.id;
              const progress =
                isPlaying && playbackDuration > 0
                  ? playbackMs / playbackDuration
                  : 0;

              return (
                <View key={entry.id} style={styles.recordingCard}>
                  {/* Mini waveform */}
                  <View style={styles.miniWaveform}>
                    {entry.waveform.slice(0, 20).map((h, i) => (
                      <View
                        key={i}
                        style={[
                          styles.miniBar,
                          {
                            height: Math.max(3, h * 28),
                            backgroundColor:
                              isPlaying && i / 20 <= progress
                                ? "#EF4444"
                                : "#334155",
                          },
                        ]}
                      />
                    ))}
                  </View>

                  {/* Info */}
                  <View style={styles.recordingInfo}>
                    <Text style={styles.recordingName} numberOfLines={1}>
                      {entry.name}
                    </Text>
                    <View style={styles.recordingMeta}>
                      <Text style={styles.recordingDuration}>
                        {formatShort(entry.durationMs)}
                      </Text>
                      <Text style={styles.recordingDot}>·</Text>
                      <Text style={styles.recordingDate}>
                        {entry.createdAt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    {isPlaying && (
                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${progress * 100}%` as any },
                          ]}
                        />
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={styles.recordingActions}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        isPlaying && styles.actionBtnActive,
                      ]}
                      onPress={() => playRecording(entry)}
                    >
                      <Ionicons
                        name={isPlaying ? "stop" : "play"}
                        size={18}
                        color={isPlaying ? "#fff" : "#10B981"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => saveRecording(entry)}
                    >
                      <Ionicons
                        name="download-outline"
                        size={18}
                        color="#3B82F6"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => deleteRecording(entry.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Empty state */}
        {recordings.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="mic-off-outline" size={32} color="#334155" />
            </View>
            <Text style={styles.emptyText}>No recordings yet</Text>
            <Text style={styles.emptySubtext}>
              Your recordings will appear here after you stop recording
            </Text>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={styles.infoText}>
              All recordings are stored locally on your device.
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="musical-notes-outline" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              Records in high quality AAC format. Use Save to export to media
              library.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export default AudioRec;

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

  // Recorder card
  recorderCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
  },

  // Waveform
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    gap: 2,
    marginBottom: 20,
    width: "100%",
    justifyContent: "center",
  },
  waveBar: {
    width: BAR_WIDTH,
    borderRadius: 2,
    minHeight: 4,
  },

  // Timer
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timerText: {
    fontSize: 44,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 2,
    fontVariant: ["tabular-nums"],
  },
  timerTextActive: {
    color: "#fff",
  },
  recStateLabel: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  // Record button
  recButtonArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    marginBottom: 20,
  },
  recButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#475569",
  },
  recButtonActive: {
    backgroundColor: "#EF4444",
    borderColor: "#EF444488",
  },
  recButtonPaused: {
    backgroundColor: "#F59E0B",
    borderColor: "#F59E0B88",
  },
  sideActionBtn: {
    alignItems: "center",
    gap: 6,
    width: 60,
  },
  stopIcon: {
    width: 22,
    height: 22,
    backgroundColor: "#64748B",
    borderRadius: 4,
  },
  sideActionText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },
  recHint: {
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
  },

  // Recordings list
  listSection: { marginBottom: 24 },
  listTitle: {
    color: "#E2E8F0",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 14,
  },
  listCount: {
    color: "#64748B",
    fontWeight: "400",
  },

  recordingCard: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },

  // Mini waveform
  miniWaveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    width: 60,
    height: 32,
  },
  miniBar: {
    flex: 1,
    borderRadius: 1,
  },

  // Recording info
  recordingInfo: { flex: 1 },
  recordingName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 3,
  },
  recordingMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recordingDuration: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
  },
  recordingDot: {
    color: "#334155",
    fontSize: 12,
  },
  recordingDate: {
    color: "#64748B",
    fontSize: 12,
  },
  progressBarTrack: {
    height: 2,
    backgroundColor: "#334155",
    borderRadius: 1,
    marginTop: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#EF4444",
    borderRadius: 1,
  },

  // Recording actions
  recordingActions: {
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnActive: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 36,
    marginBottom: 24,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptySubtext: {
    color: "#334155",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },

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
