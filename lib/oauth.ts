import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

// Required for web support
WebBrowser.maybeCompleteAuthSession();

// OAuth Configuration
const redirectUri = AuthSession.makeRedirectUri({
  // In a development build, a direct deep link is used.
  // The `useProxy` option is for Expo Go on a physical device.
  scheme: 'yabble',
  path: 'auth',
});

export interface OAuthResult {
  data?: any;
  error?: Error;
}

// Get Supabase URL from environment
const getSupabaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL is not set.');
  }
  return url;
};

/**
 * Sign in with Google using the correct native flow.
 */
export async function signInWithGoogle(): Promise<OAuthResult> {
  try {
    const supabaseUrl = getSupabaseUrl();
    const url = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirectUri}`;

    const authResponse = await WebBrowser.openAuthSessionAsync(url, redirectUri, {
      showInRecents: true,
    });

    if (authResponse.type === 'success') {
      const { url: responseUrl } = authResponse;
      // Supabase sends the session details in the URL fragment
      const params = new URLSearchParams(responseUrl.split('#')[1]);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        return { error: new Error('No session found in the redirect URL.') };
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        return { error };
      }
      return { data };
    }

    if (authResponse.type === 'cancel' || authResponse.type === 'dismiss') {
      return { error: new Error('Authentication was cancelled by the user.') };
    }

    return { error: new Error('An unknown error occurred during authentication.') };
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
    const supabaseUrl = getSupabaseUrl();
    const url = `${supabaseUrl}/auth/v1/authorize?provider=apple&redirect_to=${redirectUri}`;

    const authResponse = await WebBrowser.openAuthSessionAsync(url, redirectUri, {
      showInRecents: true,
    });

    if (authResponse.type === 'success') {
      const { url: responseUrl } = authResponse;
      const params = new URLSearchParams(responseUrl.split('#')[1]);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        return { error: new Error('No session found in the redirect URL.') };
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        return { error };
      }
      return { data };
    }

    if (authResponse.type === 'cancel' || authResponse.type === 'dismiss') {
      return { error: new Error('Authentication was cancelled by the user.') };
    }

    return { error: new Error('An unknown error occurred during authentication.') };
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
    const supabaseUrl = getSupabaseUrl();
    const url = `${supabaseUrl}/auth/v1/authorize?provider=facebook&redirect_to=${redirectUri}`;

    const authResponse = await WebBrowser.openAuthSessionAsync(url, redirectUri, {
      showInRecents: true,
    });

    if (authResponse.type === 'success') {
      const { url: responseUrl } = authResponse;
      const params = new URLSearchParams(responseUrl.split('#')[1]);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        return { error: new Error('No session found in the redirect URL.') };
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        return { error };
      }
      return { data };
    }

    if (authResponse.type === 'cancel' || authResponse.type === 'dismiss') {
      return { error: new Error('Authentication was cancelled by the user.') };
    }

    return { error: new Error('An unknown error occurred during authentication.') };
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return { error: error as Error };
  }
}
