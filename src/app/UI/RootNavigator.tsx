import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import ToolboxsScreen from "./screens/toolbox/ToolboxScreen";

const Stack = createNativeStackNavigator();

const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <SafeAreaView style={styles.container}>
        <Stack.Navigator
          initialRouteName="home"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="home" component={ToolboxsScreen} />
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
};

export default RootNavigator;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

// import React from "react";
// import { NavigationContainer } from "@react-navigation/native";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import { StyleSheet } from "react-native";
// import ToolboxsScreen from "./screens/toolbox/ToolboxScreen";
// import Contact from "./screens/toolbox/Contact";

// const Stack = createNativeStackNavigator();

// const RootNavigator: React.FC = () => {
//   return (
//     <SafeAreaProvider>
//       <NavigationContainer>
//         <Stack.Navigator
//           initialRouteName="home"
//           screenOptions={{ headerShown: false }}
//         >
//           <Stack.Screen name="home" component={ToolboxsScreen} />
//           <Stack.Screen name="Contact" component={Contact} />
//         </Stack.Navigator>
//       </NavigationContainer>
//     </SafeAreaProvider>
//   );
// };

// export default RootNavigator;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#000105",
//   },
// });
