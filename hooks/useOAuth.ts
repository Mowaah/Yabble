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
      // Debug calls have been commented out to simplify the sign-in flow.
      // You can uncomment them if you need to diagnose issues in the future.
      //
      // await debugOAuthConfig();
      // if (provider === 'google') {
      //   showRedirectUriInstructions();
      //   await debugOAuthFlow(provider);
      // }
      // const testResult = await testOAuthProvider(provider);
      // if (testResult.error) {
      //   console.error(`${provider} provider test failed:`, testResult.error);
      // }

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

      return result.data;
    } catch (error: any) {
      console.error(`${provider} OAuth error:`, error);

      const errorMessage =
        error.message?.includes('cancelled') || error.message?.includes('popup_closed')
          ? 'Authentication was cancelled.'
          : 'An unexpected error occurred. Please try again.';

      Alert.alert('Authentication Error', errorMessage, [{ text: 'OK' }]);

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
