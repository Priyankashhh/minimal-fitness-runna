import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Platform, Alert } from 'react-native';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);
    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        }
        catch (e) {
            console.error(e);
        }
    };
    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            if (Platform.OS === 'web') {
                await signInWithPopup(auth, provider);
            }
            else {
                Alert.alert('Not Supported', 'Google Sign-In requires a native module (like @react-native-google-signin/google-signin) to be configured for Expo Go.');
            }
        }
        catch (error) {
            console.error('Google Sign-In failed:', error);
            throw error;
        }
    };
    const signInAnonymouslyUser = async () => {
        const { signInAnonymously } = require('firebase/auth');
        try {
            await signInAnonymously(auth);
        }
        catch (error) {
            console.error('Anonymous Sign-In failed:', error);
            throw error;
        }
    };
    const bypassLogin = () => {
        setUser({
            uid: 'dev_bypass_mock_uid',
            email: 'dev_bypass@example.com',
            displayName: 'Dev Guest'
        });
        setLoading(false);
    };
    return (<AuthContext.Provider value={{ user, loading, signOut, signInWithGoogle, signInAnonymouslyUser, bypassLogin }}>
      {children}
    </AuthContext.Provider>);
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context)
        throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
