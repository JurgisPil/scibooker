import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDJEOmSaSMzPlFYKA3hy4REy71qaiMvaYQ",
    authDomain: "scibooker.firebaseapp.com",
    projectId: "scibooker",
    storageBucket: "scibooker.firebasestorage.app",
    messagingSenderId: "609632954247",
    appId: "1:609632954247:web:f6d1ccd2c65deb8ebe1522",
    measurementId: "G-Y0JK0YYW5J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let firestoreDb;
try {
    firestoreDb = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
    });
} catch (e) {
    console.error("Failed to initialize Firestore with persistence, falling back to network only:", e);
    firestoreDb = initializeFirestore(app, {
        experimentalForceLongPolling: true
    });
}
export const db = firestoreDb;

export const googleProvider = new GoogleAuthProvider();
