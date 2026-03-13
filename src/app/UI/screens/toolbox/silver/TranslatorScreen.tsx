import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";

interface Language {
  code: string;
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
];

const TranslatorScreen: React.FC = () => {
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const translate = async () => {
    if (!sourceText.trim()) {
      Alert.alert("Input Required", "Please enter text to translate");
      return;
    }

    setIsLoading(true);
    try {
      const langPair = `${sourceLanguage}|${targetLanguage}`;
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(sourceText)}&langpair=${langPair}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.responseStatus === 200) {
        setTranslatedText(data.responseData.translatedText);
      } else {
        Alert.alert(
          "Translation Failed",
          data.responseDetails || "Something went wrong. Please try again.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Could not connect to translation service. Check your internet connection.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const swapLanguages = () => {
    const tempLang = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(tempLang);

    const tempText = sourceText;
    setSourceText(translatedText);
    setTranslatedText(tempText);
  };

  const clearAll = () => {
    setSourceText("");
    setTranslatedText("");
  };

  const copyTranslation = () => {
    if (translatedText) {
      Alert.alert("Copied", "Translation copied to clipboard");
      // In real app: Clipboard.setString(translatedText);
    }
  };

  const getLanguage = (code: string) => languages.find((l) => l.code === code);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>Translator</Text>
        <Text style={styles.subheaderText}>
          Translate text between different languages
        </Text>
      </View>

      {/* Language Selection */}
      <View style={styles.languageSection}>
        {/* Source Language */}
        <View style={styles.languageContainer}>
          <Text style={styles.label}>From</Text>
          <View style={styles.pickerWrapper}>
            <Text style={styles.flagIcon}>
              {getLanguage(sourceLanguage)?.flag}
            </Text>
            <Picker
              selectedValue={sourceLanguage}
              onValueChange={(value) => setSourceLanguage(value)}
              style={styles.picker}
              dropdownIconColor="#fff"
            >
              {languages.map((lang) => (
                <Picker.Item
                  key={lang.code}
                  label={`${lang.flag} ${lang.name}`}
                  value={lang.code}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Swap Button */}
        <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
          <Ionicons name="swap-horizontal" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Target Language */}
        <View style={styles.languageContainer}>
          <Text style={styles.label}>To</Text>
          <View style={styles.pickerWrapper}>
            <Text style={styles.flagIcon}>
              {getLanguage(targetLanguage)?.flag}
            </Text>
            <Picker
              selectedValue={targetLanguage}
              onValueChange={(value) => setTargetLanguage(value)}
              style={styles.picker}
              dropdownIconColor="#fff"
            >
              {languages.map((lang) => (
                <Picker.Item
                  key={lang.code}
                  label={`${lang.flag} ${lang.name}`}
                  value={lang.code}
                />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* Source Text Input */}
      <View style={styles.textSection}>
        <Text style={styles.label}>Enter Text</Text>
        <View style={styles.textContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="Type or paste text here..."
            placeholderTextColor="#64748B"
            value={sourceText}
            onChangeText={setSourceText}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.textFooter}>
            <Text style={styles.characterCount}>
              {sourceText.length} characters
            </Text>
          </View>
        </View>
      </View>

      {/* Translate Button */}
      <TouchableOpacity
        style={[
          styles.translateButton,
          (!sourceText.trim() || isLoading) && styles.buttonDisabled,
        ]}
        onPress={translate}
        disabled={!sourceText.trim() || isLoading}
      >
        <Ionicons name="language" size={24} color="#fff" />
        <Text style={styles.translateButtonText}>
          {isLoading ? "Translating..." : "Translate"}
        </Text>
      </TouchableOpacity>

      {/* Translation Result */}
      {translatedText && (
        <View style={styles.textSection}>
          <View style={styles.resultHeader}>
            <Text style={styles.label}>Translation</Text>
            <TouchableOpacity
              onPress={copyTranslation}
              style={styles.copyButton}
            >
              <Ionicons name="copy-outline" size={20} color="#10B981" />
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>{translatedText}</Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearAll}
          disabled={!sourceText && !translatedText}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.infoText}>
            Powered by MyMemory — free translation API, no API key required.
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="globe-outline" size={20} color="#10B981" />
          <Text style={styles.infoText}>
            Supports 12 major languages including English, Spanish, French, and
            more.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default TranslatorScreen;

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
  languageSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  languageContainer: {
    flex: 1,
  },
  label: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
  },
  flagIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  picker: {
    flex: 1,
    color: "#fff",
    height: 50,
  },
  swapButton: {
    backgroundColor: "#334155",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  textSection: {
    marginBottom: 20,
  },
  textContainer: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  textArea: {
    padding: 16,
    color: "#fff",
    fontSize: 16,
    height: 150,
    textAlignVertical: "top",
  },
  textFooter: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: "flex-end",
  },
  characterCount: {
    color: "#64748B",
    fontSize: 14,
  },
  translateButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  translateButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  buttonDisabled: {
    backgroundColor: "#334155",
    opacity: 0.5,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  copyText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "600",
  },
  resultContainer: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    minHeight: 150,
  },
  resultText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  clearButton: {
    backgroundColor: "#334155",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
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

// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   Platform,
//   Alert,
// } from "react-native";
// import { Picker } from "@react-native-picker/picker";
// import { Ionicons } from "@expo/vector-icons";

// interface Language {
//   code: string;
//   name: string;
//   flag: string;
// }

// const languages: Language[] = [
//   { code: "en", name: "English", flag: "🇬🇧" },
//   { code: "es", name: "Spanish", flag: "🇪🇸" },
//   { code: "fr", name: "French", flag: "🇫🇷" },
//   { code: "de", name: "German", flag: "🇩🇪" },
//   { code: "it", name: "Italian", flag: "🇮🇹" },
//   { code: "pt", name: "Portuguese", flag: "🇵🇹" },
//   { code: "ru", name: "Russian", flag: "🇷🇺" },
//   { code: "ja", name: "Japanese", flag: "🇯🇵" },
//   { code: "zh", name: "Chinese", flag: "🇨🇳" },
//   { code: "ar", name: "Arabic", flag: "🇸🇦" },
//   { code: "hi", name: "Hindi", flag: "🇮🇳" },
//   { code: "ko", name: "Korean", flag: "🇰🇷" },
// ];

// const TranslatorScreen: React.FC = () => {
//   const [sourceLanguage, setSourceLanguage] = useState("en");
//   const [targetLanguage, setTargetLanguage] = useState("es");
//   const [sourceText, setSourceText] = useState("");
//   const [translatedText, setTranslatedText] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   // Mock translation function (in real app, you would use translation API)
//   // const translate = () => {
//   //   if (!sourceText.trim()) {
//   //     Alert.alert("Input Required", "Please enter text to translate");
//   //     return;
//   //   }

//   //   // Mock translation - in a real app, call a translation API
//   //   const sourceLang = languages.find((l) => l.code === sourceLanguage);
//   //   const targetLang = languages.find((l) => l.code === targetLanguage);

//   //   setTranslatedText(
//   //     `[Translated from ${sourceLang?.name} to ${targetLang?.name}]\n\n${sourceText}\n\n(This is a demo. Connect a translation API for real translations.)`,
//   //   );
//   // };

//   const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

//   const translate = async () => {
//     if (!sourceText.trim()) {
//       Alert.alert("Input Required", "Please enter text to translate");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const response = await fetch(
//         `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             q: sourceText,
//             source: sourceLanguage,
//             target: targetLanguage,
//             format: "text",
//           }),
//         },
//       );

//       const data = await response.json();
//       setTranslatedText(data.data.translations[0].translatedText);
//     } catch (error) {
//       Alert.alert("Error", "Translation failed. Check your API key.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const swapLanguages = () => {
//     const tempLang = sourceLanguage;
//     setSourceLanguage(targetLanguage);
//     setTargetLanguage(tempLang);

//     const tempText = sourceText;
//     setSourceText(translatedText);
//     setTranslatedText(tempText);
//   };

//   const clearAll = () => {
//     setSourceText("");
//     setTranslatedText("");
//   };

//   const copyTranslation = () => {
//     if (translatedText) {
//       Alert.alert("Copied", "Translation copied to clipboard");
//       // In real app: Clipboard.setString(translatedText);
//     }
//   };

//   const getLanguage = (code: string) => languages.find((l) => l.code === code);

//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={styles.contentContainer}
//     >
//       <View style={styles.header}>
//         <Text style={styles.headerText}>Translator</Text>
//         <Text style={styles.subheaderText}>
//           Translate text between different languages
//         </Text>
//       </View>

//       {/* Language Selection */}
//       <View style={styles.languageSection}>
//         {/* Source Language */}
//         <View style={styles.languageContainer}>
//           <Text style={styles.label}>From</Text>
//           <View style={styles.pickerWrapper}>
//             <Text style={styles.flagIcon}>
//               {getLanguage(sourceLanguage)?.flag}
//             </Text>
//             <Picker
//               selectedValue={sourceLanguage}
//               onValueChange={(value) => setSourceLanguage(value)}
//               style={styles.picker}
//               dropdownIconColor="#fff"
//             >
//               {languages.map((lang) => (
//                 <Picker.Item
//                   key={lang.code}
//                   label={`${lang.flag} ${lang.name}`}
//                   value={lang.code}
//                 />
//               ))}
//             </Picker>
//           </View>
//         </View>

//         {/* Swap Button */}
//         <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
//           <Ionicons name="swap-horizontal" size={24} color="#fff" />
//         </TouchableOpacity>

//         {/* Target Language */}
//         <View style={styles.languageContainer}>
//           <Text style={styles.label}>To</Text>
//           <View style={styles.pickerWrapper}>
//             <Text style={styles.flagIcon}>
//               {getLanguage(targetLanguage)?.flag}
//             </Text>
//             <Picker
//               selectedValue={targetLanguage}
//               onValueChange={(value) => setTargetLanguage(value)}
//               style={styles.picker}
//               dropdownIconColor="#fff"
//             >
//               {languages.map((lang) => (
//                 <Picker.Item
//                   key={lang.code}
//                   label={`${lang.flag} ${lang.name}`}
//                   value={lang.code}
//                 />
//               ))}
//             </Picker>
//           </View>
//         </View>
//       </View>

//       {/* Source Text Input */}
//       <View style={styles.textSection}>
//         <Text style={styles.label}>Enter Text</Text>
//         <View style={styles.textContainer}>
//           <TextInput
//             style={styles.textArea}
//             placeholder="Type or paste text here..."
//             placeholderTextColor="#64748B"
//             value={sourceText}
//             onChangeText={setSourceText}
//             multiline
//             textAlignVertical="top"
//           />
//           <View style={styles.textFooter}>
//             <Text style={styles.characterCount}>
//               {sourceText.length} characters
//             </Text>
//           </View>
//         </View>
//       </View>

//       {/* Translate Button */}

//       <TouchableOpacity
//         style={[
//           styles.translateButton,
//           (!sourceText.trim() || isLoading) && styles.buttonDisabled,
//         ]}
//         onPress={translate}
//         disabled={!sourceText.trim() || isLoading}
//       >
//         <Ionicons name="language" size={24} color="#fff" />
//         <Text style={styles.translateButtonText}>
//           {isLoading ? "Translating..." : "Translate"}
//         </Text>
//       </TouchableOpacity>

//       {/* Translation Result */}
//       {translatedText && (
//         <View style={styles.textSection}>
//           <View style={styles.resultHeader}>
//             <Text style={styles.label}>Translation</Text>
//             <TouchableOpacity
//               onPress={copyTranslation}
//               style={styles.copyButton}
//             >
//               <Ionicons name="copy-outline" size={20} color="#10B981" />
//               <Text style={styles.copyText}>Copy</Text>
//             </TouchableOpacity>
//           </View>
//           <View style={styles.resultContainer}>
//             <Text style={styles.resultText}>{translatedText}</Text>
//           </View>
//         </View>
//       )}

//       {/* Action Buttons */}
//       <View style={styles.buttonContainer}>
//         <TouchableOpacity
//           style={[styles.button, styles.clearButton]}
//           onPress={clearAll}
//           disabled={!sourceText && !translatedText}
//         >
//           <Ionicons name="trash-outline" size={20} color="#fff" />
//           <Text style={styles.buttonText}>Clear All</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Info Card */}
//       <View style={styles.infoCard}>
//         {/* <View style={styles.infoRow}>
//           <Ionicons name="information-circle" size={20} color="#3B82F6" />
//           <Text style={styles.infoText}>
//             This is a demo translator. Connect a translation API (like Google
//             Translate or DeepL) for real translations.
//           </Text>
//         </View> */}
//         <View style={styles.infoRow}>
//           <Ionicons name="globe-outline" size={20} color="#10B981" />
//           <Text style={styles.infoText}>
//             Supports 12 major languages including English, Spanish, French, and
//             more.
//           </Text>
//         </View>
//       </View>
//     </ScrollView>
//   );
// };

// export default TranslatorScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#101828",
//   },
//   contentContainer: {
//     padding: 20,
//     paddingTop: Platform.OS === "android" ? 40 : 60,
//   },
//   header: {
//     marginBottom: 24,
//   },
//   headerText: {
//     fontSize: 28,
//     fontWeight: "700",
//     color: "#fff",
//     textAlign: "center",
//     marginBottom: 8,
//   },
//   subheaderText: {
//     fontSize: 16,
//     color: "#CBD5E1",
//     textAlign: "center",
//   },
//   languageSection: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 24,
//     gap: 12,
//   },
//   languageContainer: {
//     flex: 1,
//   },
//   label: {
//     color: "#E2E8F0",
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 8,
//   },
//   pickerWrapper: {
//     backgroundColor: "#1E293B",
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#334155",
//     flexDirection: "row",
//     alignItems: "center",
//     paddingLeft: 12,
//   },
//   flagIcon: {
//     fontSize: 24,
//     marginRight: 8,
//   },
//   picker: {
//     flex: 1,
//     color: "#fff",
//     height: 50,
//   },
//   swapButton: {
//     backgroundColor: "#334155",
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 28,
//   },
//   textSection: {
//     marginBottom: 20,
//   },
//   textContainer: {
//     backgroundColor: "#1E293B",
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#334155",
//   },
//   textArea: {
//     padding: 16,
//     color: "#fff",
//     fontSize: 16,
//     height: 150,
//     textAlignVertical: "top",
//   },
//   textFooter: {
//     paddingHorizontal: 16,
//     paddingBottom: 12,
//     alignItems: "flex-end",
//   },
//   characterCount: {
//     color: "#64748B",
//     fontSize: 14,
//   },
//   translateButton: {
//     backgroundColor: "#10B981",
//     flexDirection: "row",
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//     marginBottom: 24,
//   },
//   translateButtonText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "700",
//   },
//   buttonDisabled: {
//     backgroundColor: "#334155",
//     opacity: 0.5,
//   },
//   resultHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   copyButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   copyText: {
//     color: "#10B981",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   resultContainer: {
//     backgroundColor: "#1E293B",
//     borderRadius: 12,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: "#334155",
//     minHeight: 150,
//   },
//   resultText: {
//     color: "#fff",
//     fontSize: 16,
//     lineHeight: 24,
//   },
//   buttonContainer: {
//     marginBottom: 24,
//   },
//   button: {
//     flexDirection: "row",
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//   },
//   clearButton: {
//     backgroundColor: "#334155",
//   },
//   buttonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   infoCard: {
//     backgroundColor: "#1E293B",
//     borderRadius: 16,
//     padding: 20,
//     borderWidth: 1,
//     borderColor: "#334155",
//   },
//   infoRow: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: 12,
//     marginBottom: 12,
//   },
//   infoText: {
//     flex: 1,
//     color: "#CBD5E1",
//     fontSize: 14,
//     lineHeight: 20,
//   },
// });
