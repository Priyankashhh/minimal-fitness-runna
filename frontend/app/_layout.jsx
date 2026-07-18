import 'react-native-get-random-values';
import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useSegments, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ActivityProvider } from '../src/context/ActivityContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ClubProvider } from '../src/context/ClubContext';
// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
    /* reloading the app might cause some errors here, we safe to reject */
});
export const unstable_settings = {
    anchor: '(tabs)',
};
function RootLayoutNav() {
    const colorScheme = useColorScheme();
    const { user, loading } = useAuth();
    const segments = useSegments();
    console.log('[RootLayoutNav] Rendering... Auth Loading:', loading, 'User:', user?.uid);
    useEffect(() => {
        if (!loading) {
            SplashScreen.hideAsync();
        }
    }, [loading]);
    if (loading) {
        return null;
    }
    const inAuthGroup = segments[0] === 'login';
    return (<ActivityProvider>
      <ClubProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {!user && !inAuthGroup && <Redirect href="/login"/>}
          {user && inAuthGroup && <Redirect href="/(tabs)"/>}

          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login"/>
            <Stack.Screen name="(tabs)"/>
          </Stack>
          <StatusBar style="auto"/>
        </ThemeProvider>
      </ClubProvider>
    </ActivityProvider>);
}
export default function RootLayout() {
    return (<AuthProvider>
      <RootLayoutNav />
    </AuthProvider>);
}
