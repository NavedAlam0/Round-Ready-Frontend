import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDjZsUZOXl2wcOALqE76efhI7VikcGTdWQ",
  authDomain: "roundready-5fc54.firebaseapp.com",
  projectId: "roundready-5fc54",
  storageBucket: "roundready-5fc54.firebasestorage.app",
  messagingSenderId: "628295205006",
  appId: "1:628295205006:web:5323f15b0ddffa8f7809df",
  measurementId: "G-9MQW2CDWB5",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User,
};
