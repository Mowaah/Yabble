import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) return null;

  // Redirect to auth flow or main app based on authentication status
  return <Redirect href={session ? "/(tabs)" : "/(auth)/sign-in"} />;
}