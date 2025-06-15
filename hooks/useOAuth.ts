import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { signInWithGoogle, signInWithApple, signInWithFacebook, OAuthResult } from '../lib/oauth';
import { debugOAuthConfig, testOAuthProvider, showRedirectUriInstructions, debugOAuthFlow } from '../lib/oauth-debug';

export type OAuthProvider = 'google' | 'apple' | 'facebook';

export function useOAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

  const handleOAuthSignIn = useCallback(async (provider: OAuthProvider) => {
    setIsLoading(true);
    setLoadingProvider(provider);

    try {
      // Debug OAuth configuration
      await debugOAuthConfig();

      // Show redirect URI instructions for Google
      if (provider === 'google') {
        showRedirectUriInstructions();
        await debugOAuthFlow(provider);
      }

      // Test provider configuration
      const testResult = await testOAuthProvider(provider);
      if (testResult.error) {
        console.error(`${provider} provider test failed:`, testResult.error);
      }

      let result: OAuthResult;

      switch (provider) {
        case 'google':
          result = await signInWithGoogle();
          break;
        case 'apple':
          result = await signInWithApple();
          break;
        case 'facebook':
          result = await signInWithFacebook();
          break;
        default:
          throw new Error(`Unsupported OAuth provider: ${provider}`);
      }

      if (result.error) {
        throw result.error;
      }

      // Success - the AuthContext will handle the session update
      return result.data;
    } catch (error: any) {
      console.error(`${provider} OAuth error:`, error);

      // Show user-friendly error messages
      let errorMessage = 'Authentication failed. Please try again.';

      if (error.message?.includes('popup_closed') || error.message?.includes('cancelled')) {
        errorMessage = 'Authentication was cancelled.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message?.includes('provider') || error.message?.includes('secret')) {
        errorMessage = `${
          provider.charAt(0).toUpperCase() + provider.slice(1)
        } authentication is not configured properly. Please check the setup.`;
      } else if (error.message?.includes('validation_failed')) {
        errorMessage = 'OAuth configuration error. Please check your Supabase settings.';
      } else if (error.message?.includes('redirect_uri_mismatch')) {
        errorMessage =
          'Redirect URI mismatch. Please check your Google Cloud Console OAuth client configuration. See console for exact redirect URI needed.';
      }

      Alert.alert('Authentication Error', errorMessage, [
        { text: 'OK' },
        {
          text: 'Debug Info',
          onPress: () => {
            console.log('Full error details:', error);
            Alert.alert('Debug Info', `Error: ${error.message}\n\nCheck console for full details.`);
          },
        },
      ]);

      throw error;
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  }, []);

  const signInWithGoogleOAuth = useCallback(() => handleOAuthSignIn('google'), [handleOAuthSignIn]);
  const signInWithAppleOAuth = useCallback(() => handleOAuthSignIn('apple'), [handleOAuthSignIn]);
  const signInWithFacebookOAuth = useCallback(() => handleOAuthSignIn('facebook'), [handleOAuthSignIn]);

  return {
    isLoading,
    loadingProvider,
    signInWithGoogle: signInWithGoogleOAuth,
    signInWithApple: signInWithAppleOAuth,
    signInWithFacebook: signInWithFacebookOAuth,
  };
}
