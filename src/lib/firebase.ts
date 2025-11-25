import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBFXarcMcYdHOdsypdxyKvRtsZGfkeGjTI",
    authDomain: "aldila-acf60.firebaseapp.com",
    projectId: "aldila-acf60",
    storageBucket: "aldila-acf60.firebasestorage.app",
    messagingSenderId: "821697423716",
    appId: "1:821697423716:web:5b6ed613ed1614cf1e7271"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
