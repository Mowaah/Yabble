import { auth } from './supabase';
import * as AuthSession from 'expo-auth-session';

const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'yabble',
  path: 'auth',
});

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUri,
    },
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await auth.signOut();
  return { error };
}

export async function resetPassword(email: string) {
  const { data, error } = await auth.resetPasswordForEmail(email);
  return { data, error };
}
