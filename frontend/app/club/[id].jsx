import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useClub } from '../../src/context/ClubContext';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
export default function ClubDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { clubs, joinClub, leaveClub } = useClub();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('FEED');
    const club = clubs.find(c => c.id === id);
    if (!club) {
        return (<SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Club not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>GO BACK</Text>
        </TouchableOpacity>
      </SafeAreaView>);
    }
    const owner = club.members.find(m => m.isOwner);
    const isMember = club.joined;
    const handleShare = async () => {
        try {
            await Share.share({
                message: `Join my club '${club.name}' on runna! You can join here: runna://club/${club.id}`,
            });
        }
        catch (error) {
            Alert.alert('Error sharing link');
        }
    };
    const handleReport = () => {
        Alert.alert('Report Club', 'This club has been reported for review. Thank you for keeping the community safe.', [
            { text: 'OK' }
        ]);
    };
    const handleToggleJoin = () => {
        if (isMember) {
            leaveClub(club.id, user?.uid || 'me');
        }
        else {
            joinClub(club.id, { id: user?.uid || 'me', name: user?.email ? user.email.split('@')[0] : 'You' });
        }
    };
    // Compile Leaderboard Distances without intense competition vibes
    const leaderboardStats = club.activities.reduce((acc, act) => {
        // We assume the activity has a user or we just mock random distribution for now
        // Since activities right now lack userIds, let's just treat all current activities as the user's for prototype
        const memberName = 'Current User';
        const distNum = parseFloat(act.distance) || 0;
        if (!acc[memberName])
            acc[memberName] = 0;
        acc[memberName] += distNum;
        return acc;
    }, {});
    const sortedLeaderboard = Object.entries(leaderboardStats)
        .map(([name, distance]) => ({ name, distance }))
        .sort((a, b) => b.distance - a.distance);
    const totalClubDistance = Object.values(leaderboardStats).reduce((sum, dist) => sum + dist, 0);
    return (<SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonInline} onPress={() => router.back()}>
          <Text style={styles.backText}>{'< BACK'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleReport}>
          <Text style={styles.reportText}>REPORT</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Banner Details */}
        <View style={styles.clubBanner}>
          <Text style={styles.clubName}>{club.name.toUpperCase()}</Text>
          <Text style={styles.clubCategory}>{club.category} • {club.isPublic ? 'Public' : 'Private'} • {club.location}</Text>
          <Text style={styles.clubDesc}>{club.desc}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>{club.members.length} MEMBERS</Text>
            {owner && <Text style={styles.statLabel}>OWNER: {owner.name.toUpperCase()}</Text>}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, isMember && styles.actionBtnActive]} onPress={handleToggleJoin}>
            <Text style={[styles.actionBtnText, isMember && styles.actionBtnTextActive]}>
              {isMember ? 'LEAVE CLUB' : 'JOIN CLUB'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtnOutline, { flexDirection: 'row', justifyContent: 'center', gap: 10 }]} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={16} color="#000"/>
            <Text style={styles.actionBtnOutlineText}>SHARE LINK</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Feed / Leaderboard Tabs */}
        <View style={styles.tabSelector}>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'FEED' && styles.tabBtnActive]} onPress={() => setActiveTab('FEED')}>
            <Text style={[styles.tabBtnText, activeTab === 'FEED' && styles.tabBtnTextActive]}>POSTS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'LEADERBOARD' && styles.tabBtnActive]} onPress={() => setActiveTab('LEADERBOARD')}>
            <Text style={[styles.tabBtnText, activeTab === 'LEADERBOARD' && styles.tabBtnTextActive]}>STATS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'MEMBERS' && styles.tabBtnActive]} onPress={() => setActiveTab('MEMBERS')}>
            <Text style={[styles.tabBtnText, activeTab === 'MEMBERS' && styles.tabBtnTextActive]}>MEMBERS</Text>
          </TouchableOpacity>
        </View>

        {/* Render Tab Content */}
        {activeTab === 'FEED' ? (<View style={styles.feedSection}>
            {club.activities.length > 0 ? club.activities.map((act) => (<View key={act.id} style={styles.postCard}>
                <Text style={styles.postAuthor}>MEMBER POSTED A {act.activityType.toUpperCase()}</Text>
                <Text style={styles.postStats}>{act.distance} in {act.time}</Text>
              </View>)) : <Text style={styles.emptyText}>No posts yet.</Text>}
          </View>) : activeTab === 'LEADERBOARD' ? (<View style={styles.leaderboardSection}>
            <View style={styles.totalDistanceBanner}>
              <Text style={styles.totalDistanceValue}>{totalClubDistance.toFixed(1)}</Text>
              <Text style={styles.totalDistanceLabel}>TOTAL DISTANCE COVERED</Text>
            </View>
            <Text style={styles.tableSubtitle}>MEMBER CONTRIBUTIONS</Text>
            {sortedLeaderboard.length > 0 ? sortedLeaderboard.map((item, idx) => (<View key={item.name} style={styles.leaderItem}>
                <Text style={styles.leaderRank}>{idx + 1}</Text>
                <Text style={styles.leaderName}>{item.name.toUpperCase()}</Text>
                <Text style={styles.leaderDist}>{item.distance.toFixed(1)} km</Text>
              </View>)) : <Text style={styles.emptyText}>No stats recorded.</Text>}
          </View>) : (<View style={styles.leaderboardSection}>
            <Text style={styles.tableSubtitle}>CLUB ROSTER</Text>
            {club.members.map((member, idx) => (<View key={member.id + idx} style={styles.leaderItem}>
                <Text style={styles.leaderName}>{member.name.toUpperCase()} {member.isOwner ? '(OWNER)' : ''}</Text>
              </View>))}
          </View>)}
      </ScrollView>
    </SafeAreaView>);
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
    backButton: { marginTop: 20, alignItems: 'center' },
    backButtonInline: { padding: 5 },
    backText: { fontSize: 12, fontWeight: 'bold', color: '#000', letterSpacing: 2 },
    reportText: { fontSize: 10, fontWeight: 'bold', color: '#999', letterSpacing: 2, padding: 5 },
    errorText: { textAlign: 'center', marginTop: 100 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 50 },
    clubBanner: { marginBottom: 20 },
    clubName: { fontSize: 28, fontWeight: 'bold', color: '#000', letterSpacing: 2 },
    clubCategory: { fontSize: 10, fontWeight: 'bold', color: '#666', marginTop: 5, letterSpacing: 1, textTransform: 'uppercase' },
    clubDesc: { fontSize: 14, color: '#333', marginVertical: 15, lineHeight: 20 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E5E5E5', paddingVertical: 10 },
    statLabel: { fontSize: 10, fontWeight: 'bold', color: '#000', letterSpacing: 1 },
    actionRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
    actionBtn: { flex: 1, borderWidth: 1, borderColor: '#000', borderRadius: 30, paddingVertical: 15, alignItems: 'center' },
    actionBtnActive: { backgroundColor: '#000' },
    actionBtnText: { fontSize: 12, fontWeight: 'bold', color: '#000', letterSpacing: 1 },
    actionBtnTextActive: { color: '#FFF' },
    actionBtnOutline: { flex: 1, borderWidth: 1, borderColor: '#000', borderStyle: 'dashed', borderRadius: 30, paddingVertical: 15, alignItems: 'center' },
    actionBtnOutlineText: { fontSize: 12, fontWeight: 'bold', color: '#000', letterSpacing: 1 },
    tabSelector: { flexDirection: 'row', marginBottom: 20 },
    tabBtn: { flex: 1, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: '#E5E5E5', alignItems: 'center' },
    tabBtnActive: { borderBottomColor: '#000' },
    tabBtnText: { fontSize: 12, fontWeight: 'bold', color: '#999', letterSpacing: 1 },
    tabBtnTextActive: { color: '#000' },
    feedSection: { flex: 1 },
    postCard: { padding: 15, borderWidth: 1, borderColor: '#000', borderRadius: 8, marginBottom: 15 },
    postAuthor: { fontSize: 10, fontWeight: 'bold', color: '#666', marginBottom: 5, letterSpacing: 1 },
    postStats: { fontSize: 18, fontWeight: '300', color: '#000' },
    leaderboardSection: { flex: 1 },
    totalDistanceBanner: { alignItems: 'center', paddingVertical: 20, marginBottom: 20, backgroundColor: '#f9f9f9', borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5' },
    totalDistanceValue: { fontSize: 32, fontWeight: '300', color: '#000' },
    totalDistanceLabel: { fontSize: 10, fontWeight: 'bold', color: '#666', letterSpacing: 2, marginTop: 5 },
    tableSubtitle: { fontSize: 10, fontWeight: 'bold', color: '#666', letterSpacing: 1, marginBottom: 15 },
    leaderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5E5' },
    leaderRank: { width: 30, fontSize: 14, fontWeight: 'bold', color: '#999' },
    leaderName: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#000' },
    leaderDist: { fontSize: 14, fontWeight: '300', color: '#000' },
    emptyText: { fontStyle: 'italic', color: '#999', marginTop: 20 }
});
