import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const CHALLENGES_DATA = [
    { id: '101', title: 'Run 50 km this month', progress: 0.6, daysLeft: 12 },
    { id: '102', title: 'Cycle 100 km', progress: 0.2, daysLeft: 5 },
    { id: '103', title: 'Hike 2 mountains', progress: 0.5, daysLeft: 20 },
    { id: '104', title: 'Walk 10,000 steps daily', progress: 0.8, daysLeft: 1 },
];
export default function ChallengesScreen() {
    const [joinedIds, setJoinedIds] = useState([]);
    const toggleJoin = (id, title) => {
        if (joinedIds.includes(id)) {
            Alert.alert('Leave Challenge', `Are you sure you want to leave "${title}"?`, [
                { text: 'CANCEL', style: 'cancel' },
                { text: 'LEAVE', style: 'destructive', onPress: () => setJoinedIds(prev => prev.filter(i => i !== id)) }
            ]);
        }
        else {
            setJoinedIds(prev => [...prev, id]);
        }
    };
    return (<SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ACTIVE CHALLENGES</Text>
        <Text style={styles.headerSubtitle}>Complete these to build your streak and stay motivated.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {CHALLENGES_DATA.map((challenge) => {
            const isJoined = joinedIds.includes(challenge.id);
            return (<View key={challenge.id} style={styles.challengeCard}>
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                <Text style={styles.challengeDays}>{challenge.daysLeft}d left</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${challenge.progress * 100}%` }]}/>
              </View>
              <View style={styles.challengeFooter}>
                <Text style={styles.progressText}>{Math.round(challenge.progress * 100)}% Completed</Text>
                <TouchableOpacity style={[styles.joinBtn, isJoined && styles.joinedBtn]} onPress={() => toggleJoin(challenge.id, challenge.title)}>
                  <Text style={[styles.joinBtnText, isJoined && styles.joinedBtnText]}>
                    {isJoined ? 'JOINED' : 'JOIN'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>);
        })}
      </ScrollView>
    </SafeAreaView>);
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        padding: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5E5',
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        letterSpacing: 2,
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    challengeCard: {
        borderWidth: 1,
        borderColor: '#000',
        padding: 20,
        marginBottom: 20,
        borderRadius: 8,
    },
    challengeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    challengeTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        flex: 1,
        marginRight: 10,
    },
    challengeDays: {
        fontSize: 12,
        color: '#000',
        fontWeight: 'bold',
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: '#E5E5E5',
        width: '100%',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 15,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#000',
    },
    challengeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#999',
    },
    joinBtn: {
        borderWidth: 1,
        borderColor: '#000',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    joinedBtn: {
        backgroundColor: '#000',
    },
    joinBtnText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#000',
        letterSpacing: 1,
    },
    joinedBtnText: {
        color: '#FFF',
    },
});
