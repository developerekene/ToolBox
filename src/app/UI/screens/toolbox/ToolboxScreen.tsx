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

// Membership Modal
import MembershipModal, { Tier } from "./MembershipModal";
import CheckoutModal from "./CheckoutModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { tools } from "../../../utils/constant/data";

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

  const isTierAccessible = (required: string) => {
    const tiers = ["Silver", "Gold", "Platinum"];
    return tiers.indexOf(userTier) >= tiers.indexOf(required);
  };

  // Load saved tier on mount(firebase auth integration would go here in a real application)
  // useEffect(() => {
  //   AsyncStorage.getItem("userTier").then((saved) => {
  //     if (saved) setUserTier(saved as Tier);
  //     setTierLoaded(true);
  //   });
  // }, []);

  // monthly expiry (for auto-downgrade)
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
  // useEffect(() => {
  //   const loadUser = async () => {
  //     const savedTier = await AsyncStorage.getItem("userTier");
  //     if (savedTier) setUserTier(savedTier as Tier);
  //     setTierLoaded(true);
  //   };
  //   loadUser();
  // }, []);

  // Save tier when it changes
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
              handleUpgrade(tier); // ✅ saves to AsyncStorage + unlocks tools
              setCheckoutVisible(false);
            }}
            // onSuccess={(tier) => {
            //   setUserTier(tier); // unlocks tools right away
            //   setCheckoutVisible(false);
            // }}
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
});

export default ToolboxsScreen;

// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Modal,
//   Dimensions,
//   ScrollView,
// } from "react-native";
// import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

// // Silver Tools
// import CropToolScreen from "./silver/CropToolScreen";
// import WordCounterScreen from "./silver/WordCounterScreen";
// import TranslatorScreen from "./silver/TranslatorScreen";
// import ScientificCalculator from "./silver/ScientificCalculator";
// import BMICalculator from "./silver/BMICalculator";
// import TipCalculator from "./silver/TipCalculator";
// import UnitConverter from "./silver/UnitConverter";
// import LoanCalculator from "./gold/LoanCalculator";
// import ORScanner from "./silver/ORScanner";

// // Gold Tools
// import QRGeneratorScreen from "./gold/QRGeneratorScreen";
// import PdfScannerScreen from "./gold/PdfScannerScreen";
// import ImageCompressScreen from "./gold/ImageCompressScreen";
// import DiscountCalc from "./gold/DiscountCalc";

// // Platinum Tools
// import VideoTrimScreen from "./platinium/VideoTrimScreen";
// import AudioRec from "./platinium/AudioRec";
// import ZipCreator from "./platinium/ZipCreator";
// import NotesPro from "./platinium/NotesPro";
// import EncoderDecoder from "./platinium/EncoderDecoder";
// import CurrencyConverter from "./platinium/CurrencyConverter";
// import InvestmentCalc from "./platinium/InvestmentCalc";
// import FuelCostCalc from "./platinium/FuelCostCalc";
// import MortgageCalc from "./platinium/MortgageCalc";

// // Membership Modal
// import MembershipModal, { Tier } from "./MembershipModal";
// import CheckoutModal from "./CheckoutModal";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { tools } from "../../../utils/constant/data";

// const ToolboxsScreen: React.FC = () => {
//   const handleClose = () => {
//     setSelectedTool(null);
//   };

//   const [selectedTool, setSelectedTool] = useState<string | null>(null);
//   const [userTier, setUserTier] = useState<Tier>("Silver");
//   const [membershipVisible, setMembershipVisible] = useState(false);

//   const [checkoutVisible, setCheckoutVisible] = useState(false);
//   const [checkoutTier, setCheckoutTier] = useState<Tier>("Gold");
//   const [tierLoaded, setTierLoaded] = useState(false);

//   const isTierAccessible = (required: string) => {
//     const tiers = ["Silver", "Gold", "Platinum"];
//     return tiers.indexOf(userTier) >= tiers.indexOf(required);
//   };

//   // Load saved tier on mount(firebase auth integration would go here in a real application)
//   // useEffect(() => {
//   //   AsyncStorage.getItem("userTier").then((saved) => {
//   //     if (saved) setUserTier(saved as Tier);
//   //     setTierLoaded(true);
//   //   });
//   // }, []);

//   // monthly expiry (for auto-downgrade)
//   useEffect(() => {
//     const loadUser = async () => {
//       const savedTier = await AsyncStorage.getItem("userTier");
//       const savedExpiry = await AsyncStorage.getItem("tierExpiry");

//       if (savedTier && savedExpiry) {
//         const expiry = new Date(savedExpiry);
//         const now = new Date();

//         if (now > expiry) {
//           // Subscription expired — downgrade to Silver
//           await AsyncStorage.setItem("userTier", "Silver");
//           await AsyncStorage.removeItem("tierExpiry");
//           setUserTier("Silver");
//         } else {
//           setUserTier(savedTier as Tier);
//         }
//       }

//       setTierLoaded(true);
//     };
//     loadUser();
//   }, []);
//   // useEffect(() => {
//   //   const loadUser = async () => {
//   //     const savedTier = await AsyncStorage.getItem("userTier");
//   //     if (savedTier) setUserTier(savedTier as Tier);
//   //     setTierLoaded(true);
//   //   };
//   //   loadUser();
//   // }, []);

//   // Save tier when it changes
//   const handleUpgrade = (tier: Tier) => {
//     setUserTier(tier);
//     AsyncStorage.setItem("userTier", tier);
//   };

//   const renderToolContent = (toolName: string) => {
//     // Shared wrapper style for consistency
//     const ToolView = ({ children }: { children: React.ReactNode }) => (
//       <View style={styles.toolWrapper}>{children}</View>
//     );

//     switch (toolName) {
//       // Silver tier tools
//       case "Crop Tool":
//         return <CropToolScreen />;

//       case "Word Counter":
//         return <WordCounterScreen />;

//       case "Translator":
//         return <TranslatorScreen />;

//       case "Scientific Calculator":
//         return <ScientificCalculator />;

//       case "BMI Calculator":
//         return <BMICalculator />;

//       case "Tip Calculator":
//         return <TipCalculator />;

//       case "Unit Converter":
//         return <UnitConverter />;

//       case "Loan Calculator":
//         return <LoanCalculator />;

//       // gold tier tools
//       case "PDF Scanner":
//         return <PdfScannerScreen />;

//       case "QR Code Generator":
//         return <QRGeneratorScreen />;

//       case "Image Compress":
//         return <ImageCompressScreen />;

//       case "Discount Calc":
//         return <DiscountCalc />;

//       // Platinum tier tools
//       case "Audio Rec":
//         return <AudioRec />;

//       case "Video Trim":
//         return <VideoTrimScreen />;

//       case "Zip Creator":
//         return <ZipCreator />;

//       case "Notes Pro":
//         return <NotesPro />;

//       case "QR Scanner":
//         return <ORScanner />;

//       case "Encoder / Decoder":
//         return <EncoderDecoder />;

//       case "Currency Converter":
//         return <CurrencyConverter />;

//       case "Investment Calc":
//         return <InvestmentCalc />;

//       case "Fuel Cost Calc":
//         return <FuelCostCalc />;

//       case "Mortgage Calc":
//         return <MortgageCalc />;

//       default:
//         return (
//           <Text style={styles.toolPlaceholder}>Tool Interface Coming Soon</Text>
//         );
//     }
//   };
//   if (!tierLoaded) return null; // or a loading spinner
//   return (
//     <View style={styles.container}>
//       <View style={styles.buttonContainerMain}>
//         <View>
//           <Text style={styles.title}>Toolbox</Text>
//           <Text style={styles.subtitle}>
//             Utility tools for your daily tasks
//           </Text>
//         </View>
//         <View style={styles.buttonContainer}>
//           <TouchableOpacity
//             style={styles.subtitle}
//             onPress={() => setMembershipVisible(true)}
//           >
//             <Text style={styles.btnText}>Upgrade Membership</Text>
//           </TouchableOpacity>
//           {/* modal */}

//           <MembershipModal
//             visible={membershipVisible}
//             currentTier={userTier}
//             onClose={() => setMembershipVisible(false)}
//             onUpgrade={(tier) => {
//               if (tier === "Silver") {
//                 // setUserTier(tier); // downgrade immediately, no checkout
//                 handleUpgrade(tier); // ✅ saves downgrade to AsyncStorage too
//               } else {
//                 setCheckoutTier(tier);
//                 setCheckoutVisible(true);
//               }
//               setMembershipVisible(false);
//             }}
//           />
//           <CheckoutModal
//             visible={checkoutVisible}
//             tier={checkoutTier}
//             onClose={() => setCheckoutVisible(false)}
//             onSuccess={(tier) => {
//               handleUpgrade(tier); // ✅ saves to AsyncStorage + unlocks tools
//               setCheckoutVisible(false);
//             }}
//             // onSuccess={(tier) => {
//             //   setUserTier(tier); // unlocks tools right away
//             //   setCheckoutVisible(false);
//             // }}
//           />
//         </View>
//       </View>

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 20 }}
//       >
//         <View style={styles.grid}>
//           {tools.map((tool) => {
//             const isLocked = !isTierAccessible(tool.requiredTier);
//             return (
//               <TouchableOpacity
//                 key={tool.id}
//                 style={[
//                   styles.toolCard,
//                   { backgroundColor: tool.color, opacity: isLocked ? 0.5 : 1 },
//                 ]}
//                 onPress={() => !isLocked && setSelectedTool(tool.title)}
//                 disabled={isLocked}
//               >
//                 <View style={styles.tierBadge}>
//                   <Text style={styles.tierBadgeText}>{tool.requiredTier}</Text>
//                 </View>
//                 <FontAwesome5 name={tool.icon as any} size={28} color="#fff" />
//                 <Text style={styles.toolText}>{tool.title}</Text>
//                 {isLocked && (
//                   <Ionicons
//                     name="lock-closed"
//                     size={18}
//                     color="#fff"
//                     style={styles.lockIcon}
//                   />
//                 )}
//               </TouchableOpacity>
//             );
//           })}
//         </View>
//       </ScrollView>

//       <Modal visible={!!selectedTool} animationType="slide">
//         <View style={styles.modalContainer}>
//           <View style={styles.modalHeader}>
//             <Text style={styles.modalTitle}>{selectedTool}</Text>
//             <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
//               <Ionicons name="close" size={26} color="#fff" />
//             </TouchableOpacity>
//           </View>
//           <ScrollView contentContainerStyle={styles.scrollContent}>
//             {selectedTool && renderToolContent(selectedTool)}
//           </ScrollView>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const { width } = Dimensions.get("window");

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#000105",
//     padding: 16,
//     paddingTop: 60,
//   },
//   buttonContainerMain: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   buttonContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     flexDirection: "row",
//   },
//   btnText: {
//     color: "#F59E0B",
//     fontWeight: 900,
//     fontSize: 12,
//   },
//   title: { fontSize: 28, fontWeight: "900", color: "#ffffff" },
//   subtitle: { fontSize: 14, color: "#64748b", marginBottom: 30 },
//   grid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-between",
//   },

//   // Tool Card Styling
//   toolCard: {
//     width: width / 2 - 24,
//     height: 140,
//     borderRadius: 16,
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 16,
//     position: "relative",
//     elevation: 3,
//   },
//   toolText: {
//     color: "#fff",
//     fontWeight: "700",
//     fontSize: 14,
//     marginTop: 10,
//     textAlign: "center",
//   },

//   // Tier & Status Styles
//   tierBadge: {
//     position: "absolute",
//     top: 10,
//     right: 10,
//     backgroundColor: "rgba(0,0,0,0.3)",
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 6,
//   },
//   tierBadgeText: {
//     color: "#fff",
//     fontSize: 9,
//     fontWeight: "bold",
//     textTransform: "uppercase",
//   },
//   lockIcon: { position: "absolute", bottom: 10, right: 10 },

//   // Modal Styles
//   modalContainer: { flex: 1, backgroundColor: "#101828" },
//   modalHeader: {
//     backgroundColor: "#000c3a",
//     paddingTop: 50,
//     paddingBottom: 20,
//     paddingHorizontal: 20,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
//   closeButton: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 10,
//     padding: 4,
//   },
//   scrollContent: { padding: 0 },
//   toolWrapper: { width: "100%" },

//   // Placeholder Tool UI (for Gold/Premium tier tools)
//   toolPlaceholder: {
//     fontSize: 18,
//     color: "#64748b",
//     textAlign: "center",
//     marginTop: 50,
//     padding: 20,
//   },
//   actionBtn: {
//     backgroundColor: "#000105",
//     padding: 16,
//     borderRadius: 14,
//     alignItems: "center",
//     marginTop: 20,
//   },
//   actionBtnText: { color: "#fff", fontWeight: "700" },
// });

// export default ToolboxsScreen;
