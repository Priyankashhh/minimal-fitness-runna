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
            console.error('[ActivityContext] Listener Error:', error.code, error.message);
            setLoading(false);
            // Explicitly tell the user if there's a problem (e.g. Missing Index)
            setTimeout(() => {
                Alert.alert('Firestore Sync Error', error.message);
            }, 1000);
        });
        return () => unsubscribe();
    }, [user]);
    const addActivity = async (activity) => {
        const newDate = new Date().toISOString();
        const tempId = Date.now().toString();
        // Optimistic local update
        const localActivity = { ...activity, id: tempId, date: newDate };
        setActivities(prev => [localActivity, ...prev]);
        // Write to Firestore
        if (user) {
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
                return { ...localActivity, id: docRef.id };
            }
            catch (err) {
                console.error('[ActivityContext] ❌ Firestore Save Failed:', err.code, err.message);
                setTimeout(() => Alert.alert('Firestore Error', `Write failed: ${err.message}`), 300);
                throw err;
            }
        }
        else {
            console.log('[ActivityContext] ⚠️ Skipping save: No user logged in.');
            setTimeout(() => Alert.alert('User Error', 'Not logged in!'), 300);
            return localActivity;
        }
    };
    const deleteActivity = (id) => {
        // Optimistic local removal
        setActivities(prev => prev.filter(a => a.id !== id));
        // Delete from Firestore
        if (user) {
            const docRef = doc(db, 'users', user.uid, 'activities', id);
            deleteDoc(docRef).catch(err => console.error('Failed to delete activity:', err));
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
