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
 * Handles the response from an OAuth provider.
 * @param authResponse - The response from WebBrowser.openAuthSessionAsync.
 * @returns A promise that resolves with the session data or an error.
 */
async function handleOAuthResponse(authResponse: WebBrowser.WebBrowserAuthSessionResult): Promise<OAuthResult> {
  if (authResponse.type === 'success') {
    const { url: responseUrl } = authResponse;
    const urlParts = responseUrl.split('#');

    if (urlParts.length < 2 || !urlParts[1]) {
      return { error: new Error('Invalid redirect: No URL fragment found.') };
    }

    const params = new URLSearchParams(urlParts[1]);
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
}

/**
 * Sign in with a given provider using OAuth.
 * @param provider - The OAuth provider to use.
 * @returns A promise that resolves with the session data or an error.
 */
async function signInWithProvider(provider: 'google' | 'facebook'): Promise<OAuthResult> {
  try {
    const supabaseUrl = getSupabaseUrl();
    const url = `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${redirectUri}`;

    const authResponse = await WebBrowser.openAuthSessionAsync(url, redirectUri, {
      showInRecents: true,
    });

    return handleOAuthResponse(authResponse);
  } catch (error) {
    console.error(`${provider} OAuth error:`, error);
    return { error: error as Error };
  }
}

/**
 * Sign in with Google using the correct native flow.
 */
export async function signInWithGoogle(): Promise<OAuthResult> {
  return signInWithProvider('google');
}

/**
 * Sign in with Facebook using OAuth
 */
export async function signInWithFacebook(): Promise<OAuthResult> {
  return signInWithProvider('facebook');
}
