import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, View } from 'react-native';
import { signInWithGoogle } from '../lib/oauth';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();

      if (result.error) {
        throw result.error;
      }

      Alert.alert('Success', 'Signed in with Google successfully!');
      onSuccess?.();
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to sign in with Google');
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleGoogleSignIn}>
      <View style={styles.buttonContent}>
        <Text style={styles.buttonText}>Continue with Google</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 48,
    backgroundColor: '#4285F4',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
