import React, { createContext, useState, useContext, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, onSnapshot, query, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';
const ClubContext = createContext(undefined);
export const ClubProvider = ({ children }) => {
    const { user } = useAuth();
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    // Listen to all clubs in Firestore
    useEffect(() => {
        if (!user) {
            setClubs([]);
            setLoading(false);
            return;
        }
        const mockClubs = [
            {
                id: 'mock_club_1',
                name: 'London Runners Club',
                desc: 'Weekly 5k and 10k social runs around Hyde Park.',
                category: 'Run',
                isPublic: true,
                location: 'London, UK',
                members: [{ id: 'dev_bypass_mock_uid', name: 'Dev Guest', isOwner: false }],
                joined: true,
                activities: []
            },
            {
                id: 'mock_club_2',
                name: 'Cycle Pros',
                desc: 'Group rides for road cycling enthusiasts.',
                category: 'Cycle',
                isPublic: true,
                location: 'San Francisco, CA',
                members: [],
                joined: false,
                activities: []
            }
        ];
        if (user.uid === 'dev_bypass_mock_uid') {
            setClubs(mockClubs);
            setLoading(false);
            return;
        }
        const clubsRef = collection(db, 'clubs');
        const q = query(clubsRef);
        console.log('[ClubContext] Starting Firestore listener...');
        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log('[ClubContext] Received snapshot, size:', snapshot.size);
            const fetchedClubs = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                const members = data.members || [];
                const isJoined = user ? members.some(m => m.id === user.uid) : false;
                return {
                    id: docSnap.id,
                    name: data.name || 'Unnamed Club',
                    desc: data.desc || '',
                    category: data.category || 'Run',
                    isPublic: data.isPublic !== false,
                    location: data.location || 'Global',
                    members,
                    joined: isJoined,
                    activities: data.activities || [],
                };
            });
            setClubs(fetchedClubs);
            setLoading(false);
        }, (error) => {
            console.warn('[ClubContext] Firestore clubs listener error (falling back to mock clubs):', error.message);
            setClubs(mockClubs);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);
    const createClub = async (clubData, ownerName, ownerId) => {
        const clubsRef = collection(db, 'clubs');
        console.log('[ClubContext] ATTEMPTING CREATE CLUB for owner:', ownerId);
        const payload = {
            ...clubData,
            members: [{ id: ownerId, name: ownerName, isOwner: true }],
            activities: [],
            createdAt: new Date().toISOString(),
        };
        try {
            const docRef = await addDoc(clubsRef, payload);
            console.log('[ClubContext] ✅ Firestore Create Successful with ID:', docRef.id);
        }
        catch (err) {
            console.error('[ClubContext] ❌ Firestore Create Failed:', err.code, err.message);
            setTimeout(() => Alert.alert('Club Error', `Write failed: ${err.message}`), 300);
        }
    };
    const joinClub = (clubId, member) => {
        const clubRef = doc(db, 'clubs', clubId);
        updateDoc(clubRef, {
            members: arrayUnion(member),
        }).catch(err => console.error('Failed to join club:', err));
    };
    const leaveClub = (clubId, memberId) => {
        // arrayRemove needs exact object match, so find the member first
        const club = clubs.find(c => c.id === clubId);
        const memberObj = club?.members.find(m => m.id === memberId);
        if (memberObj) {
            const clubRef = doc(db, 'clubs', clubId);
            updateDoc(clubRef, {
                members: arrayRemove(memberObj),
            }).catch(err => console.error('Failed to leave club:', err));
        }
    };
    const addClubActivity = (clubId, activity) => {
        const clubRef = doc(db, 'clubs', clubId);
        // Store activity without heavy data (no speedData/elevationData to keep club doc lightweight)
        const lightActivity = {
            id: activity.id,
            date: activity.date,
            activityType: activity.activityType,
            distance: activity.distance,
            time: activity.time,
            pace: activity.pace,
        };
        updateDoc(clubRef, {
            activities: arrayUnion(lightActivity),
        }).catch(err => console.error('Failed to add club activity:', err));
    };
    return (<ClubContext.Provider value={{ clubs, createClub, joinClub, leaveClub, addClubActivity, loading }}>
      {children}
    </ClubContext.Provider>);
};
export const useClub = () => {
    const context = useContext(ClubContext);
    if (!context)
        throw new Error('useClub must be used within a ClubProvider');
    return context;
};
