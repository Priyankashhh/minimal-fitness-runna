import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Modal, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useActivity } from '../../src/context/ActivityContext';
// Manual Haversine distance calc to avoid geolib metro bundler crash
const getDistance = (coord1, coord2) => {
    const R = 6371e3; // metres
    const φ1 = coord1.latitude * Math.PI / 180;
    const φ2 = coord2.latitude * Math.PI / 180;
    const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
const ACTIVITIES = ['Run', 'Walk', 'Cycle', 'Hike'];
export default function HomeScreen() {
    const { addActivity } = useActivity();
    const [activity, setActivity] = useState(ACTIVITIES[0]);
    const [isTracking, setIsTracking] = useState(false);
    const [hasStarted, setHasStarted] = useState(false); // To keep stats visible during review
    // Tracking State
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [distance, setDistance] = useState(0); // meters
    const [elapsedTime, setElapsedTime] = useState(0); // seconds
    const [currentPace, setCurrentPace] = useState(0); // min/km
    const [locationObj, setLocationObj] = useState(null);
    // Refs
    const mapRef = useRef(null);
    const locationSubscription = useRef(null);
    const timerRef = useRef(null);
    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [caption, setCaption] = useState('');
    const [shareCommunity, setShareCommunity] = useState(false);
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted')
                return;
            let loc = await Location.getLastKnownPositionAsync({});
            if (loc) {
                setLocationObj(loc);
            }
        })();
    }, []);
    const startTracking = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission to access location was denied');
            return;
        }
        setIsTracking(true);
        setHasStarted(true);
        setRouteCoordinates([]);
        setDistance(0);
        setElapsedTime(0);
        setCurrentPace(0);
        // Zoom map tightly to start pos
        if (locationObj && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: locationObj.coords.latitude,
                longitude: locationObj.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.0025,
            }, 1000);
        }
        // Start Timer
        timerRef.current = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);
        // Watch Location
        locationSubscription.current = await Location.watchPositionAsync({
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 5,
        }, (loc) => {
            const newCoord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setLocationObj(loc);
            setRouteCoordinates((prevCoords) => {
                if (prevCoords.length > 0) {
                    const lastCoord = prevCoords[prevCoords.length - 1];
                    const distAdded = getDistance(lastCoord, newCoord);
                    setDistance((prevDist) => prevDist + distAdded);
                }
                return [...prevCoords, newCoord];
            });
        });
    };
    const stopTracking = () => {
        setIsTracking(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
        }
        setModalVisible(true);
    };
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current)
                clearInterval(timerRef.current);
            if (locationSubscription.current)
                locationSubscription.current.remove();
        };
    }, []);
    useEffect(() => {
        if (distance > 0 && elapsedTime > 0) {
            const minutes = elapsedTime / 60;
            const km = distance / 1000;
            setCurrentPace(minutes / km);
        }
    }, [distance, elapsedTime]);
    const formatPace = (pace) => {
        if (!pace || !isFinite(pace))
            return "0'00\"";
        const mins = Math.floor(pace);
        const secs = Math.floor((pace - mins) * 60);
        return `${mins}'${secs.toString().padStart(2, '0')}"`;
    };
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0)
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    const handleSaveActivity = async () => {
        let snapshotUri = '';
        // Take map snapshot for profile
        if (mapRef.current) {
            try {
                snapshotUri = await mapRef.current.takeSnapshot({
                    format: 'png',
                    quality: 0.8,
                    result: 'file'
                });
            }
            catch (e) {
                console.log("Snapshot failed on web", e);
            }
        }
        addActivity({
            distance: (distance / 1000).toFixed(2) + ' km',
            time: formatTime(elapsedTime),
            pace: formatPace(currentPace),
            activityType: activity,
            caption: caption,
            snapshotUri: snapshotUri,
        });
        setModalVisible(false);
        setHasStarted(false);
        Alert.alert('Success', `Activity saved!${shareCommunity ? ' Posted to Community.' : ''}`);
        // Reset state
        setCaption('');
        setShareCommunity(false);
        setRouteCoordinates([]);
        setDistance(0);
        setElapsedTime(0);
    };
    const handleDiscard = () => {
        setModalVisible(false);
        setHasStarted(false);
        setCaption('');
        setShareCommunity(false);
        setRouteCoordinates([]);
        setDistance(0);
        setElapsedTime(0);
    };
    return (<View style={styles.container}>
      <MapView ref={mapRef} style={StyleSheet.absoluteFillObject} provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined} showsUserLocation showsMyLocationButton={false} customMapStyle={mapStyle} initialRegion={{
            latitude: locationObj?.coords.latitude || 37.78825,
            longitude: locationObj?.coords.longitude || -122.4324,
            latitudeDelta: 0.0422,
            longitudeDelta: 0.0221,
        }}>
        {routeCoordinates.length > 0 && (<Polyline coordinates={routeCoordinates} strokeColor="#000" strokeWidth={5}/>)}
      </MapView>
      
      <SafeAreaView style={styles.content} pointerEvents="box-none">
        <View style={styles.spacer}/>

        <View style={styles.bottomSection} pointerEvents="auto">
          {hasStarted && (<View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{(distance / 1000).toFixed(2)}</Text>
                <Text style={styles.statLabel}>km</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
                <Text style={styles.statLabel}>time</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatPace(currentPace)}</Text>
                <Text style={styles.statLabel}>pace</Text>
              </View>
            </View>)}

          <View style={styles.activitySelector}>
            {ACTIVITIES.map((act) => (<TouchableOpacity key={act} style={[styles.activityTab, activity === act && styles.activityTabActive]} onPress={() => (!isTracking && !hasStarted) && setActivity(act)}>
                <Text style={[styles.activityText, activity === act && styles.activityTextActive]}>
                  {act}
                </Text>
              </TouchableOpacity>))}
          </View>

          <TouchableOpacity style={[styles.startButton, isTracking && styles.stopButton]} onPress={isTracking ? stopTracking : startTracking} disabled={hasStarted && !isTracking} // disable start if reviewing saved screen
    >
            <Text style={[styles.startText, isTracking && styles.stopText]}>
              {isTracking ? 'STOP' : 'START'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ACTIVITY COMPLETE</Text>
            <View style={styles.modalSummaryRow}>
              <Text style={styles.modalSummaryStat}>{(distance / 1000).toFixed(2)} km</Text>
              <Text style={styles.modalSummaryStat}>{formatTime(elapsedTime)}</Text>
            </View>
            <TextInput style={styles.modalInput} placeholder="Add a caption... (optional)" placeholderTextColor="#999" value={caption} onChangeText={setCaption}/>
            <View style={styles.modalSwitchRow}>
              <Text style={styles.modalSwitchLabel}>Post to Community</Text>
              <Switch value={shareCommunity} onValueChange={setShareCommunity} trackColor={{ false: "#E5E5E5", true: "#000" }} thumbColor={"#FFF"}/>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={handleDiscard}>
                <Text style={styles.modalCancelText}>DISCARD</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveActivity}>
                <Text style={styles.modalSaveText}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>);
}
const mapStyle = [{ elementType: "geometry", stylers: [{ color: "#f5f5f5" }] }, { elementType: "labels.icon", stylers: [{ visibility: "off" }] }, { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] }, { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] }, { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] }, { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] }, { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] }, { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] }, { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] }, { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] }, { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] }, { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] }, { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] }, { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] }, { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] }, { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] }, { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] }];
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    content: { flex: 1, justifyContent: 'space-between', padding: 20 },
    spacer: { flex: 1 },
    bottomSection: { alignItems: 'center', paddingBottom: 20 },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 40, backgroundColor: 'rgba(255, 255, 255, 0.9)', paddingVertical: 15, borderRadius: 8, borderWidth: 1, borderColor: '#000' },
    statBox: { alignItems: 'center' },
    statValue: { fontSize: 32, fontWeight: '300', color: '#000' },
    statLabel: { fontSize: 12, fontWeight: 'bold', color: '#000', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
    activitySelector: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 30, borderWidth: 1, borderColor: '#000', overflow: 'hidden', marginBottom: 30 },
    activityTab: { paddingVertical: 10, paddingHorizontal: 16 },
    activityTabActive: { backgroundColor: '#000' },
    activityText: { fontSize: 14, color: '#000', fontWeight: '600', textTransform: 'uppercase' },
    activityTextActive: { color: '#FFF' },
    startButton: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#000', backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
    stopButton: { backgroundColor: '#FFF' },
    startText: { fontSize: 24, fontWeight: 'bold', color: '#FFF', letterSpacing: 2 },
    stopText: { color: '#000' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFF', width: '100%', borderColor: '#000', borderWidth: 1, borderRadius: 8, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', letterSpacing: 2, marginBottom: 20, textAlign: 'center' },
    modalSummaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
    modalSummaryStat: { fontSize: 24, fontWeight: '300', color: '#000' },
    modalInput: { borderWidth: 1, borderColor: '#000', borderRadius: 8, padding: 15, fontSize: 14, color: '#000', marginBottom: 20 },
    modalSwitchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    modalSwitchLabel: { fontSize: 14, fontWeight: 'bold', color: '#000' },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
    modalCancelBtn: { flex: 1, borderWidth: 1, borderColor: '#000', borderRadius: 30, paddingVertical: 15, alignItems: 'center' },
    modalCancelText: { fontSize: 14, fontWeight: 'bold', color: '#000' },
    modalSaveBtn: { flex: 1, backgroundColor: '#000', borderRadius: 30, paddingVertical: 15, alignItems: 'center' },
    modalSaveText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
});
