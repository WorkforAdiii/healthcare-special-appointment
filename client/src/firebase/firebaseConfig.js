import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDolLL0UUPayB5x4NNdts4FTgV_i4ggYrs",
  authDomain: "healthcare-appointment-s-ea35b.firebaseapp.com",
  projectId: "healthcare-appointment-s-ea35b",
  storageBucket: "healthcare-appointment-s-ea35b.firebasestorage.app",
  messagingSenderId: "245824333058",
  appId: "1:245824333058:web:e531a6d92429e5b4580e1b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
