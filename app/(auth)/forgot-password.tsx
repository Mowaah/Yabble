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
import { Mail, ArrowLeft } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { resetPassword } from '../../lib/auth';
import Logo from '../../components/ui/Logo';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);
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

  const handleResetPassword = async () => {
    setError('');
    setEmailError('');
    setSuccess(false);

    if (!email) {
      setEmailError('Email is required');
      return;
    }

    setIsLoading(true);
    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) throw resetError;
      setSuccess(true);
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
          {isLogoVisible && (
            <Logo width={150} height={150} style={styles.logo} />
          )}
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you instructions to reset
            your password
          </Text>
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
              if (success) setSuccess(false);
            }}
            error={emailError}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={<Mail size={20} color={Colors.orange} />}
            type="email"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? (
            <Text style={styles.success}>
              Password reset instructions have been sent to your email
            </Text>
          ) : null}

          <Button
            title="Send Reset Link"
            onPress={handleResetPassword}
            disabled={isLoading}
            icon={isLoading && <ActivityIndicator color={Colors.white} />}
            style={styles.resetButton}
          />

          <Button
            title="Back to Sign In"
            variant="ghost"
            onPress={() => router.push('/sign-in')}
            icon={<ArrowLeft size={20} color={Colors.black} />}
            style={styles.backButton}
          />
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
    textAlign: 'center',
    marginHorizontal: Layout.spacing.lg,
  },
  form: {
    marginTop: Layout.spacing.xl,
  },
  error: {
    color: Colors.error,
    marginBottom: Layout.spacing.md,
    textAlign: 'center',
  },
  success: {
    color: Colors.success,
    marginBottom: Layout.spacing.md,
    textAlign: 'center',
  },
  resetButton: {
    marginTop: Layout.spacing.md,
  },
  backButton: {
    marginTop: Layout.spacing.md,
  },
});
