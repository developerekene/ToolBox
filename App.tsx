import { SafeAreaProvider } from 'react-native-safe-area-context';
import mobileAds from 'react-native-google-mobile-ads';
import ToolboxsScreen from './src/app/UI/screens/toolbox/ToolboxScreen';


export default function App() {

  // mobileAds()
  //   .initialize()
  //   .then(adapterStatuses => {
  //     console.log('AdMob Initialized');
  //   });

  return (
    <SafeAreaProvider>
      <ToolboxsScreen />
    </SafeAreaProvider>
  );
}
