
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBLiS-LgwmjVhaIYMnRcLrXsKCewP2ZxLc",
    authDomain: "peertutor-9bc18.firebaseapp.com",
    projectId: "peertutor-9bc18",
    storageBucket: "peertutor-9bc18.firebasestorage.app",
    messagingSenderId: "823664357004",
    appId: "1:823664357004:web:5dc9ace2d9f1f299cb15a9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
