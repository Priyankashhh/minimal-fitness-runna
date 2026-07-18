import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActivity } from '../../src/context/ActivityContext';
import { useAuth } from '../../src/context/AuthContext';
export default function ProfileScreen() {
    const { activities, streak } = useActivity();
    const { user, signOut } = useAuth();
    // Streak data: 7 days representing last week to today
    // In a real app, calculate true/false based on activity.date matching calendar days
    const MOCK_STREAK_GRID = Array(7).fill(false).map((_, i) => i < streak);
    const renderHistoryItem = ({ item }) => {
        // Format date string
        const d = new Date(item.date);
        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
        return (<View style={styles.historyCard}>
        {item.snapshotUri ? (<Image source={{ uri: item.snapshotUri }} style={styles.historyMap}/>) : (<View style={[styles.historyMap, styles.historyMapPlaceholder]}>
            <Text style={styles.placeholderLabel}>ROUTE SAVED</Text>
          </View>)}
        <View style={styles.historyDetails}>
          <Text style={styles.historyDate}>{dateStr} • {item.activityType}</Text>
          <View style={styles.historyStats}>
            <Text style={styles.historyStatValue}>{item.distance}</Text>
            <Text style={styles.historyStatValue}>{item.time}</Text>
            <Text style={styles.historyStatValue}>{item.pace} /km</Text>
          </View>
        </View>
      </View>);
    };
    const totalDistance = activities.reduce((acc, a) => acc + (parseFloat(a.distance) || 0), 0).toFixed(1);
    return (<SafeAreaView style={styles.container}>
      
      {/* Header with Logout */}
      <View style={styles.header}>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>LOG OUT</Text>
        </TouchableOpacity>
      </View>
      
      {/* Top Section */}
      <View style={styles.topSection}>
        <Text style={styles.userName}>{user?.displayName || user?.email?.split('@')[0]?.toUpperCase() || 'USER'}</Text>
        <View style={styles.userStatsContainer}>
          <View style={styles.userStatBox}>
            <Text style={styles.userStatNumber}>{totalDistance}</Text>
            <Text style={styles.userStatLabel}>TOTAL KM</Text>
          </View>
          <View style={styles.userStatBox}>
            <Text style={styles.userStatNumber}>{activities.length}</Text>
            <Text style={styles.userStatLabel}>ACTIVITIES</Text>
          </View>
        </View>
      </View>

      {/* Middle Section: History */}
      <View style={styles.middleSection}>
        <Text style={styles.sectionTitle}>ACTIVITY HISTORY</Text>
        {activities.length > 0 ? (<FlatList data={activities} keyExtractor={(item) => item.id} renderItem={renderHistoryItem} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}/>) : (<Text style={styles.emptyText}>No activities recorded yet. Go for a run!</Text>)}
      </View>

      {/* Bottom Section: Streak */}
      <View style={styles.bottomSection}>
        <Text style={styles.sectionTitle}>CURRENT STREAK: {streak} DAYS</Text>
        <View style={styles.streakContainer}>
          {MOCK_STREAK_GRID.map((isActive, index) => (<View key={index} style={[
                styles.streakDay,
                isActive ? styles.streakDayActive : styles.streakDayInactive
            ]}/>))}
        </View>
      </View>

    </SafeAreaView>);
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        height: 40,
        marginBottom: 0,
    },
    logoutBtn: {
        padding: 10,
    },
    logoutText: {
        fontSize: 10,
        color: '#999',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    topSection: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 0,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        letterSpacing: 2,
        marginBottom: 30,
    },
    userStatsContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
    },
    userStatBox: {
        alignItems: 'center',
    },
    userStatNumber: {
        fontSize: 36,
        fontWeight: '300',
        color: '#000',
        marginBottom: 5,
    },
    userStatLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000',
        letterSpacing: 1,
    },
    middleSection: {
        flex: 1,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000',
        letterSpacing: 2,
        marginBottom: 15,
    },
    listContent: {
        paddingBottom: 20,
    },
    historyCard: {
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 8,
        marginBottom: 15,
        overflow: 'hidden',
    },
    historyMap: {
        width: '100%',
        height: 120,
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    historyMapPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderLabel: {
        color: '#999',
        fontSize: 12,
        letterSpacing: 2,
    },
    historyDetails: {
        padding: 15,
    },
    historyDate: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 10,
        letterSpacing: 1,
    },
    historyStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    historyStatValue: {
        fontSize: 16,
        fontWeight: '300',
        color: '#000',
    },
    emptyText: {
        fontStyle: 'italic',
        color: '#666',
        marginTop: 20,
    },
    bottomSection: {
        marginBottom: 20,
    },
    streakContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    streakDay: {
        width: 35,
        height: 35,
        borderWidth: 1,
        borderColor: '#000',
    },
    streakDayActive: {
        backgroundColor: '#000',
    },
    streakDayInactive: {
        backgroundColor: '#FFF',
    },
});
