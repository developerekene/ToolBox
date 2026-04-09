import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import VersionBadge from "../../../component/VersionBadge";

const WordCounterScreen: React.FC = () => {
  const [text, setText] = useState("");

  const getStats = () => {
    const trimmedText = text.trim();
    const words = trimmedText ? trimmedText.split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;
    const spaces = (text.match(/\s/g) || []).length;
    const lines = text.split(/\n/).length;
    const sentences = trimmedText
      ? (trimmedText.match(/[.!?]+/g) || []).length
      : 0;
    const paragraphs = trimmedText
      ? trimmedText.split(/\n\n+/).filter((p) => p.trim()).length
      : 0;

    return {
      words,
      chars,
      charsNoSpaces,
      spaces,
      lines,
      sentences,
      paragraphs,
    };
  };

  const stats = getStats();

  const estimatedReadTime = Math.ceil(stats.words / 200); // Average reading speed: 200 words/minute

  const handleClear = () => {
    setText("");
  };

  const handleCopy = () => {
    // In a real app, you would use Clipboard API
    // import Clipboard from '@react-native-clipboard/clipboard';
    // Clipboard.setString(text);
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
        <Text style={styles.headerText}>Word Counter</Text>
        <Text style={styles.subheaderText}>
          Analyze your text with detailed statistics
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="text-outline" size={24} color="#3B82F6" />
          <Text style={styles.statNum}>{stats.words}</Text>
          <Text style={styles.statLabel}>Words</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="reader-outline" size={24} color="#10B981" />
          <Text style={styles.statNum}>{stats.chars}</Text>
          <Text style={styles.statLabel}>Characters</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="remove-outline" size={24} color="#8B5CF6" />
          <Text style={styles.statNum}>{stats.charsNoSpaces}</Text>
          <Text style={styles.statLabel}>No Spaces</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons
            name="return-down-forward-outline"
            size={24}
            color="#F59E0B"
          />
          <Text style={styles.statNum}>{stats.lines}</Text>
          <Text style={styles.statLabel}>Lines</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="list-outline" size={24} color="#EF4444" />
          <Text style={styles.statNum}>{stats.sentences}</Text>
          <Text style={styles.statLabel}>Sentences</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="document-text-outline" size={24} color="#EC4899" />
          <Text style={styles.statNum}>{stats.paragraphs}</Text>
          <Text style={styles.statLabel}>Paragraphs</Text>
        </View>
      </View>

      {/* Reading Time */}
      {stats.words > 0 && (
        <View style={styles.readingTimeCard}>
          <Ionicons name="time-outline" size={20} color="#64748B" />
          <Text style={styles.readingTimeText}>
            Estimated reading time:{" "}
            <Text style={styles.readingTimeBold}>{estimatedReadTime} min</Text>
          </Text>
        </View>
      )}

      {/* Text Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Enter or paste your text</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Start typing or paste your text here..."
          placeholderTextColor="#64748B"
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="top"
        />
        <View style={styles.textAreaFooter}>
          <Text style={styles.characterCount}>
            {stats.chars} / {stats.words} words
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={handleClear}
          disabled={!text}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.copyButton]}
          onPress={handleCopy}
          disabled={!text}
        >
          <Ionicons name="copy-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Copy</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default WordCounterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101828",
  },
  contentContainer: {
    padding: 20,
    paddingTop: Platform.OS === "android" ? 40 : 60,
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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 12,
    width: "31%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  statNum: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  readingTimeCard: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  readingTimeText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  readingTimeBold: {
    color: "#fff",
    fontWeight: "700",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    height: 300,
    borderWidth: 1,
    borderColor: "#334155",
  },
  textAreaFooter: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  characterCount: {
    color: "#64748B",
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
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
    backgroundColor: "#EF4444",
  },
  copyButton: {
    backgroundColor: "#334155",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
