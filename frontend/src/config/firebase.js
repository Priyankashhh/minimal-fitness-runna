import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
// @ts-ignore
import { getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
}
else {
    app = getApp();
}
let auth;
if (Platform.OS !== 'web') {
    try {
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage)
        });
    }
    catch (error) {
        auth = getAuth(app);
    }
}
else {
    auth = getAuth(app);
}
let db;
try {
    // If the user created a database named 'default' instead of '(default)'
    db = getFirestore(app, 'default');
    console.log('[FirebaseConfig] Firestore initialized');
}
catch (error) {
    console.error('[FirebaseConfig] Firestore initialization failed:', error.message);
    throw error;
}
if (!db) {
    throw new Error('[FirebaseConfig] Failed to initialize Firestore: db is undefined');
}
export { app, auth, db };
