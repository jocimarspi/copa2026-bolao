import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_L5FN0Br845x2Wzv_hc0dG5LR4f38uKM",
  authDomain: "copa2026-bolao-d6e2a.firebaseapp.com",
  projectId: "copa2026-bolao-d6e2a",
  storageBucket: "copa2026-bolao-d6e2a.firebasestorage.app",
  messagingSenderId: "899241944443",
  appId: "1:899241944443:web:59316ebb6fe94552b389de"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
