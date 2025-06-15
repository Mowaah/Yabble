import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Conditionally import Google Sign-In (only available in development builds)
let GoogleSignin: any = null;
let statusCodes: any = null;

try {
  const googleSignInModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSignInModule.GoogleSignin;
  statusCodes = googleSignInModule.statusCodes;

  // Configure Google Sign-In for native builds
  GoogleSignin?.configure({
    scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    webClientId: '939237185009-75c21naruful8i2dj49t58m4g692pg4v.apps.googleusercontent.com', // Web client ID
    iosClientId: '939237185009-ihdc60udhgeose7sq5epksvajd25dsm6.apps.googleusercontent.com', // iOS client ID
  });
} catch (error) {
  console.log('Google Sign-In not available (Expo Go mode)');
}

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
 * Sign in with Google using Native Sign-In (when available) or OAuth (Expo Go)
 */
export async function signInWithGoogle(): Promise<OAuthResult> {
  try {
    const isExpoGo = Constants.appOwnership === 'expo';

    // Use native Google Sign-In if available (development/production builds)
    if (GoogleSignin && !isExpoGo) {
      console.log('Using native Google Sign-In');

      // Check if Google Play Services are available (Android only)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
      }

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();

      if (userInfo.data?.idToken) {
        // Use the ID token with Supabase
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        });

        if (error) throw error;
        return { data };
      } else {
        throw new Error('No ID token received from Google Sign-In');
      }
    } else {
      // Fall back to OAuth flow for Expo Go
      console.log('Using OAuth flow (Expo Go)');

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
    }
  } catch (error: any) {
    console.error('Google OAuth error:', error);

    // Handle specific Google Sign-In errors
    if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { error: new Error('Google Sign-In was cancelled') };
    } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
      return { error: new Error('Google Sign-In is already in progress') };
    } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { error: new Error('Google Play Services not available') };
    } else {
      return { error: error as Error };
    }
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
