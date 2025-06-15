import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Required for web support
WebBrowser.maybeCompleteAuthSession();

// OAuth Configuration - Handle Expo Go vs standalone app (for other providers)
const getRedirectUri = () => {
  // Check if running in Expo Go
  const isExpoGo = Constants.appOwnership === 'expo';

  if (isExpoGo) {
    // In Expo Go, use the dynamically generated URL
    return AuthSession.makeRedirectUri({
      path: 'auth',
    });
  } else {
    // In standalone app, use custom scheme
    return AuthSession.makeRedirectUri({
      scheme: 'yabble',
      path: 'auth',
    });
  }
};

const redirectUri = getRedirectUri();

console.log('OAuth Redirect URI:', redirectUri);
console.log('Running in Expo Go:', Constants.appOwnership === 'expo');

export interface OAuthResult {
  data?: any;
  error?: Error;
}

// Create session from URL (for deep linking - other providers)
const createSessionFromUrl = async (url: string) => {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) throw new Error(errorCode);

  const { access_token, refresh_token } = params;

  if (!access_token) return;

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) throw error;
  return data.session;
};

/**
 * Sign in with Google using OAuth (for Expo Go)
 */
export async function signInWithGoogle(): Promise<OAuthResult> {
  try {
    // Use Supabase OAuth with skipBrowserRedirect for mobile
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;

    // Open the OAuth URL in WebBrowser
    const result = await WebBrowser.openAuthSessionAsync(data?.url ?? '', redirectUri);

    if (result.type === 'success') {
      const { url } = result;
      const session = await createSessionFromUrl(url);
      return { data: session };
    }

    if (result.type === 'cancel') {
      throw new Error('OAuth authentication was cancelled');
    }

    throw new Error('OAuth authentication failed');
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
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;

    const result = await WebBrowser.openAuthSessionAsync(data?.url ?? '', redirectUri);

    if (result.type === 'success') {
      const { url } = result;
      const session = await createSessionFromUrl(url);
      return { data: session };
    }

    if (result.type === 'cancel') {
      throw new Error('OAuth authentication was cancelled');
    }

    throw new Error('OAuth authentication failed');
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
        skipBrowserRedirect: true,
        scopes: 'email',
      },
    });

    if (error) throw error;

    const result = await WebBrowser.openAuthSessionAsync(data?.url ?? '', redirectUri);

    if (result.type === 'success') {
      const { url } = result;
      const session = await createSessionFromUrl(url);
      return { data: session };
    }

    if (result.type === 'cancel') {
      throw new Error('OAuth authentication was cancelled');
    }

    throw new Error('OAuth authentication failed');
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
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectUri)}`;
}
