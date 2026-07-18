import { Tabs } from 'expo-router';
import React from 'react';
import { Home, Users, Trophy, User } from 'lucide-react-native';
import { HapticTab } from '@/components/haptic-tab';
export default function TabLayout() {
    return (<Tabs screenOptions={{
            tabBarActiveTintColor: '#000',
            tabBarInactiveTintColor: '#999',
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarStyle: {
                backgroundColor: '#FFF',
                borderTopColor: '#E5E5E5',
                borderTopWidth: 1,
                elevation: 0, // removed shadow for android
                shadowOpacity: 0, // removed shadow for ios
            },
        }}>
      <Tabs.Screen name="index" options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Home size={24} color={color}/>,
        }}/>
      <Tabs.Screen name="clubs" options={{
            title: 'Clubs',
            tabBarIcon: ({ color }) => <Users size={24} color={color}/>,
        }}/>
      <Tabs.Screen name="challenges" options={{
            title: 'Challenges',
            tabBarIcon: ({ color }) => <Trophy size={24} color={color}/>,
        }}/>
      <Tabs.Screen name="profile" options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <User size={24} color={color}/>,
        }}/>
    </Tabs>);
}
