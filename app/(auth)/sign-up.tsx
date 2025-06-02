import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, UserPlus } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { signUpWithEmail } from '../../lib/auth';
import Logo from '../../components/ui/Logo';

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLogoVisible, setIsLogoVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsLogoVisible(false);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsLogoVisible(true);
      }
    );
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [fadeAnim]);

  const handleSignUp = async () => {
    setError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    let isValid = true;
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    }
    // Basic email format validation (optional, can be more complex)
    // else if (!/\S+@\S+\.\S+/.test(email)) {
    //   setEmailError('Email format is invalid');
    //   isValid = false;
    // }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }
    // Potential: Add password strength validation here

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password && password !== confirmPassword) {
      // Only check match if password is also entered
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);
    try {
      const { error: signUpError } = await signUpWithEmail(email, password);
      if (signUpError) throw signUpError;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[{ opacity: fadeAnim }, styles.contentWrapper]}>
          <View style={styles.header}>
            {isLogoVisible && (
              <Logo width={150} height={150} style={styles.logo} />
            )}
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
                if (error) setError('');
              }}
              error={emailError}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Mail size={20} color={Colors.orange} />}
              type="email"
            />

            <Input
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
                if (confirmPasswordError) setConfirmPasswordError('');
                if (error) setError('');
              }}
              error={passwordError}
              type="password"
              leftIcon={<Lock size={20} color={Colors.orange} />}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError) setConfirmPasswordError('');
              }}
              error={confirmPasswordError}
              type="password"
              leftIcon={<Lock size={20} color={Colors.orange} />}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              title="Sign Up"
              onPress={handleSignUp}
              disabled={isLoading}
              icon={
                isLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <UserPlus size={20} color={Colors.white} />
                )
              }
              style={styles.signUpButton}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Button
                title="Sign In"
                variant="ghost"
                onPress={() => router.push('/sign-in')}
              />
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: Colors.softCream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: Layout.spacing.lg,
  },
  contentWrapper: {},
  header: {
    alignItems: 'center',
    marginVertical: Layout.spacing.xl,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: Layout.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray[700],
  },
  form: {
    marginTop: Layout.spacing.xl,
  },
  error: {
    color: Colors.error,
    marginBottom: Layout.spacing.md,
    textAlign: 'center',
  },
  signUpButton: {
    marginTop: Layout.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Layout.spacing.lg,
  },
  footerText: {
    color: Colors.gray[600],
    marginRight: Layout.spacing.sm,
  },
});
