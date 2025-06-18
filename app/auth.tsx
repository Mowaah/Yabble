import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { session } = useAuth();

  // This screen is reached after a successful OAuth redirect.
  // The session is already being set by the signInWithGoogle function.
  // We just need to wait for the session to be recognized and then redirect.
  useEffect(() => {
    if (session) {
      // Session is now available, redirect to the main part of the app.
      // A small delay can help prevent race conditions with navigation.
      const timer = setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [session, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>Finalizing login...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: Layout.spacing.md,
    fontSize: 16,
    color: Colors.gray[600],
  },
});
