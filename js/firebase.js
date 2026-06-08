import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Check if we are in Mock Mode (GitHub Pages or missing config)
export let isMockMode = window.location.hostname.includes('github.io');

let app = null;
let firestoreDb = null;
let authInstance = null;
let providerInstance = null;

if (!isMockMode) {
    try {
        const configModule = await import('./firebase-config.js');
        const firebaseConfig = configModule.firebaseConfig;
        
        app = initializeApp(firebaseConfig);
        authInstance = getAuth(app);
        providerInstance = new GoogleAuthProvider();

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
    } catch (e) {
        console.warn("Real config not found or failed to load. Switching to Mock Mode.", e);
        isMockMode = true;
    }
}

if (isMockMode) {
    console.info("Running in DEMO MODE. No real database connection.");
    // Mock Auth
    authInstance = {
        onAuthStateChanged: (callback) => {
            // Do nothing, app.js will handle mock login explicitly
        },
        signOut: async () => {}
    };
    providerInstance = {};
}

export const auth = authInstance;
export const db = firestoreDb;
export const googleProvider = providerInstance;
