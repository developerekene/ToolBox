import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import Toast from 'react-native-toast-message';

import ToolboxsScreen from './src/app/UI/screens/toolbox/ToolboxScreen';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <View style={styles.mainContainer}>
        <ToolboxsScreen />
      </View>
      <Toast />
      <SafeAreaView edges={['bottom']} style={styles.adContainer}>
        <BannerAd
          unitId={TestIds.BANNER}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  adContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});