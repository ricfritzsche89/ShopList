import { initializeApp, getApps, getApp } from 'firebase/app';
import { Auth, initializeAuth, getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Überprüfen, ob Firebase konfiguriert ist (mindestens apiKey und projectId müssen vorhanden sein)
export const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: any;
let auth: Auth = {} as Auth;
let db: any = {};
let storage: any = {};

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

    if (getApps().length <= 1) {
      if (Platform.OS !== 'web') {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const { getReactNativePersistence } = require('firebase/auth');
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } else {
        auth = getAuth(app);
      }
    } else {
      auth = getAuth(app);
    }

    db = initializeFirestore(app, {
      localCache: persistentLocalCache(
        Platform.OS === 'web'
          ? { tabManager: persistentMultipleTabManager() }
          : {}
      ),
    });

    storage = getStorage(app);
  } catch (error) {
    console.error("Fehler bei der Initialisierung von Firebase:", error);
  }
} else {
  console.warn("⚠️ Firebase ist nicht konfiguriert! Bitte erstelle eine .env-Datei mit den erforderlichen Zugangsdaten.");
}

export { app, auth, db, storage };
export default app;
