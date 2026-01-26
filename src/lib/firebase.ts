import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAdpp7QV2sd9U0aTzkPuuviMrdSggcb3zE",
  authDomain: "innovestor-fa784.firebaseapp.com",
  databaseURL:
    "https://innovestor-fa784-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "innovestor-fa784",
  storageBucket: "innovestor-fa784.firebasestorage.app",
  messagingSenderId: "919426530586",
  appId: "1:919426530586:web:ed2116dfc83e0c2b1180a3",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

export const connectFirebase = async (): Promise<void> => {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
};
