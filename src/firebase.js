// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCm6sTQ_l4GUKKyWPJvpzfQk2vN1BOHAXE",
  authDomain: "word-church-quiet-time.firebaseapp.com",
  projectId: "word-church-quiet-time",
  storageBucket: "word-church-quiet-time.firebasestorage.app",
  messagingSenderId: "727065268492",
  appId: "1:727065268492:web:19d6afe47b078ad42e7929"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
