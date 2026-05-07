// App.tsx
// Complete React Native Mobile Image Editor App
// Expo + TypeScript

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";

import Slider from "@react-native-community/slider";

import { manipulateAsync, SaveFormat, FlipType } from "expo-image-manipulator";

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [rotation, setRotation] = useState(0);

  const [selectedFilter, setSelectedFilter] = useState("normal");

  // PICK IMAGE
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setEditedImage(result.assets[0].uri);
    }
  };

  // ROTATE
  const rotateImage = async () => {
    if (!editedImage) return;

    setLoading(true);

    const result = await manipulateAsync(editedImage, [{ rotate: 90 }], {
      compress: 1,
      format: SaveFormat.PNG,
    });

    setEditedImage(result.uri);
    setRotation(rotation + 90);

    setLoading(false);
  };

  // FLIP
  const flipImage = async () => {
    if (!editedImage) return;

    setLoading(true);

    const result = await manipulateAsync(
      editedImage,
      [
        {
          flip: FlipType.Horizontal,
        },
      ],
      {
        compress: 1,
        format: SaveFormat.PNG,
      },
    );

    setEditedImage(result.uri);

    setLoading(false);
  };

  // CROP
  const cropImage = async () => {
    if (!editedImage) return;

    setLoading(true);

    const result = await manipulateAsync(
      editedImage,
      [
        {
          crop: {
            originX: 0,
            originY: 0,
            width: 300,
            height: 300,
          },
        },
      ],
      {
        compress: 1,
        format: SaveFormat.PNG,
      },
    );

    setEditedImage(result.uri);

    setLoading(false);
  };

  // SAVE IMAGE
  const saveImage = async () => {
    if (!editedImage) return;

    const permission = await MediaLibrary.requestPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow media access.");
      return;
    }

    await MediaLibrary.saveToLibraryAsync(editedImage);

    Alert.alert("Success", "Image saved successfully!");
  };

  // RESET
  const resetImage = () => {
    if (!image) return;

    setEditedImage(image);
    setRotation(0);
    setSelectedFilter("normal");
  };

  // FILTERS
  const getFilterStyle = (filter: string) => {
    switch (filter) {
      case "grayscale":
        return {
          tintColor: "#808080",
          opacity: 0.8,
        };

      case "sepia":
        return {
          tintColor: "#704214",
          opacity: 0.7,
        };

      case "bright":
        return {
          opacity: 1,
        };

      case "dark":
        return {
          opacity: 0.5,
        };

      default:
        return {};
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* <Text style={styles.title}>Mobile Image Editor</Text> */}

      {!editedImage ? (
        <TouchableOpacity style={styles.pickBtn} onPress={pickImage}>
          <Text style={styles.btnText}>Pick Image</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Image
            source={{ uri: editedImage }}
            style={[styles.image, getFilterStyle(selectedFilter)]}
          />

          {loading && <ActivityIndicator size="large" color="#000" />}

          {/* CONTROLS */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlBtn} onPress={rotateImage}>
              <Text style={styles.controlText}>Rotate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn} onPress={flipImage}>
              <Text style={styles.controlText}>Flip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn} onPress={cropImage}>
              <Text style={styles.controlText}>Crop</Text>
            </TouchableOpacity>
          </View>

          {/* FILTERS */}
          <Text style={styles.sectionTitle}>Filters</Text>

          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => setSelectedFilter("normal")}
            >
              <Text style={styles.filterText}>Normal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => setSelectedFilter("grayscale")}
            >
              <Text style={styles.filterText}>B&W</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => setSelectedFilter("sepia")}
            >
              <Text style={styles.filterText}>Sepia</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => setSelectedFilter("bright")}
            >
              <Text style={styles.filterText}>Bright</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => setSelectedFilter("dark")}
            >
              <Text style={styles.filterText}>Dark</Text>
            </TouchableOpacity>
          </View>

          {/* ROTATION SLIDER */}
          <Text style={styles.sectionTitle}>Rotation: {rotation}°</Text>

          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={360}
            step={90}
            value={rotation}
            minimumTrackTintColor="#2563eb"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#2563eb"
          />

          {/* ACTION BUTTONS */}
          <View style={styles.bottomButtons}>
            <TouchableOpacity style={styles.resetBtn} onPress={resetImage}>
              <Text style={styles.btnText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={saveImage}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 50,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#111",
  },

  image: {
    width: 320,
    height: 420,
    borderRadius: 20,
    resizeMode: "cover",
    marginBottom: 20,
  },

  controls: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  controlBtn: {
    backgroundColor: "#111",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
  },

  controlText: {
    color: "#fff",
    fontWeight: "600",
  },

  pickBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 16,
  },

  saveBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 14,
  },

  resetBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 14,
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 10,
    color: "#111",
  },

  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },

  filterBtn: {
    backgroundColor: "#222",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
  },

  filterText: {
    color: "#fff",
    fontWeight: "600",
  },

  slider: {
    width: "100%",
    height: 40,
  },

  bottomButtons: {
    flexDirection: "row",
    gap: 15,
    marginTop: 25,
  },
});

// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   ScrollView,
//   ActivityIndicator,
// } from "react-native";
// import * as ImagePicker from "expo-image-picker";
// import Slider from "@react-native-community/slider";
// import { FlipType, manipulateAsync, SaveFormat } from "expo-image-manipulator";
// import * as MediaLibrary from "expo-media-library";

// export default function App() {
//   const [image, setImage] = useState<string | null>(null);
//   const [editedImage, setEditedImage] = useState<string | null>(null);
//   const [rotation, setRotation] = useState(0);
//   const [loading, setLoading] = useState(false);

//   // Pick image from gallery
//   const pickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       quality: 1,
//       allowsEditing: false,
//     });

//     if (!result.canceled) {
//       setImage(result.assets[0].uri);
//       setEditedImage(result.assets[0].uri);
//     }
//   };

//   // Rotate image
//   const rotateImage = async () => {
//     if (!editedImage) return;

//     setLoading(true);

//     const result = await manipulateAsync(editedImage, [{ rotate: 90 }], {
//       compress: 1,
//       format: SaveFormat.PNG,
//     });

//     setEditedImage(result.uri);
//     setRotation(rotation + 90);
//     setLoading(false);
//   };

//   // Flip image
//   const flipImage = async () => {
//     if (!editedImage) return;

//     setLoading(true);

//     const result = await manipulateAsync(
//       editedImage,
//       // [{ flip: "horizontal" }],
//       [{ flip: FlipType.Horizontal }],
//       {
//         compress: 1,
//         format: SaveFormat.PNG,
//       },
//     );

//     setEditedImage(result.uri);
//     setLoading(false);
//   };

//   // Crop image
//   const cropImage = async () => {
//     if (!editedImage) return;

//     setLoading(true);

//     const result = await manipulateAsync(
//       editedImage,
//       [
//         {
//           crop: {
//             originX: 0,
//             originY: 0,
//             width: 300,
//             height: 300,
//           },
//         },
//       ],
//       {
//         compress: 1,
//         format: SaveFormat.PNG,
//       },
//     );

//     setEditedImage(result.uri);
//     setLoading(false);
//   };

//   // Save image
//   const saveImage = async () => {
//     if (!editedImage) return;

//     const permission = await MediaLibrary.requestPermissionsAsync();

//     if (permission.granted) {
//       await MediaLibrary.saveToLibraryAsync(editedImage);
//       alert("Image saved successfully!");
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <Text style={styles.title}>Mobile Image Editor</Text>

//       {!editedImage ? (
//         <TouchableOpacity style={styles.pickBtn} onPress={pickImage}>
//           <Text style={styles.btnText}>Pick Image</Text>
//         </TouchableOpacity>
//       ) : (
//         <>
//           <Image source={{ uri: editedImage }} style={styles.image} />

//           {loading && <ActivityIndicator size="large" color="#000" />}

//           <View style={styles.controls}>
//             <TouchableOpacity style={styles.controlBtn} onPress={rotateImage}>
//               <Text style={styles.controlText}>Rotate</Text>
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.controlBtn} onPress={flipImage}>
//               <Text style={styles.controlText}>Flip</Text>
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.controlBtn} onPress={cropImage}>
//               <Text style={styles.controlText}>Crop</Text>
//             </TouchableOpacity>
//           </View>

//           <Text style={styles.label}>Rotation: {rotation}°</Text>

//           <Slider
//             style={{ width: "100%", height: 40 }}
//             minimumValue={0}
//             maximumValue={360}
//             step={90}
//             value={rotation}
//             onValueChange={(value) => setRotation(value)}
//           />

//           <TouchableOpacity style={styles.saveBtn} onPress={saveImage}>
//             <Text style={styles.btnText}>Save Image</Text>
//           </TouchableOpacity>
//         </>
//       )}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     backgroundColor: "#fff",
//     alignItems: "center",
//     padding: 20,
//     paddingTop: 60,
//   },

//   title: {
//     fontSize: 28,
//     fontWeight: "bold",
//     marginBottom: 20,
//   },

//   image: {
//     width: 320,
//     height: 420,
//     borderRadius: 20,
//     resizeMode: "cover",
//     marginBottom: 20,
//   },

//   controls: {
//     flexDirection: "row",
//     gap: 10,
//     marginBottom: 20,
//   },

//   controlBtn: {
//     backgroundColor: "#111",
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 12,
//   },

//   controlText: {
//     color: "#fff",
//     fontWeight: "600",
//   },

//   pickBtn: {
//     backgroundColor: "#2563eb",
//     paddingVertical: 14,
//     paddingHorizontal: 30,
//     borderRadius: 14,
//   },

//   saveBtn: {
//     marginTop: 20,
//     backgroundColor: "#16a34a",
//     paddingVertical: 14,
//     paddingHorizontal: 30,
//     borderRadius: 14,
//   },

//   btnText: {
//     color: "#fff",
//     fontWeight: "bold",
//     fontSize: 16,
//   },

//   label: {
//     marginTop: 10,
//     fontSize: 16,
//     fontWeight: "600",
//   },
// });
