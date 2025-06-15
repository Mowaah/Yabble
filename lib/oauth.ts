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
    if (Platform.OS === 'web') {
      // Web implementation using Supabase Auth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      return { data };
    } else {
      // Mobile implementation using WebBrowser
      const supabaseUrl = getSupabaseUrl();
      const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}`;

      // Use WebBrowser for OAuth flow
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success') {
        const { url } = result;

        // Parse the URL to get tokens
        let accessToken = '';
        let refreshToken = '';

        if (url.includes('#')) {
          const urlParams = new URLSearchParams(url.split('#')[1]);
          accessToken = urlParams.get('access_token') || '';
          refreshToken = urlParams.get('refresh_token') || '';
        } else if (url.includes('?')) {
          const urlParams = new URLSearchParams(url.split('?')[1]);
          accessToken = urlParams.get('access_token') || '';
          refreshToken = urlParams.get('refresh_token') || '';
        }

        if (accessToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
          return { data };
        }
      }

      if (result.type === 'cancel') {
        throw new Error('OAuth authentication was cancelled');
      }

      throw new Error('OAuth authentication failed');
    }
  } catch (error) {
    console.error('Google OAuth error:', error);
    return { error: error as Error };
  }
}

/**
 * Sign in with Apple using OAuth
 */
export async function signInWithApple(): Promise<OAuthResult> {
  try {
    if (Platform.OS === 'web') {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUri,
        },
      });

      if (error) throw error;
      return { data };
    } else {
      const supabaseUrl = getSupabaseUrl();
      const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=apple&redirect_to=${encodeURIComponent(redirectUri)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success') {
        const { url } = result;

        let accessToken = '';
        let refreshToken = '';

        if (url.includes('#')) {
          const urlParams = new URLSearchParams(url.split('#')[1]);
          accessToken = urlParams.get('access_token') || '';
          refreshToken = urlParams.get('refresh_token') || '';
        } else if (url.includes('?')) {
          const urlParams = new URLSearchParams(url.split('?')[1]);
          accessToken = urlParams.get('access_token') || '';
          refreshToken = urlParams.get('refresh_token') || '';
        }

        if (accessToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
          return { data };
        }
      }

      if (result.type === 'cancel') {
        throw new Error('OAuth authentication was cancelled');
      }

      throw new Error('OAuth authentication failed');
    }
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
    if (Platform.OS === 'web') {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: redirectUri,
          scopes: 'email',
        },
      });

      if (error) throw error;
      return { data };
    } else {
      const supabaseUrl = getSupabaseUrl();
      const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=facebook&redirect_to=${encodeURIComponent(
        redirectUri
      )}&scopes=email`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success') {
        const { url } = result;

        let accessToken = '';
        let refreshToken = '';

        if (url.includes('#')) {
          const urlParams = new URLSearchParams(url.split('#')[1]);
          accessToken = urlParams.get('access_token') || '';
          refreshToken = urlParams.get('refresh_token') || '';
        } else if (url.includes('?')) {
          const urlParams = new URLSearchParams(url.split('?')[1]);
          accessToken = urlParams.get('access_token') || '';
          refreshToken = urlParams.get('refresh_token') || '';
        }

        if (accessToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
          return { data };
        }
      }

      if (result.type === 'cancel') {
        throw new Error('OAuth authentication was cancelled');
      }

      throw new Error('OAuth authentication failed');
    }
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
