import { StyleSheet, Text, View } from 'react-native'
import React from 'react';

const CropToolScreen: React.FC = () => {
    return (
        <View>
            <Text style={styles.header}>Crop Tool Screen</Text>
        </View>
    )
}

export default CropToolScreen

const styles = StyleSheet.create({
    header: {
        color: "#ffffff"
    }
})