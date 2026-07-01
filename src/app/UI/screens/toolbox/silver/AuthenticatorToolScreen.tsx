import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import VersionBadge from "../../../component/VersionBadge";
import { RootState } from "../../../../Redux/store";
import { Modal, TextInput } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../../../../Redux/slices/userSlice";
import { authService } from "../../../../Redux/slices/configuration/auth.service";

const AuthenticatorToolScreen: React.FC = () => {
    const [code, setCode] = useState("------");
    const userData = useSelector((state: RootState) => state.user);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    const dispatch = useDispatch();

    const [showRegisterModal, setShowRegisterModal] = useState(false);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const generateRandomCode = async () => {
        const random = Math.floor(Math.random() * 1000000);
        const sixDigitCode = random.toString().padStart(6, "0");
        await authService.uploadOTP(sixDigitCode).then(() => {
            setCode(sixDigitCode);
        }).catch((err) => {
            Alert.alert(`Failed", "Could not generate OTP. Try again. ${err}`);
        })
    };

    const generateCode = () => {
        const userExists = userData.firstName.trim() !== "";

        if (userExists) {
            generateRandomCode();
        } else {
            setShowRegisterModal(true);
        }
    };

    const registerUser = async () => {
        if (
            !firstName.trim() ||
            !lastName.trim() ||
            !email.trim() ||
            !password.trim()
        ) {
            Alert.alert("Missing Information", "Please complete all fields.");
            return;
        }

        await authService.handleUserRegistration({ firstName: firstName, lastName: lastName, email: email, password: password }).then(() => {
            setShowRegisterModal(false);

            setFirstName("");
            setLastName("");
            setEmail("");
            setPassword("");

            generateRandomCode();

            Alert.alert("Success", "User registered successfully.");
        }).catch((err) => {
            Alert.alert(`Failed", "User registration failed, ${err}`);
        })


    };

    const loginUser = async () => {
        await authService.handleUserLoginWithEmailPassword(loginEmail, loginPassword).then(() => {
            setShowLoginModal(false);

            setFirstName("");
            setLastName("");
            setEmail("");
            setPassword("");

            generateRandomCode();

            Alert.alert("Success", "User login successfully.");
        }).catch((err) => {
            Alert.alert(`Failed", "User login failed, ${err}`);
        })
    }

    const copyCode = async () => {
        if (code === "------") {
            Alert.alert("No Code", "Generate a code first.");
            return;
        }

        await Clipboard.setStringAsync(code);
        Alert.alert("Copied", "6-digit code copied to clipboard.");
    };

    const clearCode = () => {
        setCode("------");
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            <VersionBadge version="0.01" />

            <View style={styles.header}>
                <Text style={styles.headerText}>Authenticator Tool</Text>
                <Text style={styles.subheaderText}>
                    Generate a random 6-digit authentication code
                </Text>
            </View>

            <TouchableOpacity
                style={styles.generateButton}
                onPress={generateCode}
            >
                <Ionicons name="refresh-outline" size={24} color="#fff" />
                <Text style={styles.buttonText}>Generate Code</Text>
            </TouchableOpacity>

            <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>Generated Code</Text>

                <Text style={styles.code}>{code}</Text>

                <TouchableOpacity
                    style={styles.copyButton}
                    onPress={copyCode}
                >
                    <Ionicons name="copy-outline" size={22} color="#fff" />
                    <Text style={styles.copyText}>Copy Code</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.clearButton]}
                    onPress={clearCode}
                >
                    <Ionicons name="trash-outline" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Clear</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.instructionsCard}>
                <View style={styles.instructionRow}>
                    <Ionicons
                        name="refresh-circle-outline"
                        size={20}
                        color="#3B82F6"
                    />
                    <Text style={styles.instructionText}>
                        Tap "Generate Code" to create a new random 6-digit code.
                    </Text>
                </View>

                <View style={styles.instructionRow}>
                    <Ionicons
                        name="copy-outline"
                        size={20}
                        color="#10B981"
                    />
                    <Text style={styles.instructionText}>
                        Copy the generated code to your clipboard with one tap.
                    </Text>
                </View>

                <View style={styles.instructionRow}>
                    <Ionicons
                        name="shield-checkmark-outline"
                        size={20}
                        color="#8B5CF6"
                    />
                    <Text style={styles.instructionText}>
                        This tool generates random numeric codes. It is not compatible with
                        Google Authenticator or TOTP-based 2FA services.
                    </Text>
                </View>
            </View>
            <Modal
                visible={showRegisterModal}
                transparent
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>
                            Join our community
                        </Text>

                        <Text style={styles.modalSubtitle}>
                            To continue, sign up if you don't already have an <Text style={{ fontWeight: "bold", color: "#3B82F6" }}>iLead account</Text>.
                        </Text>

                        <TextInput
                            placeholder="First Name"
                            placeholderTextColor="#64748B"
                            style={styles.input}
                            value={firstName}
                            onChangeText={setFirstName}
                        />

                        <TextInput
                            placeholder="Last Name"
                            placeholderTextColor="#64748B"
                            style={styles.input}
                            value={lastName}
                            onChangeText={setLastName}
                        />

                        <TextInput
                            placeholder="Email"
                            placeholderTextColor="#64748B"
                            style={styles.input}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Password"
                                placeholderTextColor="#64748B"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />

                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={22}
                                    color="#CBD5E1"
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.registerButton}
                            onPress={registerUser}
                        >
                            <Text style={styles.registerButtonText}>
                                Join Community
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setShowRegisterModal(false);
                                setShowLoginModal(true);
                            }}
                        >
                            <Text style={styles.linkText}>
                                Already have an account?{" "}
                                <Text style={styles.linkHighlight}>
                                    Sign In
                                </Text>
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowRegisterModal(false)}
                        >
                            <Text style={styles.cancelText}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal
                visible={showLoginModal}
                transparent
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>
                            Welcome Back
                        </Text>

                        <Text style={styles.modalSubtitle}>
                            Sign in using your <Text style={{ fontWeight: "bold", color: "#3B82F6" }}>iLead account</Text>.
                        </Text>

                        <TextInput
                            placeholder="Email"
                            placeholderTextColor="#64748B"
                            style={styles.input}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={loginEmail}
                            onChangeText={setLoginEmail}
                        />

                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Password"
                                placeholderTextColor="#64748B"
                                secureTextEntry={!showLoginPassword}
                                value={loginPassword}
                                onChangeText={setLoginPassword}
                            />

                            <TouchableOpacity
                                onPress={() =>
                                    setShowLoginPassword(!showLoginPassword)
                                }
                            >
                                <Ionicons
                                    name={
                                        showLoginPassword
                                            ? "eye-off-outline"
                                            : "eye-outline"
                                    }
                                    size={22}
                                    color="#CBD5E1"
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.registerButton}
                            onPress={loginUser}
                        >
                            <Text style={styles.registerButtonText}>
                                Sign In
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setShowLoginModal(false);
                                setShowRegisterModal(true);
                            }}
                        >
                            <Text style={styles.linkText}>
                                Don't have an account?{" "}
                                <Text style={styles.linkHighlight}>
                                    Join our community
                                </Text>
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowLoginModal(false)}
                        >
                            <Text style={styles.cancelText}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

export default AuthenticatorToolScreen;

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
    generateButton: {
        backgroundColor: "#3B82F6",
        borderRadius: 12,
        paddingVertical: 16,
        marginBottom: 24,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    codeCard: {
        backgroundColor: "#1E293B",
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#334155",
        marginBottom: 24,
    },
    codeLabel: {
        color: "#94A3B8",
        fontSize: 16,
    },
    code: {
        color: "#34D399",
        fontSize: 48,
        fontWeight: "700",
        letterSpacing: 8,
        marginVertical: 20,
    },
    copyButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#10B981",
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 14,
        gap: 10,
    },
    copyText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    buttonContainer: {
        marginBottom: 24,
    },
    button: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    clearButton: {
        backgroundColor: "#EF4444",
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

    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.7)",
    },

    modalContainer: {
        width: "90%",
        backgroundColor: "#1E293B",
        borderRadius: 16,
        padding: 20,
    },

    modalTitle: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 20,
    },

    input: {
        backgroundColor: "#0F172A",
        borderRadius: 10,
        color: "#fff",
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#334155",
    },

    registerButton: {
        backgroundColor: "#3B82F6",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 8,
    },

    registerButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },

    cancelText: {
        color: "#CBD5E1",
        textAlign: "center",
        marginTop: 18,
        fontSize: 16,
    },
    modalSubtitle: {
        color: "#CBD5E1",
        textAlign: "center",
        marginBottom: 20,
        fontSize: 15,
        lineHeight: 22,
    },

    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#0F172A",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#334155",
        paddingHorizontal: 14,
        marginBottom: 14,
    },

    passwordInput: {
        flex: 1,
        color: "#fff",
        paddingVertical: 14,
    },

    linkText: {
        color: "#CBD5E1",
        textAlign: "center",
        marginTop: 18,
        fontSize: 15,
    },

    linkHighlight: {
        color: "#3B82F6",
        fontWeight: "700",
    },
});