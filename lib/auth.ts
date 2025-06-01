import { auth } from './supabase';

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
