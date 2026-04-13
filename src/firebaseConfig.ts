import { initializeApp, getApps, getApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA78Ve-3SPd9t_w4vxfhfcP_KPJDA8NKII",
  authDomain: "toolbox-f4aa4.firebaseapp.com",
  projectId: "toolbox-f4aa4",
  storageBucket: "toolbox-f4aa4.firebasestorage.app",
  messagingSenderId: "288897148426",
  appId: "1:288897148426:web:b897b8bae386410a9161f3",
  measurementId: "G-9ZKQEKYKJS",
};

// ✅ Prevents duplicate initialization on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);

// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_AUTH_DOMAIN",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_STORAGE_BUCKET",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//   appId: "YOUR_APP_ID",
// };

// const app = initializeApp(firebaseConfig);

// export const auth = getAuth(app);
// export const db = getFirestore(app);

// rules_version = '2';

// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /{document=**} {
//       allow read, write: if false;
//     }
//   }
// }
