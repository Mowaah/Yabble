import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoTrueClient, Session } from '@supabase/gotrue-js';
import { PostgrestClient } from '@supabase/postgrest-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please check your app.config.js or .env file'
  );
}

class EmptyStorage {
  getItem(key: string): Promise<string | null> {
    return Promise.resolve(null);
  }
  setItem(key: string, value: string): Promise<void> {
    return Promise.resolve();
  }
  removeItem(key: string): Promise<void> {
    return Promise.resolve();
  }
}

const storage =
  Platform.OS === 'web' && typeof window === 'undefined'
    ? new EmptyStorage()
    : AsyncStorage;

export const auth = new GoTrueClient({
  url: `${supabaseUrl}/auth/v1`,
  headers: {
    apikey: supabaseAnonKey,
    'X-Client-Info': 'supabase-js-react-native',
  },
  autoRefreshToken: true,
  persistSession: true,
  storage: storage,
  detectSessionInUrl: false,
});

// Store the current session
let currentSession: Session | null = null;

auth.onAuthStateChange((_event, session) => {
  currentSession = session;
});

// Initialize currentSession with the session from storage
// This is important to have the session available at app startup
(async () => {
  const { data } = await auth.getSession();
  currentSession = data.session;
})();

export const db = new PostgrestClient(`${supabaseUrl}/rest/v1`, {
  headers: {
    apikey: supabaseAnonKey, // Default apikey header
  },
  fetch: async (input, init) => {
    const accessToken = currentSession?.access_token || supabaseAnonKey; // Use token or fallback to anon key

    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    // apikey is already in default headers, but ensure it if not
    if (!headers.has('apikey')) {
      headers.set('apikey', supabaseAnonKey);
    }

    return globalThis.fetch(input, { ...init, headers });
  },
});

// Optional: If you still want a combined 'supabase' like object for some parts,
// or for a smoother transition, you can do something like this,
// but it's better to use 'auth' and 'db' directly.
/*
export const supabase = {
  auth: auth, // an instance of GoTrueClient
  from: db.from.bind(db), // a PostgrestClient instance
  // Add other Supabase client methods if you use them, 
  // e.g. functions, storage by importing their respective clients.
};
*/
