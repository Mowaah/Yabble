import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { handleOAuthCallback } from '../lib/oauth';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const processCallback = async () => {
      try {
        let url = '';

        if (Platform.OS === 'web') {
          // Web platform: use window location
          url = window?.location?.href || '';
        } else {
          // Mobile platform: construct URL from params
          const searchParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
              searchParams.append(key, String(value));
            }
          });
          url = `yabble://auth?${searchParams.toString()}`;
        }

        if (url) {
          const result = await handleOAuthCallback(url);

          if (result.error) {
            console.error('OAuth callback error:', result.error);
            // Redirect to sign-in with error
            router.replace('/(auth)/sign-in');
          } else {
            // Success - redirect to main app
            router.replace('/(tabs)');
          }
        } else {
          // No URL available, redirect to sign-in
          router.replace('/(auth)/sign-in');
        }
      } catch (error) {
        console.error('OAuth processing error:', error);
        router.replace('/(auth)/sign-in');
      }
    };

    // Small delay to ensure router is ready
    const timer = setTimeout(processCallback, 100);
    return () => clearTimeout(timer);
  }, [router, params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.softBackground,
    padding: Layout.spacing.lg,
  },
  text: {
    marginTop: Layout.spacing.md,
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
  },
});
