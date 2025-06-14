import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, LogIn, Apple } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { signInWithEmail } from '../../lib/auth';
import Logo from '../../components/ui/Logo';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dismiss keyboard when tapping outside
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleSignIn = async () => {
    // Dismiss keyboard first
    Keyboard.dismiss();

    setError('');
    setEmailError('');
    setPasswordError('');

    let isValid = true;
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);
    try {
      const { error: signInError } = await signInWithEmail(
        email.trim(),
        password
      );
      if (signInError) throw signInError;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = (provider: string) => {
    // Placeholder for social sign-in
    console.log(`Sign in with ${provider}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.touchableContainer}
            activeOpacity={1}
            onPress={dismissKeyboard}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Logo width={100} height={100} style={styles.logoImage} />
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to your AI audiobook library
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formSection}>
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
                leftIcon={<Mail size={20} color={Colors.primary} />}
                type="email"
                containerStyle={styles.inputContainer}
                returnKeyType="next"
                onSubmitEditing={dismissKeyboard}
                autoComplete="email"
                textContentType="emailAddress"
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                  if (error) setError('');
                }}
                error={passwordError}
                type="password"
                leftIcon={<Lock size={20} color={Colors.primary} />}
                containerStyle={styles.inputContainer}
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
                autoComplete="current-password"
                textContentType="password"
              />

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Button
                title={isLoading ? 'Signing In...' : 'Sign In'}
                onPress={handleSignIn}
                disabled={isLoading || !email.trim() || !password.trim()}
                icon={
                  isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <LogIn size={20} color="white" />
                  )
                }
                style={styles.signInButton}
              />

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialContainer}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialSignIn('Google')}
                >
                  <Text style={styles.socialButtonText}>G</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialSignIn('Apple')}
                >
                  <Apple size={20} color={Colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialSignIn('Facebook')}
                >
                  <Text style={styles.socialButtonText}>f</Text>
                </TouchableOpacity>
              </View>

              {/* Links */}
              <View style={styles.linksContainer}>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => router.push('/forgot-password')}
                >
                  <Text style={styles.linkText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => router.replace('/sign-up')}
                >
                  <Text style={styles.linkText}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.softBackground,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  logoContainer: {
    marginBottom: Layout.spacing.lg,
  },
  logoImage: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Layout.spacing.xs,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray[500],
    textAlign: 'center',
    fontWeight: '400',
  },
  formSection: {
    paddingHorizontal: Layout.spacing.sm,
  },
  inputContainer: {
    marginBottom: Layout.spacing.md,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  signInButton: {
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    minHeight: 56,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonDisabled: {
    backgroundColor: Colors.gray[200],
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Layout.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray[200],
  },
  dividerText: {
    paddingHorizontal: Layout.spacing.md,
    color: Colors.gray[500],
    fontSize: 14,
    fontWeight: '500',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.md,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  socialButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  linkButton: {
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.xs,
  },
  linkText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  touchableContainer: {
    flex: 1,
  },
});
