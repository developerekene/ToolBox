import { SafeAreaProvider } from 'react-native-safe-area-context';
import ToolboxsScreen from './src/app/UI/screens/toolbox/ToolboxScreen';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import Toast from 'react-native-toast-message';

export default function App() {

  useEffect(() => {
    const setupPurchases = async () => {
      // 1. Set log level
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

      // 2. Check if already configured to avoid the warning
      const isConfigured = await Purchases.isConfigured();
      if (isConfigured) return;

      const iosApiKey = 'test_wHfPrvFWOQqFHnAoAWHndgLiMWg';
      const androidApiKey = 'test_wHfPrvFWOQqFHnAoAWHndgLiMWg';

      if (Platform.OS === 'ios') {
        Purchases.configure({ apiKey: iosApiKey });
      } else if (Platform.OS === 'android') {
        Purchases.configure({ apiKey: androidApiKey });
      }
    };

    setupPurchases();
  }, []);

  return (
    <SafeAreaProvider>
      <ToolboxsScreen />
      <Toast />
    </SafeAreaProvider>
  );
}