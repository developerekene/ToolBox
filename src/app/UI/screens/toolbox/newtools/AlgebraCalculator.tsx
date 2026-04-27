import { View, Text } from "react-native";
import React from "react";

const AlgebraCalculator = () => {
  return (
    <View>
      <Text>AlgebraCalculator</Text>
    </View>
  );
};

export default AlgebraCalculator;

// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   FlatList,
//   StyleSheet,
//   SafeAreaView,
// } from "react-native";
// import { WebView } from "react-native-webview";
// import nerdamer from "nerdamer/all.min";

// export default function App() {
//   const [input, setInput] = useState("");
//   const [result, setResult] = useState("");
//   const [history, setHistory] = useState([]);

//   // 🔢 Solve equation
//   const solve = () => {
//     try {
//       let res;

//       if (input.includes("=")) {
//         res = nerdamer.solve(input, "x").toString();
//       } else {
//         res = nerdamer(input).toString();
//       }

//       setResult(res);

//       setHistory((prev) => [
//         { id: Date.now().toString(), expr: input, res },
//         ...prev,
//       ]);
//     } catch (e) {
//       setResult("Invalid expression");
//     }
//   };

//   // 📊 Convert equation to graph format
//   const getGraphExpression = () => {
//     if (!input) return "";

//     if (input.includes("=")) {
//       return input.replace("=", "-(") + ")";
//     }

//     return input;
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <Text style={styles.title}>Algebra Calculator</Text>

//       {/* INPUT */}
//       <TextInput
//         style={styles.input}
//         placeholder="e.g. 2x + 3 = 7"
//         value={input}
//         onChangeText={setInput}
//       />

//       {/* BUTTON */}
//       <TouchableOpacity style={styles.button} onPress={solve}>
//         <Text style={styles.buttonText}>Solve</Text>
//       </TouchableOpacity>

//       {/* RESULT */}
//       <Text style={styles.result}>Result: {result}</Text>

//       {/* GRAPH */}
//       {input ? (
//         <View style={styles.graph}>
//           <WebView
//             originWhitelist={["*"]}
//             source={{
//               html: `
//               <html>
//                 <body style="margin:0">
//                   <div id="calculator" style="width:100%;height:100%;"></div>
//                   <script src="https://www.desmos.com/api/v1.6/calculator.js?apiKey=xyz"></script>
//                   <script>
//                     var elt = document.getElementById('calculator');
//                     var calculator = Desmos.GraphingCalculator(elt);
//                     calculator.setExpression({
//                       id: 'graph1',
//                       latex: '${getGraphExpression()}'
//                     });
//                   </script>
//                 </body>
//               </html>
//             `,
//             }}
//           />
//         </View>
//       ) : null}

//       {/* HISTORY */}
//       <Text style={styles.historyTitle}>History</Text>
//       <FlatList
//         data={history}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.historyItem}>
//             <Text>{item.expr}</Text>
//             <Text style={{ color: "#555" }}>{item.res}</Text>
//           </View>
//         )}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 15,
//     backgroundColor: "#fff",
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 10,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ddd",
//     padding: 12,
//     borderRadius: 10,
//     fontSize: 18,
//     marginBottom: 10,
//   },
//   button: {
//     backgroundColor: "#111",
//     padding: 14,
//     borderRadius: 10,
//     alignItems: "center",
//   },
//   buttonText: {
//     color: "#fff",
//     fontSize: 16,
//   },
//   result: {
//     fontSize: 18,
//     marginVertical: 10,
//   },
//   graph: {
//     height: 250,
//     marginVertical: 10,
//     borderRadius: 10,
//     overflow: "hidden",
//   },
//   historyTitle: {
//     fontSize: 18,
//     marginTop: 10,
//     marginBottom: 5,
//     fontWeight: "bold",
//   },
//   historyItem: {
//     padding: 10,
//     borderBottomWidth: 1,
//     borderColor: "#eee",
//   },
// });

// // import { View, Text } from "react-native";
// // import React from "react";

// // const AlgebraCalculator = () => {
// //   return (
// //     <View>
// //       <Text>AlgebraCalculator</Text>
// //     </View>
// //   );
// // };

// // export default AlgebraCalculator;
