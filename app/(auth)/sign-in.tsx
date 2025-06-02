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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, LogIn } from 'lucide-react-native';
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

  const handleSignIn = async () => {
    setError('');
    setEmailError('');
    setPasswordError('');

    let isValid = true;
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);
    try {
      const { error: signInError } = await signInWithEmail(email, password);
      if (signInError) throw signInError;
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
    >
      <Animated.View style={[{ opacity: fadeAnim }, styles.innerContainer]}>
        <View style={styles.header}>
          {isLogoVisible && <Logo width={150} height={150} />}
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
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
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError('');
              if (error) setError('');
            }}
            error={passwordError}
            type="password"
            leftIcon={<Lock size={20} color={Colors.orange} />}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Sign In"
            onPress={handleSignIn}
            disabled={isLoading}
            icon={
              isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <LogIn size={20} color={Colors.white} />
              )
            }
            style={styles.signInButton}
          />

          <View style={styles.links}>
            <Button
              title="Forgot Password?"
              variant="ghost"
              onPress={() => router.push('/forgot-password')}
            />
            <Button
              title="Create Account"
              variant="ghost"
              onPress={() => router.push('/sign-up')}
            />
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: Colors.softCream,
  },
  innerContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: Layout.spacing.lg,
  },
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
    flexGrow: 1,
    justifyContent: 'center',
  },
  error: {
    color: Colors.error,
    marginBottom: Layout.spacing.md,
    textAlign: 'center',
  },
  signInButton: {
    marginTop: Layout.spacing.md,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Layout.spacing.lg,
  },
});
