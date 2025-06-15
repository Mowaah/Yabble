import { supabase } from './supabase';
import * as AuthSession from 'expo-auth-session';

/**
 * Debug OAuth configuration
 */
export async function debugOAuthConfig() {
  console.log('=== OAuth Debug Info ===');

  // Check environment variables
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Anon Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing');

  // Extract project ID from URL
  if (supabaseUrl) {
    // Clean up the URL to remove trailing slashes
    const cleanUrl = supabaseUrl.replace(/\/$/, '');
    const projectId = cleanUrl.replace('https://', '').replace('.supabase.co', '');
    console.log('Project ID:', projectId);
    console.log('Required Google Redirect URI:', `${cleanUrl}/auth/v1/callback`);
    console.log('📋 COPY THIS REDIRECT URI TO GOOGLE CLOUD CONSOLE:', `${cleanUrl}/auth/v1/callback`);
  }

  // Debug redirect URI configuration
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'yabble',
    path: 'auth',
  });
  console.log('Mobile app redirect URI:', redirectUri);

  // Test Supabase connection
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('Supabase connection:', error ? 'Failed' : 'Success');
    if (error) console.log('Supabase error:', error);
  } catch (e) {
    console.log('Supabase connection error:', e);
  }

  console.log('=== End Debug Info ===');
}

/**
 * Test OAuth provider availability and debug the actual request
 */
export async function testOAuthProvider(provider: 'google' | 'apple' | 'facebook') {
  console.log(`=== Testing ${provider} OAuth ===`);

  try {
    // Test with the actual redirect URI that will be used
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'yabble',
      path: 'auth',
    });

    console.log(`Using redirect URI: ${redirectUri}`);

    // This will show us what Supabase returns for the provider
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true, // Don't actually redirect, just test
      },
    });

    console.log(`${provider} OAuth test result:`, { data, error });

    if (data?.url) {
      console.log(`Generated OAuth URL: ${data.url}`);

      // Parse the URL to see what redirect_uri is being sent
      try {
        const url = new URL(data.url);
        const redirectUriParam = url.searchParams.get('redirect_to');
        console.log(`Redirect URI in request: ${redirectUriParam}`);

        // Check if this matches what should be in Google Cloud Console
        const expectedRedirectUri = getRequiredGoogleRedirectUri();
        console.log(`Expected in Google Console: ${expectedRedirectUri}`);
        console.log(`Match: ${redirectUriParam === expectedRedirectUri ? '✅ YES' : '❌ NO'}`);
      } catch (urlError) {
        console.log('Could not parse OAuth URL:', urlError);
      }
    }

    if (error) {
      console.log(`${provider} OAuth error details:`, {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
      });
    }

    return { data, error };
  } catch (e) {
    console.log(`${provider} OAuth test failed:`, e);
    return { error: e };
  }
}

/**
 * Get the exact redirect URI that should be configured in Google Cloud Console
 */
export function getRequiredGoogleRedirectUri(): string {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL not found');
  }
  // Clean up the URL to remove trailing slashes
  const cleanUrl = supabaseUrl.replace(/\/$/, '');
  return `${cleanUrl}/auth/v1/callback`;
}

/**
 * Display redirect URI setup instructions
 */
export function showRedirectUriInstructions() {
  const redirectUri = getRequiredGoogleRedirectUri();

  console.log('🔧 GOOGLE OAUTH SETUP INSTRUCTIONS:');
  console.log('1. Go to Google Cloud Console');
  console.log('2. Navigate to APIs & Services → Credentials');
  console.log('3. Edit your OAuth 2.0 Client ID');
  console.log('4. Add this EXACT redirect URI:');
  console.log(`   ${redirectUri}`);
  console.log('5. Save the changes');
  console.log('6. Try OAuth again');
  console.log('');
  console.log('⚠️  IMPORTANT: The URI must match EXACTLY - no extra slashes, correct https, etc.');

  return redirectUri;
}

/**
 * Debug the actual OAuth flow step by step
 */
export async function debugOAuthFlow(provider: 'google' | 'apple' | 'facebook') {
  console.log(`🔍 DEBUGGING ${provider.toUpperCase()} OAUTH FLOW:`);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const cleanUrl = supabaseUrl?.replace(/\/$/, '');
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'yabble',
    path: 'auth',
  });

  console.log('1. Environment check:');
  console.log(`   Supabase URL: ${cleanUrl}`);
  console.log(`   Mobile redirect: ${redirectUri}`);

  console.log('2. Expected Google Cloud Console setup:');
  console.log(`   Redirect URI: ${cleanUrl}/auth/v1/callback`);

  console.log('3. Testing OAuth request...');

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (data?.url) {
      console.log('4. Generated OAuth URL analysis:');
      const url = new URL(data.url);
      console.log(`   Full URL: ${data.url}`);
      console.log(`   Host: ${url.host}`);
      console.log(`   Provider: ${url.searchParams.get('provider')}`);
      console.log(`   Redirect to: ${url.searchParams.get('redirect_to')}`);

      // The actual redirect_uri that Google will validate
      const actualRedirectUri = `${cleanUrl}/auth/v1/callback`;
      console.log(`   Actual redirect_uri sent to Google: ${actualRedirectUri}`);
    }

    if (error) {
      console.log('4. OAuth test error:', error);
    }
  } catch (e) {
    console.log('4. OAuth test failed:', e);
  }
}
