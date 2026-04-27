import { View, Text } from "react-native";
import React from "react";

const Calender = () => {
  return (
    <View>
      <Text>Calender</Text>
    </View>
  );
};

export default Calender;

// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   FlatList,
//   TextInput,
// } from "react-native";
// import { Calendar } from "react-native-calendars";

// export default function App() {
//   const [selectedDate, setSelectedDate] = useState("");
//   const [events, setEvents] = useState({});
//   const [text, setText] = useState("");

//   const addEvent = () => {
//     if (!text || !selectedDate) return;

//     const newEvents = { ...events };
//     if (!newEvents[selectedDate]) newEvents[selectedDate] = [];

//     newEvents[selectedDate].push({ id: Date.now().toString(), title: text });
//     setEvents(newEvents);
//     setText("");
//   };

//   const deleteEvent = (id) => {
//     const newEvents = { ...events };
//     newEvents[selectedDate] = newEvents[selectedDate].filter(
//       (e) => e.id !== id,
//     );
//     setEvents(newEvents);
//   };

//   return (
//     <View style={{ flex: 1, paddingTop: 50 }}>
//       <Calendar
//         onDayPress={(day) => setSelectedDate(day.dateString)}
//         markedDates={{
//           [selectedDate]: { selected: true, marked: true },
//         }}
//       />

//       <View style={{ padding: 20 }}>
//         <Text style={{ fontSize: 18, fontWeight: "bold" }}>
//           Events on {selectedDate}
//         </Text>

//         <FlatList
//           data={events[selectedDate] || []}
//           keyExtractor={(item) => item.id}
//           renderItem={({ item }) => (
//             <View
//               style={{
//                 flexDirection: "row",
//                 justifyContent: "space-between",
//                 padding: 10,
//                 marginTop: 10,
//                 backgroundColor: "#eee",
//                 borderRadius: 10,
//               }}
//             >
//               <Text>{item.title}</Text>
//               <TouchableOpacity onPress={() => deleteEvent(item.id)}>
//                 <Text>❌</Text>
//               </TouchableOpacity>
//             </View>
//           )}
//         />

//         <TextInput
//           placeholder="Add event"
//           value={text}
//           onChangeText={setText}
//           style={{
//             borderWidth: 1,
//             padding: 10,
//             marginTop: 20,
//             borderRadius: 10,
//           }}
//         />

//         <TouchableOpacity
//           onPress={addEvent}
//           style={{
//             backgroundColor: "black",
//             padding: 15,
//             marginTop: 10,
//             borderRadius: 10,
//           }}
//         >
//           <Text style={{ color: "white", textAlign: "center" }}>Add Event</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }
