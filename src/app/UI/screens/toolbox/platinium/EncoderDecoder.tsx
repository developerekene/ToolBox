import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Alert,
  Platform,
  Clipboard,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import VersionBadge from "../../../component/VersionBadge";

// ── Types
type Mode = "encode" | "decode";
type SchemeKey =
  | "base64"
  // | "url"
  // | "html"
  | "hex"
  | "binary"
  | "rot13"
  | "morse"
  | "ascii";

interface Scheme {
  label: string;
  icon: string;
  color: string;
  description: string;
  encode: (input: string) => string;
  decode: (input: string) => string;
}

// ── Morse code map
const MORSE: Record<string, string> = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  " ": "/",
};
const MORSE_REV: Record<string, string> = (function () {
  const rev: Record<string, string> = {};
  for (const k in MORSE) {
    if (MORSE.hasOwnProperty(k)) rev[MORSE[k]] = k;
  }
  return rev;
})();

// ── HTML entities map
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const HTML_ENTITIES_REV: Record<string, string> = (function () {
  const rev: Record<string, string> = {};
  for (const k in HTML_ENTITIES) {
    if (HTML_ENTITIES.hasOwnProperty(k)) rev[HTML_ENTITIES[k]] = k;
  }
  return rev;
})();

// ── Schemes
const SCHEMES: Record<SchemeKey, Scheme> = {
  base64: {
    label: "Base64",
    icon: "code-slash-outline",
    color: "#3B82F6",
    description: "Encode binary data as ASCII text",
    encode: (s) => {
      try {
        return btoa(unescape(encodeURIComponent(s)));
      } catch {
        return "Error: invalid input";
      }
    },
    decode: (s) => {
      try {
        return decodeURIComponent(escape(atob(s.trim())));
      } catch {
        return "Error: invalid Base64 string";
      }
    },
  },
  // url: {
  //   label: "URL",
  //   icon: "link-outline",
  //   color: "#10B981",
  //   description: "Percent-encode special characters for URLs",
  //   encode: (s) => {
  //     try {
  //       return encodeURIComponent(s);
  //     } catch {
  //       return "Error: invalid input";
  //     }
  //   },
  //   decode: (s) => {
  //     try {
  //       return decodeURIComponent(s);
  //     } catch {
  //       return "Error: invalid URL-encoded string";
  //     }
  //   },
  // },
  // html: {
  //   label: "HTML",
  //   icon: "globe-outline",
  //   color: "#F59E0B",
  //   description: "Escape/unescape HTML special characters",
  //   encode: (s) => s.replace(/[&<>"']/g, (c) => HTML_ENTITIES[c] || c),
  //   decode: (s) =>
  //     s.replace(
  //       /&amp;|&lt;|&gt;|&quot;|&#39;/g,
  //       (e) => HTML_ENTITIES_REV[e] || e,
  //     ),
  // },
  hex: {
    label: "Hex",
    icon: "terminal-outline",
    color: "#8B5CF6",
    description: "Convert text to hexadecimal byte values",
    encode: (s) =>
      Array.from(s)
        .map((c) => {
          const h = c.charCodeAt(0).toString(16);
          return h.length < 2 ? "0" + h : h;
        })
        .join(" "),
    decode: (s) => {
      try {
        return s
          .trim()
          .split(/\s+/)
          .map((h) => String.fromCharCode(parseInt(h, 16)))
          .join("");
      } catch {
        return "Error: invalid hex string";
      }
    },
  },
  binary: {
    label: "Binary",
    icon: "calculator-outline",
    color: "#EF4444",
    description: "Convert text to 8-bit binary representation",
    encode: (s) =>
      Array.from(s)
        .map((c) => {
          const b = c.charCodeAt(0).toString(2);
          return "00000000".slice(b.length) + b;
        })
        .join(" "),
    decode: (s) => {
      try {
        return s
          .trim()
          .split(/\s+/)
          .map((b) => String.fromCharCode(parseInt(b, 2)))
          .join("");
      } catch {
        return "Error: invalid binary string";
      }
    },
  },
  rot13: {
    label: "ROT13",
    icon: "refresh-outline",
    color: "#EC4899",
    description: "Rotate letters by 13 positions (symmetric)",
    encode: (s) =>
      s.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= "Z" ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
      }),
    decode: (s) =>
      s.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= "Z" ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
      }),
  },
  morse: {
    label: "Morse",
    icon: "radio-outline",
    color: "#F97316",
    description: "Convert text to Morse code dots and dashes",
    encode: (s) =>
      s
        .toUpperCase()
        .split("")
        .map((c) => MORSE[c] || "?")
        .join(" "),
    decode: (s) =>
      s
        .trim()
        .split(" / ")
        .map((word) =>
          word
            .split(" ")
            .map((code) => MORSE_REV[code] || "?")
            .join(""),
        )
        .join(" "),
  },
  ascii: {
    label: "ASCII",
    icon: "list-outline",
    color: "#06B6D4",
    description: "Convert text to decimal ASCII code values",
    encode: (s) =>
      Array.from(s)
        .map((c) => c.charCodeAt(0))
        .join(" "),
    decode: (s) => {
      try {
        return s
          .trim()
          .split(/\s+/)
          .map((n) => String.fromCharCode(parseInt(n, 10)))
          .join("");
      } catch {
        return "Error: invalid ASCII codes";
      }
    },
  },
};

const SCHEME_KEYS = Object.keys(SCHEMES) as SchemeKey[];

// ── Component
const EncoderDecoder: React.FC = () => {
  const [activeScheme, setActiveScheme] = useState<SchemeKey>("base64");
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scheme = SCHEMES[activeScheme];

  const handleConvert = () => {
    if (!input.trim()) return;
    const result =
      mode === "encode" ? scheme.encode(input) : scheme.decode(input);
    setOutput(result);
  };

  const handleSchemeChange = (key: SchemeKey) => {
    setActiveScheme(key);
    setOutput("");
  };

  const handleModeToggle = (m: Mode) => {
    setMode(m);
    // Swap input/output
    if (output) {
      setInput(output);
      setOutput("");
    }
  };

  const handleCopy = () => {
    if (!output) return;
    Clipboard.setString(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getString();
      if (text) setInput(text);
    } catch {
      Alert.alert("Error", "Could not access clipboard.");
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
  };

  const handleSwap = () => {
    if (!output) return;
    const prev = input;
    setInput(output);
    setOutput(prev);
    setMode((m) => (m === "encode" ? "decode" : "encode"));
  };

  const isError = output.startsWith("Error:");

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <VersionBadge version="0.03" />
        </View>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Encoder / Decoder</Text>
          <Text style={styles.subheaderText}>
            Transform text across 6 encoding schemes
          </Text>
        </View>

        {/* Scheme Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.schemeScroll}
          contentContainerStyle={styles.schemeScrollContent}
        >
          {SCHEME_KEYS.map((key) => {
            const s = SCHEMES[key];
            const isActive = activeScheme === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.schemeChip,
                  isActive && {
                    backgroundColor: s.color + "22",
                    borderColor: s.color,
                  },
                ]}
                onPress={() => handleSchemeChange(key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={s.icon as any}
                  size={15}
                  color={isActive ? s.color : "#64748B"}
                />
                <Text
                  style={[
                    styles.schemeChipText,
                    isActive && { color: s.color },
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active scheme info */}
        <View style={[styles.schemeInfo, { borderColor: scheme.color + "44" }]}>
          <View
            style={[styles.schemeInfoDot, { backgroundColor: scheme.color }]}
          />
          <Text style={styles.schemeInfoText}>{scheme.description}</Text>
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "encode" && styles.modeBtnActive]}
            onPress={() => handleModeToggle("encode")}
          >
            <MaterialIcons
              name="lock-outline"
              size={16}
              color={mode === "encode" ? "#fff" : "#64748B"}
            />
            <Text
              style={[
                styles.modeBtnText,
                mode === "encode" && styles.modeBtnTextActive,
              ]}
            >
              Encode
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "decode" && styles.modeBtnActive]}
            onPress={() => handleModeToggle("decode")}
          >
            <MaterialIcons
              name="lock-open"
              size={16}
              color={mode === "decode" ? "#fff" : "#64748B"}
            />
            <Text
              style={[
                styles.modeBtnText,
                mode === "decode" && styles.modeBtnTextActive,
              ]}
            >
              Decode
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>
              {mode === "encode" ? "Plain Text" : "Encoded Text"}
            </Text>
            <TouchableOpacity style={styles.pasteBtn} onPress={handlePaste}>
              <Ionicons name="clipboard-outline" size={15} color="#64748B" />
              <Text style={styles.pasteBtnText}>Paste</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textArea}
              placeholder={
                mode === "encode"
                  ? "Enter text to encode…"
                  : "Enter encoded text to decode…"
              }
              placeholderTextColor="#334155"
              value={input}
              onChangeText={(t) => {
                setInput(t);
                setOutput("");
              }}
              multiline
              textAlignVertical="top"
              autoCorrect={false}
              autoCapitalize="none"
            />
            <View style={styles.inputFooter}>
              <Text style={styles.charCount}>{input.length} chars</Text>
              {input.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setInput("");
                    setOutput("");
                  }}
                >
                  <Ionicons name="close-circle" size={18} color="#475569" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Ionicons name="trash-outline" size={18} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.convertBtn,
              { backgroundColor: scheme.color },
              !input.trim() && styles.convertBtnDisabled,
            ]}
            onPress={handleConvert}
            disabled={!input.trim()}
            activeOpacity={0.8}
          >
            <Ionicons
              name={
                mode === "encode" ? "lock-closed-outline" : "lock-open-outline"
              }
              size={20}
              color="#fff"
            />
            <Text style={styles.convertBtnText}>
              {mode === "encode" ? "Encode" : "Decode"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.swapBtn, !output && styles.swapBtnDisabled]}
            onPress={handleSwap}
            disabled={!output}
          >
            <Ionicons
              name="swap-vertical-outline"
              size={18}
              color={output ? "#94A3B8" : "#334155"}
            />
          </TouchableOpacity>
        </View>

        {/* Output */}
        {output !== "" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>
                {isError
                  ? "Error"
                  : mode === "encode"
                    ? "Encoded Output"
                    : "Decoded Output"}
              </Text>
              <TouchableOpacity
                style={[styles.copyBtn, copied && styles.copyBtnActive]}
                onPress={handleCopy}
                disabled={isError}
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

            <View
              style={[
                styles.outputWrapper,
                isError && styles.outputWrapperError,
                !isError && { borderColor: scheme.color + "44" },
              ]}
            >
              <Text
                style={[styles.outputText, isError && styles.outputTextError]}
              >
                {output}
              </Text>
              <View style={styles.outputFooter}>
                <Text style={styles.charCount}>{output.length} chars</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Reference */}
        <View style={styles.referenceCard}>
          <Text style={styles.referenceTitle}>All Encoding Schemes</Text>
          {SCHEME_KEYS.map((key) => {
            const s = SCHEMES[key];
            const isActive = activeScheme === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.referenceRow,
                  isActive && styles.referenceRowActive,
                ]}
                onPress={() => handleSchemeChange(key)}
              >
                <View
                  style={[styles.referenceDot, { backgroundColor: s.color }]}
                />
                <View style={styles.referenceInfo}>
                  <Text
                    style={[
                      styles.referenceLabel,
                      isActive && { color: s.color },
                    ]}
                  >
                    {s.label}
                  </Text>
                  <Text style={styles.referenceDesc}>{s.description}</Text>
                </View>
                {isActive && (
                  <Ionicons name="checkmark-circle" size={18} color={s.color} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              Tap Encode/Decode to convert. Use the swap button to reverse the
              result back into input.
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={styles.infoText}>
              All encoding is done locally on your device, no data is sent
              anywhere.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export default EncoderDecoder;

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
    fontSize: 15,
    color: "#CBD5E1",
    textAlign: "center",
  },

  // Scheme selector
  schemeScroll: { marginBottom: 14 },
  schemeScrollContent: { gap: 8, paddingRight: 4 },
  schemeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  schemeChipText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  // Scheme info banner
  schemeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1E293B",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  schemeInfoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  schemeInfoText: {
    color: "#94A3B8",
    fontSize: 13,
    flex: 1,
  },

  // Mode toggle
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 4,
    marginBottom: 22,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    borderRadius: 10,
  },
  modeBtnActive: { backgroundColor: "#10B981" },
  modeBtnText: { color: "#64748B", fontSize: 14, fontWeight: "600" },
  modeBtnTextActive: { color: "#fff" },

  // Section
  section: { marginBottom: 18 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "600",
  },
  pasteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  pasteBtnText: { color: "#64748B", fontSize: 12, fontWeight: "600" },

  // Input
  inputWrapper: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  textArea: {
    color: "#F1F5F9",
    fontSize: 15,
    lineHeight: 22,
    padding: 16,
    minHeight: 120,
    textAlignVertical: "top",
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  charCount: { color: "#334155", fontSize: 12 },

  // Action row
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  clearBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  convertBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  convertBtnDisabled: { opacity: 0.45 },
  convertBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  swapBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  swapBtnDisabled: { opacity: 0.4 },

  // Output
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
  outputWrapper: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  outputWrapperError: {
    borderColor: "#EF444455",
    backgroundColor: "#2D1515",
  },
  outputText: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 22,
    padding: 16,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  outputTextError: { color: "#EF4444" },
  outputFooter: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: "flex-end",
  },

  // Reference card
  referenceCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 16,
    marginBottom: 16,
  },
  referenceTitle: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 14,
  },
  referenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  referenceRowActive: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  referenceDot: { width: 8, height: 8, borderRadius: 4 },
  referenceInfo: { flex: 1 },
  referenceLabel: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  referenceDesc: { color: "#475569", fontSize: 11 },

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
