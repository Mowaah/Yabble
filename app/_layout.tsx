import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '../contexts/AuthContext';
import Colors from '../constants/Colors';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <Stack 
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.softCream },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="voice" options={{ title: 'Choose Voice' }} />
        <Stack.Screen name="audio" options={{ title: 'Audio Effects' }} />
        <Stack.Screen name="export" options={{ title: 'Export' }} />
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}