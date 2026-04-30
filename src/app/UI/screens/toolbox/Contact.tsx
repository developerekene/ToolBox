import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";

// ─── EmailJS Config
const EMAILJS_SERVICE_ID = "service_o1jbklr";
const EMAILJS_TEMPLATE_ID = "template_p8h58ur";
const EMAILJS_PUBLIC_KEY = "hcj3DsJ8MfNfUrE8J";

// ─── Types
type FormField = "title" | "fullName" | "email" | "phone" | "message";
type FormData = Record<FormField, string>;
type FormErrors = Partial<Record<FormField, string>>;
type Status = "idle" | "loading" | "success" | "error";

const TITLE_OPTIONS = [
  "General Enquiry",
  "Mobile App",
  "Consultation",
  "Partnership",
  "Other",
];

const { width: W } = Dimensions.get("window");

// ─── Theme
const T = {
  bg: "#07080F",
  card: "#0E1020",
  elevated: "#151829",
  border: "#1E2240",
  borderFocus: "#C8A84B",
  gold: "#C8A84B",
  goldLight: "#E6C56A",
  goldDim: "#7A6020",
  text: "#F0EFFF",
  textSub: "#8B8FAE",
  textDim: "#454766",
  success: "#3ECF8E",
  error: "#FF5C5C",
};

// ─── Helpers
const validateEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const validatePhone = (v: string) =>
  v === "" || /^[+\d\s\-()]{7,15}$/.test(v.trim());

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.title) errors.title = "Please select a subject";
  if (!data.fullName.trim()) errors.fullName = "Full name is required";
  if (!data.email.trim()) errors.email = "Email is required";
  else if (!validateEmail(data.email)) errors.email = "Enter a valid email";
  if (!validatePhone(data.phone)) errors.phone = "Enter a valid phone number";
  if (!data.message.trim()) errors.message = "Message is required";
  else if (data.message.trim().length < 10)
    errors.message = "Message must be at least 10 characters";
  return errors;
}

// ─── SendEmail
async function sendEmail(data: FormData): Promise<void> {
  const payload = {
    service_id: EMAILJS_SERVICE_ID,
    template_id: EMAILJS_TEMPLATE_ID,
    user_id: EMAILJS_PUBLIC_KEY,
    template_params: {
      name: data.fullName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim() || "Not provided",
      title: data.title,
      message: data.message.trim(),
    },
  };

  //   const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(payload),
  //   });
  // added origin header

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost", // required for non-browser environments
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
}

// ─── TitlePicker
function TitlePicker({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.pickerBtn,
          value ? styles.pickerBtnFilled : null,
          error ? styles.inputError : null,
        ]}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.8}
      >
        <Text style={[styles.pickerBtnText, !value && { color: T.textDim }]}>
          {value || "Select a subject…"}
        </Text>
        <Text
          style={[
            styles.pickerArrow,
            open && { transform: [{ rotate: "180deg" }] },
          ]}
        >
          ▾
        </Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          {TITLE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.dropdownItem,
                value === opt && styles.dropdownItemActive,
              ]}
              onPress={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  value === opt && { color: T.gold },
                ]}
              >
                {opt}
              </Text>
              {value === opt && (
                <Text style={{ color: T.gold, fontSize: 14 }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ─── FieldInput
function FieldInput({
  label,
  value,
  onChangeText,
  error,
  optional,
  multiline,
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  optional?: boolean;
  multiline?: boolean;
  [key: string]: any;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldWrap}>
      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {optional && <Text style={styles.optionalTag}>optional</Text>}
      </View>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          focused && styles.inputFocused,
          error && styles.inputError,
          !!value && styles.inputFilled,
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={T.textDim}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        {...rest}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ─── SuccessBanner
function SuccessBanner({ onReset }: { onReset: () => void }) {
  return (
    <View style={styles.successWrap}>
      <View style={styles.successIconCircle}>
        <Text style={styles.successIcon}>✓</Text>
      </View>
      <Text style={styles.successTitle}>Message Sent!</Text>
      <Text style={styles.successSub}>
        We've received your request and will get back to you within 3 business
        days.
      </Text>
      <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
        <Text style={styles.resetBtnText}>Send Another Message</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Component
export default function ContactForm() {
  const [form, setForm] = useState<FormData>({
    title: "",
    fullName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");

  const set = (field: FormField) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setStatus("loading");
    setServerError("");
    try {
      await sendEmail(form);
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setServerError(err?.message || "Something went wrong. Please try again.");
    }
  };

  const handleReset = () => {
    setForm({ title: "", fullName: "", email: "", phone: "", message: "" });
    setErrors({});
    setStatus("idle");
    setServerError("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerWrap}>
          <View style={styles.headerAccent} />
          <Text style={styles.headerTitle}>Get in Touch</Text>
          <Text style={styles.headerSub}>Send a meassage to our team</Text>
        </View>

        {status === "success" ? (
          <SuccessBanner onReset={handleReset} />
        ) : (
          <View style={styles.formCard}>
            {/* Subject */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Subject</Text>
              <TitlePicker
                value={form.title}
                onChange={set("title")}
                error={errors.title}
              />
            </View>

            {/* Full Name */}
            <FieldInput
              label="Full Name"
              placeholder="e.g. Amara Okafor"
              value={form.fullName}
              onChangeText={set("fullName")}
              error={errors.fullName}
              autoCapitalize="words"
              returnKeyType="next"
            />

            {/* Email */}
            <FieldInput
              label="Email Address"
              placeholder="you@example.com"
              value={form.email}
              onChangeText={set("email")}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />

            {/* Phone (optional) */}
            <FieldInput
              label="Phone Number"
              placeholder="+234 800 000 0000"
              value={form.phone}
              onChangeText={set("phone")}
              error={errors.phone}
              optional
              keyboardType="phone-pad"
              returnKeyType="next"
            />

            {/* Message */}
            <FieldInput
              label="Message"
              placeholder="Send a meassage..."
              value={form.message}
              onChangeText={set("message")}
              error={errors.message}
              multiline
              returnKeyType="done"
            />

            {/* Server error */}
            {status === "error" && serverError ? (
              <View style={styles.serverError}>
                <Text style={styles.serverErrorIcon}>⚠</Text>
                <Text style={styles.serverErrorText}>{serverError}</Text>
              </View>
            ) : null}

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                status === "loading" && styles.submitBtnLoading,
              ]}
              onPress={handleSubmit}
              disabled={status === "loading"}
              activeOpacity={0.85}
            >
              {status === "loading" ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#000" size="small" />
                  <Text style={styles.submitBtnText}>Sending…</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>Send Message →</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.footer}>
          D'roid Technologies Ltd · We respond within 3 business days
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },

  // Header
  headerWrap: {
    marginBottom: 28,
    position: "relative",
  },
  headerAccent: {
    width: 40,
    height: 3,
    backgroundColor: T.gold,
    borderRadius: 2,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: T.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerSub: {
    fontSize: 14,
    color: T.textSub,
    lineHeight: 21,
  },

  // Card
  formCard: {
    backgroundColor: T.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    padding: 20,
    gap: 20,
  },

  // Fields
  fieldWrap: { gap: 6 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: T.textSub,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  optionalTag: {
    fontSize: 10,
    color: T.textDim,
    fontStyle: "italic",
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  input: {
    backgroundColor: T.elevated,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: T.text,
    minHeight: 48,
  },
  inputMultiline: {
    minHeight: 110,
    paddingTop: 13,
    lineHeight: 22,
  },
  inputFocused: {
    borderColor: T.goldDim,
    backgroundColor: "#131629",
  },
  inputFilled: {
    borderColor: T.border,
  },
  inputError: {
    borderColor: T.error + "99",
    backgroundColor: T.error + "08",
  },
  errorText: {
    fontSize: 12,
    color: T.error,
    marginTop: 3,
    marginLeft: 2,
  },

  // Picker
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: T.elevated,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 48,
  },
  pickerBtnFilled: {
    borderColor: T.border,
  },
  pickerBtnText: {
    fontSize: 15,
    color: T.text,
    flex: 1,
  },
  pickerArrow: {
    fontSize: 14,
    color: T.textSub,
    marginLeft: 8,
  },
  dropdown: {
    backgroundColor: T.elevated,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.border,
  },
  dropdownItemActive: {
    backgroundColor: T.goldDim + "22",
  },
  dropdownItemText: {
    fontSize: 14,
    color: T.text,
  },

  // Server error
  serverError: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: T.error + "12",
    borderWidth: 1,
    borderColor: T.error + "44",
    borderRadius: 10,
    padding: 12,
  },
  serverErrorIcon: {
    fontSize: 16,
    color: T.error,
    marginTop: 1,
  },
  serverErrorText: {
    flex: 1,
    fontSize: 13,
    color: T.error,
    lineHeight: 19,
  },

  // Submit
  submitBtn: {
    backgroundColor: T.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    shadowColor: T.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnLoading: {
    opacity: 0.75,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 0.3,
  },

  // Success
  successWrap: {
    backgroundColor: T.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.success + "44",
    padding: 32,
    alignItems: "center",
    gap: 14,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.success + "22",
    borderWidth: 2,
    borderColor: T.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  successIcon: {
    fontSize: 30,
    color: T.success,
    fontWeight: "700",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: T.text,
    letterSpacing: -0.3,
  },
  successSub: {
    fontSize: 14,
    color: T.textSub,
    textAlign: "center",
    lineHeight: 21,
  },
  resetBtn: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  resetBtnText: {
    fontSize: 14,
    color: T.textSub,
    fontWeight: "600",
  },

  // Footer
  footer: {
    fontSize: 11,
    color: T.textDim,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 17,
  },
});
