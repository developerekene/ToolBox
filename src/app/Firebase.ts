
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBiMIbVyYnEN94MuJVLQPSHd0QWHxeFL-Q",
    authDomain: "systems-0ne.firebaseapp.com",
    projectId: "systems-0ne",
    storageBucket: "systems-0ne.firebasestorage.app",
    messagingSenderId: "172003627306",
    appId: "1:172003627306:web:068e88235be8e6f6bc8e53",
    measurementId: "G-65E21C4W5X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { auth, db }