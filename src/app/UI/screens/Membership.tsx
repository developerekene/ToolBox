import React from "react";
import { StyleSheet, Text, View } from "react-native";

const Membership: React.FC = () => {
    return (
        <View style={styles.container}>
            <Text>Membership</Text>
        </View>
    );
};

export default Membership;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
});