import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import VersionBadge from "../../../component/VersionBadge";

const CropToolScreen: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>("free");

  const aspectRatios = [
    { label: "Free", value: "free" },
    { label: "1:1", value: "1:1" },
    { label: "4:3", value: "4:3" },
    { label: "16:9", value: "16:9" },
  ];

  const getAspect = (): [number, number] | undefined => {
    switch (aspectRatio) {
      case "1:1":
        return [1, 1];
      case "4:3":
        return [4, 3];
      case "16:9":
        return [16, 9];
      default:
        return undefined;
    }
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "Permission to access camera roll is required!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], //  SDK 52+: replaces MediaTypeOptions.Images
      allowsEditing: true,
      aspect: getAspect(),
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "Permission to access camera is required!",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: getAspect(),
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const saveImage = async () => {
    if (!selectedImage) {
      Alert.alert("No Image", "Please select or capture an image first");
      return;
    }

    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.granted) {
        await MediaLibrary.saveToLibraryAsync(selectedImage);
        Alert.alert("Success", "Image saved to gallery!");
      } else {
        Alert.alert(
          "Permission Required",
          "Permission to save to gallery is required!",
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save image");
      console.error("Save error:", error);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
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
        <Text style={styles.headerText}>Image Crop Tool</Text>
        <Text style={styles.subheaderText}>
          Select, crop, and save your images
        </Text>
      </View>

      {/* Aspect Ratio Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Aspect Ratio</Text>
        <View style={styles.aspectRatioContainer}>
          {aspectRatios.map((ratio) => (
            <TouchableOpacity
              key={ratio.value}
              style={[
                styles.aspectRatioButton,
                aspectRatio === ratio.value && styles.aspectRatioButtonActive,
              ]}
              onPress={() => setAspectRatio(ratio.value)}
            >
              <Text
                style={[
                  styles.aspectRatioText,
                  aspectRatio === ratio.value && styles.aspectRatioTextActive,
                ]}
              >
                {ratio.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Image Preview */}
      {selectedImage ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: selectedImage }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          <View style={styles.imageActions}>
            <TouchableOpacity
              style={styles.imageActionButton}
              onPress={clearImage}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
              <Text style={styles.imageActionText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageActionButton}
              onPress={saveImage}
            >
              <Ionicons name="checkmark-circle" size={24} color="#34D399" />
              <Text style={styles.imageActionText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Ionicons name="image-outline" size={80} color="#334155" />
          <Text style={styles.placeholderText}>No image selected</Text>
          <Text style={styles.placeholderSubtext}>
            Choose an image from gallery or take a photo
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.galleryButton]}
          onPress={pickImage}
        >
          <Ionicons name="images-outline" size={24} color="#fff" />
          <Text style={styles.buttonText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.cameraButton]}
          onPress={takePhoto}
        >
          <Ionicons name="camera-outline" size={24} color="#fff" />
          <Text style={styles.buttonText}>Camera</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <View style={styles.instructionRow}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.instructionText}>
            Select an aspect ratio before choosing or capturing an image
          </Text>
        </View>
        <View style={styles.instructionRow}>
          <Ionicons name="resize-outline" size={20} color="#10B981" />
          <Text style={styles.instructionText}>
            Pinch and drag to adjust the crop area
          </Text>
        </View>
        <View style={styles.instructionRow}>
          <Ionicons name="save-outline" size={20} color="#8B5CF6" />
          <Text style={styles.instructionText}>
            Save the cropped image to your gallery
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default CropToolScreen;

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
  section: {
    marginBottom: 24,
  },
  label: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  aspectRatioContainer: {
    flexDirection: "row",
    gap: 12,
  },
  aspectRatioButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
  },
  aspectRatioButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  aspectRatioText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },
  aspectRatioTextActive: {
    color: "#fff",
  },
  imageContainer: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  previewImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  imageActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  imageActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  imageActionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  placeholderContainer: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#334155",
    borderStyle: "dashed",
  },
  placeholderText: {
    color: "#CBD5E1",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  placeholderSubtext: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
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
  galleryButton: {
    backgroundColor: "#8B5CF6",
  },
  cameraButton: {
    backgroundColor: "#3B82F6",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  instructionsCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  instructionText: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
  },
});
