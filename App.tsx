import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from "./src/app/UI/RootNavigator";
import ToolboxsScreen from './src/app/UI/screens/toolbox/ToolboxScreen';
export default function App() {
  return (
    <SafeAreaProvider>
      <ToolboxsScreen />
      {/* <RootNavigator /> */}
    </SafeAreaProvider>
  );
}
