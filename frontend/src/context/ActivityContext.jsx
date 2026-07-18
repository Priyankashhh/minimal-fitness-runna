import React, { createContext, useState, useContext, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';
const ActivityContext = createContext(undefined);
export const ActivityProvider = ({ children }) => {
    const { user } = useAuth();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    console.log('[ActivityProvider] Rendering... User:', user?.uid);
    // Listen to user's activities in Firestore
    useEffect(() => {
        if (!user) {
            setActivities([]);
            setLoading(false);
            return;
        }
        if (user.uid === 'dev_bypass_mock_uid') {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            AsyncStorage.getItem('local_activities').then(data => {
                setActivities(data ? JSON.parse(data) : []);
                setLoading(false);
            }).catch(() => {
                setActivities([]);
                setLoading(false);
            });
            return;
        }
        const activitiesRef = collection(db, 'users', user.uid, 'activities');
        const q = query(activitiesRef, orderBy('createdAt', 'desc'));
        console.log('[ActivityContext] Starting Firestore listener for:', user.uid);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log(`[ActivityContext] Listener Snapshot: Received ${snapshot.size} docs for ${user.uid}`);
            const fetchedActivities = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    date: data.date || new Date().toISOString(),
                    distance: data.distance || '0 km',
                    time: data.time || '00:00',
                    pace: data.pace || '0.0 km/h',
                    activityType: data.activityType || 'Run',
                    snapshotUri: data.snapshotUri,
                    caption: data.caption,
                    maxSpeed: data.maxSpeed,
                    elevationGain: data.elevationGain,
                    maxElevation: data.maxElevation,
                    speedData: data.speedData,
                    elevationData: data.elevationData,
                };
            });
            setActivities(fetchedActivities);
            setLoading(false);
        }, (error) => {
            console.warn('[ActivityContext] Firestore Listener Error (falling back to local storage):', error.message);
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            AsyncStorage.getItem('local_activities').then(data => {
                if (data) {
                    setActivities(JSON.parse(data));
                }
                setLoading(false);
            }).catch(() => setLoading(false));
        });
        return () => unsubscribe();
    }, [user]);
    const addActivity = async (activity) => {
        const newDate = new Date().toISOString();
        const tempId = Date.now().toString();
        // Optimistic local update
        const localActivity = { ...activity, id: tempId, date: newDate };
        setActivities(prev => [localActivity, ...prev]);
        
        // Save to AsyncStorage local fallback
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        try {
            const existing = await AsyncStorage.getItem('local_activities');
            const list = existing ? JSON.parse(existing) : [];
            list.unshift(localActivity);
            await AsyncStorage.setItem('local_activities', JSON.stringify(list));
        }
        catch (e) {
            console.error('Failed to save activity locally:', e);
        }
        // Write to Firestore if we have a real user session
        if (user && user.uid !== 'dev_bypass_mock_uid') {
            console.log('[ActivityContext] ATTEMPTING SAVE TO:', `users/${user.uid}/activities`);
            const activitiesRef = collection(db, 'users', user.uid, 'activities');
            const payload = {
                ...activity,
                date: newDate,
                createdAt: new Date().toISOString(),
            };
            try {
                // Ensure the parent user document exists (makes it visible in console)
                const userRef = doc(db, 'users', user.uid);
                await setDoc(userRef, { email: user.email, lastActive: new Date().toISOString() }, { merge: true });
                const docRef = await addDoc(activitiesRef, payload);
                console.log('[ActivityContext] ✅ Firestore Save Successful with ID:', docRef.id);
                const finalActivity = { ...localActivity, id: docRef.id };
                setActivities(prev => prev.map(a => a.id === tempId ? finalActivity : a));
                try {
                    const existing = await AsyncStorage.getItem('local_activities');
                    if (existing) {
                        const list = JSON.parse(existing);
                        const updatedList = list.map(a => a.id === tempId ? finalActivity : a);
                        await AsyncStorage.setItem('local_activities', JSON.stringify(updatedList));
                    }
                }
                catch (e) {}
                return finalActivity;
            }
            catch (err) {
                console.warn('[ActivityContext] ❌ Firestore Save Failed, fallback to local storage:', err.message);
                return localActivity;
            }
        }
        else {
            console.log('[ActivityContext] ⚠️ Skipping Firestore save: Offline/Mock Mode.');
            return localActivity;
        }
    };
    const deleteActivity = async (id) => {
        // Optimistic local removal
        setActivities(prev => prev.filter(a => a.id !== id));
        // Remove from AsyncStorage
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        try {
            const existing = await AsyncStorage.getItem('local_activities');
            if (existing) {
                const list = JSON.parse(existing);
                const filtered = list.filter(a => a.id !== id);
                await AsyncStorage.setItem('local_activities', JSON.stringify(filtered));
            }
        }
        catch (e) {
            console.error('Failed to delete activity locally:', e);
        }
        // Delete from Firestore
        if (user && user.uid !== 'dev_bypass_mock_uid') {
            const docRef = doc(db, 'users', user.uid, 'activities', id);
            deleteDoc(docRef).catch(err => console.warn('Failed to delete activity from Firestore:', err.message));
        }
    };
    const calculateStreak = () => {
        if (activities.length === 0)
            return 0;
        const uniqueDays = new Set(activities.map(a => a.date.split('T')[0]));
        return uniqueDays.size;
    };
    return (<ActivityContext.Provider value={{ activities, addActivity, deleteActivity, streak: calculateStreak(), loading }}>
      {children}
    </ActivityContext.Provider>);
};
export const useActivity = () => {
    const context = useContext(ActivityContext);
    if (!context) {
        console.error('[useActivity] ERROR: Context is undefined! Hook called outside provider.');
        throw new Error('useActivity must be used within an ActivityProvider');
    }
    return context;
};
