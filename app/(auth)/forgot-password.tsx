import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { resetPassword } from '../../lib/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      setSuccess(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/3585089/pexels-photo-3585089.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
          style={styles.logo}
        />
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you instructions to reset your password
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon={<Mail size={20} color={Colors.gray[400]} />}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.lg,
    backgroundColor: Colors.softCream,
  },
  header: {
    alignItems: 'center',
    marginVertical: Layout.spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
    color: Colors.gray[600],
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