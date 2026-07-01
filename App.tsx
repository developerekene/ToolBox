import { SafeAreaProvider } from 'react-native-safe-area-context';
import ToolboxsScreen from './src/app/UI/screens/toolbox/ToolboxScreen';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import { store } from './src/app/Redux/store';

export default function App() {

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ToolboxsScreen />
        <Toast />
      </SafeAreaProvider>
    </Provider>
  );
}