import React, { useState, useRef, useEffect } from "react";
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
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import VersionBadge from "../../../component/VersionBadge";

const { width } = Dimensions.get("window");

// ── Types
type NoteColor = "default" | "red" | "amber" | "green" | "blue" | "purple";
type SortMode = "updated" | "created" | "title" | "color";
type AppView = "list" | "editor" | "search";

interface Note {
  id: string;
  title: string;
  body: string;
  color: NoteColor;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}

// ── Constants
const STORAGE_KEY = "notespro_notes_v1";

const NOTE_COLORS: Record<
  NoteColor,
  { bg: string; border: string; label: string }
> = {
  default: { bg: "#1E293B", border: "#334155", label: "Default" },
  red: { bg: "#2D1515", border: "#EF444455", label: "Red" },
  amber: { bg: "#2D2010", border: "#F59E0B55", label: "Amber" },
  green: { bg: "#0D2E1E", border: "#10B98155", label: "Green" },
  blue: { bg: "#0F1D3A", border: "#3B82F655", label: "Blue" },
  purple: { bg: "#1E1030", border: "#8B5CF655", label: "Purple" },
};

const COLOR_DOTS: Record<NoteColor, string> = {
  default: "#475569",
  red: "#EF4444",
  amber: "#F59E0B",
  green: "#10B981",
  blue: "#3B82F6",
  purple: "#8B5CF6",
};

// ── Helpers
const pad2 = (n: number) => (n < 10 ? "0" + n : "" + n);

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${d.getDate()}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const wordCount = (text: string): number =>
  text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

const makeId = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

const newNote = (): Note => ({
  id: makeId(),
  title: "",
  body: "",
  color: "default",
  pinned: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  wordCount: 0,
});

// ── Main Component ────────────────────────────────────────────────
const NotesPro: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [view, setView] = useState<AppView>("list");
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("updated");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchRef = useRef<TextInput>(null);
  const titleRef = useRef<TextInput>(null);
  const bodyRef = useRef<TextInput>(null);

  // ── Persistence
  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    if (loaded) saveNotes();
  }, [notes]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [view]);

  const loadNotes = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  };

  const saveNotes = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {}
  };

  // ── Note operations
  const createNote = () => {
    const note = newNote();
    setActiveNote(note);
    fadeAnim.setValue(0);
    setView("editor");
    setTimeout(() => titleRef.current?.focus(), 300);
  };

  const openNote = (note: Note) => {
    setActiveNote({ ...note });
    fadeAnim.setValue(0);
    setView("editor");
  };

  const saveNote = () => {
    if (!activeNote) return;
    const trimTitle = activeNote.title.trim();
    const trimBody = activeNote.body.trim();
    if (!trimTitle && !trimBody) {
      // Empty note — discard silently
      goBack();
      return;
    }
    const updated: Note = {
      ...activeNote,
      title: trimTitle || "Untitled",
      updatedAt: new Date().toISOString(),
      wordCount: wordCount(activeNote.body),
    };
    setNotes((prev) => {
      const exists = prev.find((n) => n.id === updated.id);
      if (exists) return prev.map((n) => (n.id === updated.id ? updated : n));
      return [updated, ...prev];
    });
    goBack();
  };

  const deleteNote = (id: string) => {
    Alert.alert("Delete Note", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setNotes((prev) => prev.filter((n) => n.id !== id));
          if (view === "editor") goBack();
        },
      },
    ]);
  };

  const togglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() }
          : n,
      ),
    );
  };

  const updateColor = (color: NoteColor) => {
    if (!activeNote) return;
    setActiveNote({ ...activeNote, color });
    setShowColorPicker(false);
  };

  const goBack = () => {
    fadeAnim.setValue(0);
    setView("list");
    setActiveNote(null);
    setShowColorPicker(false);
  };

  const openSearch = () => {
    fadeAnim.setValue(0);
    setView("search");
    setSearchQuery("");
    setTimeout(() => searchRef.current?.focus(), 300);
  };

  // ── Sorting & Filtering
  const sorted = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    switch (sortMode) {
      case "updated":
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      case "created":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "title":
        return a.title.localeCompare(b.title);
      case "color":
        return a.color.localeCompare(b.color);
    }
  });

  const filtered = sorted.filter((n) => {
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().indexOf(q) !== -1 ||
      n.body.toLowerCase().indexOf(q) !== -1
    );
  });

  const pinned = sorted.filter((n) => n.pinned);
  const unpinned = sorted.filter((n) => !n.pinned);

  // ════════════════════════════════════════
  // EDITOR VIEW
  // ════════════════════════════════════════
  if (view === "editor" && activeNote) {
    const colTheme = NOTE_COLORS[activeNote.color];
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colTheme.bg }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View style={[{ flex: 1, opacity: fadeAnim }]}>
          {/* Editor toolbar */}
          <View style={styles.editorToolbar}>
            <TouchableOpacity style={styles.toolbarBtn} onPress={saveNote}>
              <Ionicons name="arrow-back" size={22} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.toolbarRight}>
              {/* Color picker toggle */}
              <TouchableOpacity
                style={styles.toolbarBtn}
                onPress={() => setShowColorPicker(!showColorPicker)}
              >
                <View
                  style={[
                    styles.colorDotLg,
                    { backgroundColor: COLOR_DOTS[activeNote.color] },
                  ]}
                />
              </TouchableOpacity>

              {/* Pin */}
              <TouchableOpacity
                style={styles.toolbarBtn}
                onPress={() =>
                  setActiveNote({ ...activeNote, pinned: !activeNote.pinned })
                }
              >
                <Ionicons
                  name={activeNote.pinned ? "bookmark" : "bookmark-outline"}
                  size={22}
                  color={activeNote.pinned ? "#F59E0B" : "#94A3B8"}
                />
              </TouchableOpacity>

              {/* Delete */}
              <TouchableOpacity
                style={styles.toolbarBtn}
                onPress={() => deleteNote(activeNote.id)}
              >
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Color picker */}
          {showColorPicker && (
            <View style={styles.colorPicker}>
              {(Object.keys(NOTE_COLORS) as NoteColor[]).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorPickerDot,
                    { backgroundColor: COLOR_DOTS[c] },
                    activeNote.color === c && styles.colorPickerDotActive,
                  ]}
                  onPress={() => updateColor(c)}
                />
              ))}
            </View>
          )}

          <ScrollView
            style={styles.editorScroll}
            contentContainerStyle={styles.editorContent}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              ref={titleRef}
              style={styles.editorTitle}
              placeholder="Title"
              placeholderTextColor="#334155"
              value={activeNote.title}
              onChangeText={(t) => setActiveNote({ ...activeNote, title: t })}
              multiline
              returnKeyType="next"
              onSubmitEditing={() => bodyRef.current?.focus()}
            />

            <View style={styles.editorMeta}>
              <Text style={styles.editorMetaText}>
                {formatDate(activeNote.updatedAt)} ·{" "}
                {wordCount(activeNote.body)} words
              </Text>
            </View>

            <TextInput
              ref={bodyRef}
              style={styles.editorBody}
              placeholder="Start writing…"
              placeholderTextColor="#334155"
              value={activeNote.body}
              onChangeText={(t) => setActiveNote({ ...activeNote, body: t })}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    );
  }

  // ════════════════════════════════════════
  // SEARCH VIEW
  // ════════════════════════════════════════
  if (view === "search") {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Search notes…"
            placeholderTextColor="#475569"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          <TouchableOpacity onPress={goBack}>
            <Text style={styles.searchCancel}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.listContent}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color="#334155" />
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          ) : (
            filtered.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onOpen={() => openNote(note)}
                onPin={() => togglePin(note.id)}
                onDelete={() => deleteNote(note.id)}
                query={searchQuery}
              />
            ))
          )}
        </ScrollView>
      </Animated.View>
    );
  }

  // ════════════════════════════════════════
  // LIST VIEW
  // ════════════════════════════════════════
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      {/* <View>
        <VersionBadge version="0.03" />
      </View> */}
      <VersionBadge version="0.03" />

      <View style={styles.listHeader}>
        <View>
          <Text style={styles.listTitle}>Notes</Text>
          <Text style={styles.listSubtitle}>
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={openSearch}>
            <Ionicons name="search-outline" size={22} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Ionicons name="funnel-outline" size={22} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort menu */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {(["updated", "created", "title", "color"] as SortMode[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sortItem, sortMode === s && styles.sortItemActive]}
              onPress={() => {
                setSortMode(s);
                setShowSortMenu(false);
              }}
            >
              <Text
                style={[
                  styles.sortItemText,
                  sortMode === s && styles.sortItemTextActive,
                ]}
              >
                {s === "updated"
                  ? "Last edited"
                  : s === "created"
                    ? "Date created"
                    : s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
              {sortMode === s && (
                <Ionicons name="checkmark" size={16} color="#10B981" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setShowSortMenu(false)}
      >
        {notes.length === 0 ? (
          <View style={styles.emptyStateCenter}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="document-text-outline"
                size={36}
                color="#334155"
              />
            </View>
            <Text style={styles.emptyText}>No notes yet</Text>
            <Text style={styles.emptySubtext}>
              Tap + to create your first note
            </Text>
          </View>
        ) : (
          <>
            {/* Pinned */}
            {pinned.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>📌 Pinned</Text>
                {pinned.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onOpen={() => openNote(note)}
                    onPin={() => togglePin(note.id)}
                    onDelete={() => deleteNote(note.id)}
                  />
                ))}
                {unpinned.length > 0 && (
                  <Text style={styles.sectionLabel}>All Notes</Text>
                )}
              </>
            )}
            {/* Unpinned */}
            {unpinned.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onOpen={() => openNote(note)}
                onPin={() => togglePin(note.id)}
                onDelete={() => deleteNote(note.id)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={createNote}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── NoteCard Component
interface NoteCardProps {
  note: Note;
  onOpen: () => void;
  onPin: () => void;
  onDelete: () => void;
  query?: string;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onOpen,
  onPin,
  onDelete,
  query,
}) => {
  const colTheme = NOTE_COLORS[note.color];
  const preview = note.body.trim().slice(0, 120);

  const highlight = (text: string, q?: string): React.ReactNode => {
    if (!q || q.trim() === "")
      return <Text style={styles.cardBody}>{text}</Text>;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return <Text style={styles.cardBody}>{text}</Text>;
    return (
      <Text style={styles.cardBody}>
        {text.slice(0, idx)}
        <Text style={styles.cardHighlight}>
          {text.slice(idx, idx + q.length)}
        </Text>
        {text.slice(idx + q.length)}
      </Text>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.noteCard,
        { backgroundColor: colTheme.bg, borderColor: colTheme.border },
      ]}
      onPress={onOpen}
      activeOpacity={0.75}
      onLongPress={onPin}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {note.title || "Untitled"}
        </Text>
        <View style={styles.cardHeaderRight}>
          {note.pinned && (
            <Ionicons
              name="bookmark"
              size={14}
              color="#F59E0B"
              style={{ marginRight: 6 }}
            />
          )}
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>

      {preview !== "" &&
        highlight(preview + (note.body.length > 120 ? "…" : ""), query)}

      <View style={styles.cardFooter}>
        <Text style={styles.cardDate}>{formatDate(note.updatedAt)}</Text>
        <Text style={styles.cardWords}>{note.wordCount} words</Text>
      </View>
    </TouchableOpacity>
  );
};

export default NotesPro;

// ─── STYLES ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101828",
  },

  // ── List view ──
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 48 : 64,
    paddingBottom: 16,
  },
  listTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  listSubtitle: {
    color: "#475569",
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },

  // Sort menu
  sortMenu: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
  },
  sortItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  sortItemActive: { backgroundColor: "#10B98110" },
  sortItemText: { color: "#94A3B8", fontSize: 14 },
  sortItemTextActive: { color: "#10B981", fontWeight: "600" },

  // List content
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionLabel: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },

  // Note card
  noteCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: {
    color: "#F1F5F9",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardBody: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  cardHighlight: {
    backgroundColor: "#F59E0B44",
    color: "#F59E0B",
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardDate: { color: "#334155", fontSize: 11 },
  cardWords: { color: "#334155", fontSize: 11 },

  // FAB
  fab: {
    position: "absolute",
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  // ── Editor view ──
  editorToolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "android" ? 44 : 60,
    paddingBottom: 8,
  },
  toolbarBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  toolbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  colorDotLg: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#334155",
  },

  // Color picker
  colorPicker: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#0F172A",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#1E293B",
  },
  colorPickerDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  colorPickerDotActive: {
    borderWidth: 3,
    borderColor: "#fff",
  },

  editorScroll: { flex: 1 },
  editorContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  editorTitle: {
    color: "#F1F5F9",
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 34,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  editorMeta: { marginBottom: 16 },
  editorMetaText: { color: "#475569", fontSize: 12 },
  editorBody: {
    color: "#CBD5E1",
    fontSize: 16,
    lineHeight: 26,
    minHeight: 300,
  },

  // ── Search view ──
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 48 : 60,
    paddingBottom: 12,
    backgroundColor: "#101828",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 8,
  },
  searchCancel: {
    color: "#10B981",
    fontSize: 15,
    fontWeight: "600",
  },

  // Empty states
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyStateCenter: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "#334155",
    fontSize: 13,
    textAlign: "center",
  },
});
