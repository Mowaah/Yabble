import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Required for web support
WebBrowser.maybeCompleteAuthSession();

// OAuth Configuration
const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'yabble',
  path: 'auth',
});

export interface OAuthResult {
  data?: any;
  error?: Error;
}

// Get Supabase URL from environment
const getSupabaseUrl = () => {
  return process.env.EXPO_PUBLIC_SUPABASE_URL;
};

/**
 * Sign in with Google using OAuth
 */
export async function signInWithGoogle(): Promise<OAuthResult> {
  try {
    // For both mobile and web, use the Supabase signInWithOAuth method.
    // Supabase handles the underlying native flows and redirects correctly.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri, // This is your deep link: yabble://auth
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        // IMPORTANT: Add your client IDs here for mobile
        iosClientId: '939237185009-ihdc60udhgeose7sq5epksvajd25dsm6.apps.googleusercontent.com',
        androidClientId: '939237185009-kpduvc4go4u0n373ljmmv9c4vuqegtoa.apps.googleusercontent.com',
      } as any,
    });

    if (error) throw error;

    // The Supabase client will handle the session.
    // The browser will be opened, and after success, it will redirect back to the app.
    // The AuthCallbackScreen will handle the session persistence.
    return { data };
  } catch (error) {
    console.error('Google OAuth error:', error);
    // Let the calling hook handle the alert
    return { error: error as Error };
  }
}

/**
 * Sign in with Apple using OAuth
 */
export async function signInWithApple(): Promise<OAuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUri,
      },
    });

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('Apple OAuth error:', error);
    return { error: error as Error };
  }
}

/**
 * Sign in with Facebook using OAuth
 */
export async function signInWithFacebook(): Promise<OAuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: redirectUri,
        scopes: 'email',
      },
    });

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return { error: error as Error };
  }
}

/**
 * Handle OAuth callback URL (mainly for web)
 */
export async function handleOAuthCallback(url: string): Promise<OAuthResult> {
  try {
    // For web, we can use the session from URL
    if (Platform.OS === 'web' && url.includes('#access_token')) {
      const urlParams = new URLSearchParams(url.split('#')[1]);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');

      if (accessToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (error) throw error;
        return { data };
      }
    }

    // For mobile deep links
    if (url.includes('access_token')) {
      const urlParams = new URLSearchParams(url.split('?')[1] || url.split('#')[1]);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');

      if (accessToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (error) throw error;
        return { data };
      }
    }

    throw new Error('No valid session found in callback URL');
  } catch (error) {
    console.error('OAuth callback error:', error);
    return { error: error as Error };
  }
}

/**
 * Get OAuth redirect URL for a provider
 */
export function getOAuthRedirectUrl(provider: 'google' | 'apple' | 'facebook'): string {
  const supabaseUrl = getSupabaseUrl();
  return `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectUri)}`;
}
