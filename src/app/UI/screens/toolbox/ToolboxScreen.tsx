import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

// Silver Tools
import CropToolScreen from "./silver/CropToolScreen";
import WordCounterScreen from "./silver/WordCounterScreen";
import TranslatorScreen from "./silver/TranslatorScreen";
import ScientificCalculator from "./silver/ScientificCalculator";
import BMICalculator from "./silver/BMICalculator";
import TipCalculator from "./silver/TipCalculator";
import UnitConverter from "./silver/UnitConverter";
import LoanCalculator from "./gold/LoanCalculator";
import ORScanner from "./silver/ORScanner";

// Gold Tools
import QRGeneratorScreen from "./gold/QRGeneratorScreen";
import PdfScannerScreen from "./gold/PdfScannerScreen";
import ImageCompressScreen from "./gold/ImageCompressScreen";
import DiscountCalc from "./gold/DiscountCalc";

// Platinum Tools
import VideoTrimScreen from "./platinium/VideoTrimScreen";
import AudioRec from "./platinium/AudioRec";
import ZipCreator from "./platinium/ZipCreator";
import NotesPro from "./platinium/NotesPro";
import EncoderDecoder from "./platinium/EncoderDecoder";
import CurrencyConverter from "./platinium/CurrencyConverter";
import InvestmentCalc from "./platinium/InvestmentCalc";
import FuelCostCalc from "./platinium/FuelCostCalc";
import MortgageCalc from "./platinium/MortgageCalc";

// new tools
import AIDetector from "../toolbox/newtools/AIDetector";
import AlgebraCalculator from "../toolbox/newtools/AlgebraCalculator";
import BackgroundRemover from "../toolbox/newtools/BackgroundRemover";
import BooleanCombinator from "../toolbox/newtools/BooleanCombinator";
import Calendar from "../toolbox/newtools/calendar/Calendar";
import FileCompressor from "../toolbox/newtools/FileCompressor";
import FileConverter from "../toolbox/newtools/FileConverter";
import FileEditor from "../toolbox/newtools/FileEditor";
import FileFillSign from "../toolbox/newtools/FileFillSign";
import ImageEditor from "../toolbox/newtools/ImageEditor";
import KeywordGenerator from "../toolbox/newtools/KeywordGenerator";
import PdfEditor from "../toolbox/newtools/PdfEditor";
import Phrasebook from "../toolbox/newtools/Phrasebook";
import PlagiarismChecker from "../toolbox/newtools/PlagiarismChecker";
import SearchTracker from "../toolbox/newtools/SearchTracker";
import TimeAlert from "../toolbox/newtools/TimeAlert";

// Membership Modal
import MembershipModal, { Tier } from "./MembershipModal";
import CheckoutModal from "./CheckoutModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { tools } from "../../../utils/constant/data";

import Contact from "./Contact";

const ToolboxsScreen: React.FC = () => {
  const handleClose = () => {
    setSelectedTool(null);
  };

  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<Tier>("Silver");
  const [membershipVisible, setMembershipVisible] = useState(false);

  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState<Tier>("Gold");
  const [tierLoaded, setTierLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [fabVisible, setFabVisible] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);

  const isTierAccessible = (required: string) => {
    const tiers = ["Silver", "Gold", "Platinum"];
    return tiers.indexOf(userTier) >= tiers.indexOf(required);
  };

  useEffect(() => {
    const loadUser = async () => {
      const savedTier = await AsyncStorage.getItem("userTier");
      const savedExpiry = await AsyncStorage.getItem("tierExpiry");

      if (savedTier && savedExpiry) {
        const expiry = new Date(savedExpiry);
        const now = new Date();

        if (now > expiry) {
          // Subscription expired — downgrade to Silver
          await AsyncStorage.setItem("userTier", "Silver");
          await AsyncStorage.removeItem("tierExpiry");
          setUserTier("Silver");
        } else {
          setUserTier(savedTier as Tier);
        }
      }

      setTierLoaded(true);
    };
    loadUser();
  }, []);

  const handleUpgrade = (tier: Tier) => {
    setUserTier(tier);
    AsyncStorage.setItem("userTier", tier);
  };

  const renderToolContent = (toolName: string) => {
    // Shared wrapper style for consistency
    const ToolView = ({ children }: { children: React.ReactNode }) => (
      <View style={styles.toolWrapper}>{children}</View>
    );

    switch (toolName) {
      // Silver tier tools
      case "Crop Tool":
        return <CropToolScreen />;

      case "Word Counter":
        return <WordCounterScreen />;

      case "Translator":
        return <TranslatorScreen />;

      case "Scientific Calculator":
        return <ScientificCalculator />;

      case "BMI Calculator":
        return <BMICalculator />;

      case "Tip Calculator":
        return <TipCalculator />;

      case "Unit Converter":
        return <UnitConverter />;

      case "Loan Calculator":
        return <LoanCalculator />;

      // gold tier tools
      case "PDF Scanner":
        return <PdfScannerScreen />;

      case "QR Code Generator":
        return <QRGeneratorScreen />;

      case "Image Compress":
        return <ImageCompressScreen />;

      case "Discount Calc":
        return <DiscountCalc />;

      // Platinum tier tools
      case "Audio Rec":
        return <AudioRec />;

      case "Video Trim":
        return <VideoTrimScreen />;

      case "Zip Creator":
        return <ZipCreator />;

      case "Notes Pro":
        return <NotesPro />;

      case "QR Scanner":
        return <ORScanner />;

      case "Encoder / Decoder":
        return <EncoderDecoder />;

      case "Currency Converter":
        return <CurrencyConverter />;

      case "Investment Calc":
        return <InvestmentCalc />;

      case "Fuel Cost Calc":
        return <FuelCostCalc />;

      case "Mortgage Calc":
        return <MortgageCalc />;

      // new tools
      case "AI Detector":
        return <AIDetector />;

      case "Algebra Calculator":
        return <AlgebraCalculator />;

      case "Background Remover":
        return <BackgroundRemover />;

      case "Boolean Combinator":
        return <BooleanCombinator />;

      case "Calendar":
        return <Calendar />;

      case "File Compressor":
        return <FileCompressor />;

      case "File Converter":
        return <FileConverter />;

      case "File Editor":
        return <FileEditor />;

      case "File Fill & Sign":
        return <FileFillSign />;

      case "Image Editor":
        return <ImageEditor />;

      case "Keyword Generator":
        return <KeywordGenerator />;

      case "PDF Editor":
        return <PdfEditor />;

      case "Phrasebook":
        return <Phrasebook />;

      case "Plagiarism Checker":
        return <PlagiarismChecker />;

      case "Search Tracker":
        return <SearchTracker />;

      case "Time Alert":
        return <TimeAlert />;

      default:
        return (
          <Text style={styles.toolPlaceholder}>Tool Interface Coming Soon</Text>
        );
    }
  };
  if (!tierLoaded) return null;

  const filteredTools = tools.filter((tool) =>
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  return (
    <View style={styles.container}>
      <View style={styles.buttonContainerMain}>
        <View>
          <Text style={styles.title}>Toolbox</Text>
          <Text style={styles.subtitle}>
            Utility tools for your daily tasks
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.subtitle}
            onPress={() => setMembershipVisible(true)}
          >
            <Text style={styles.btnText}>Upgrade Membership</Text>
          </TouchableOpacity>
          {/* modal */}

          <MembershipModal
            visible={membershipVisible}
            currentTier={userTier}
            onClose={() => setMembershipVisible(false)}
            onUpgrade={(tier) => {
              if (tier === "Silver") {
                // setUserTier(tier); // downgrade immediately, no checkout
                handleUpgrade(tier); // ✅ saves downgrade to AsyncStorage too
              } else {
                setCheckoutTier(tier);
                setCheckoutVisible(true);
              }
              setMembershipVisible(false);
            }}
          />
          <CheckoutModal
            visible={checkoutVisible}
            tier={checkoutTier}
            onClose={() => setCheckoutVisible(false)}
            onSuccess={(tier) => {
              handleUpgrade(tier);
              setCheckoutVisible(false);
            }}
          />
        </View>
      </View>

      {/* search query */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={16}
          color="#64748b"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tools..."
          placeholderTextColor="#475569"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close"
              size={16}
              color="#64748b"
              style={styles.searchIcon}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.grid}>
          {filteredTools.length > 0 ? (
            filteredTools.map((tool) => {
              const isLocked = !isTierAccessible(tool.requiredTier);
              return (
                <TouchableOpacity
                  key={tool.id}
                  style={[
                    styles.toolCard,
                    {
                      backgroundColor: tool.color,
                      opacity: isLocked ? 0.5 : 1,
                    },
                  ]}
                  onPress={() => !isLocked && setSelectedTool(tool.title)}
                  disabled={isLocked}
                >
                  <View style={styles.tierBadge}>
                    <Text style={styles.tierBadgeText}>
                      {tool.requiredTier}
                    </Text>
                  </View>
                  <FontAwesome5
                    name={tool.icon as any}
                    size={28}
                    color="#fff"
                  />
                  <Text style={styles.toolText}>{tool.title}</Text>
                  {isLocked && (
                    <Ionicons
                      name="lock-closed"
                      size={18}
                      color="#fff"
                      style={styles.lockIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No tools match "{searchQuery}"</Text>
          )}
        </View>
      </ScrollView>

      <Modal visible={!!selectedTool} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedTool}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {selectedTool && renderToolContent(selectedTool)}
          </ScrollView>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setFabVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="apps" size={28} color="#fff" />
      </TouchableOpacity>

      {/* FAB Bottom Modal */}
      <Modal
        visible={fabVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFabVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFabVisible(false)}
        >
          <View style={styles.fabModalContent}>
            <View style={styles.modalHandle} />

            <Text style={styles.fabModalTitle}>Quick Actions</Text>

            <TouchableOpacity
              style={styles.fabOption}
              onPress={() => {
                setFabVisible(false); // close the FAB sheet first
                setContactVisible(true); // then open contact modal
              }}

              // onPress={() => {
              //   /* Handle Contact */
              // }}
            >
              <Ionicons name="mail-outline" size={22} color="#fff" />
              <Text style={styles.fabOptionText}>Contact Us</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fabOption, styles.closeOption]}
              onPress={() => setFabVisible(false)}
            >
              <Text style={styles.closeOptionText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* contact modal */}
      {/* Contact Modal */}
      <Modal
        visible={contactVisible}
        animationType="slide"
        onRequestClose={() => setContactVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Contact Us</Text>
            <TouchableOpacity
              onPress={() => setContactVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <Contact />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000105",
    padding: 16,
    paddingTop: 60,
  },
  buttonContainerMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  btnText: {
    color: "#F59E0B",
    fontWeight: 900,
    fontSize: 12,
  },
  title: { fontSize: 28, fontWeight: "900", color: "#ffffff" },
  subtitle: { fontSize: 14, color: "#64748b", marginBottom: 30 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  // Tool Card Styling
  toolCard: {
    width: width / 2 - 24,
    height: 140,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
    elevation: 3,
  },
  toolText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },

  // Tier & Status Styles
  tierBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  lockIcon: { position: "absolute", bottom: 10, right: 10 },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: "#101828" },
  modalHeader: {
    backgroundColor: "#000c3a",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  closeButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 4,
  },
  scrollContent: { padding: 0 },
  toolWrapper: { width: "100%" },

  // Placeholder Tool UI (for Gold/Premium tier tools)
  toolPlaceholder: {
    fontSize: 18,
    color: "#64748b",
    textAlign: "center",
    marginTop: 50,
    padding: 20,
  },
  actionBtn: {
    backgroundColor: "#000105",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  actionBtnText: { color: "#fff", fontWeight: "700" },
  // Search Bar Styles
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "#1e293b",
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    color: "#e2e8f0",
    fontSize: 14,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },

  // FAB Styling
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#F59E0B", // Matching your upgrade button color
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // FAB Modal Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  fabModalContent: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#475569",
    borderRadius: 3,
    marginBottom: 20,
  },
  fabModalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  fabOption: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    padding: 15,
    backgroundColor: "#0f172a",
    borderRadius: 12,
    marginBottom: 12,
  },
  fabOptionText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 15,
    fontWeight: "600",
  },
  closeOption: {
    backgroundColor: "transparent",
    justifyContent: "center",
    marginTop: 5,
  },
  closeOptionText: {
    color: "#ef4444",
    fontWeight: "700",
  },
});

export default ToolboxsScreen;
