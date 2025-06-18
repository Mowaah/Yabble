# OAuth Setup Guide

This guide explains how to set up OAuth authentication with Google, Apple, and Facebook for your Yabble audiobook app.

## Prerequisites

- Supabase project with authentication enabled
- Developer accounts with Google, Apple, and Facebook
- Your app configured with the correct redirect URLs

## 1. Supabase Configuration

### Enable OAuth Providers in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Enable the following providers:
   - Google
   - Apple
   - Facebook

### Configure Redirect URLs

Add these redirect URLs to your Supabase auth settings:

**For Development with Expo Go:**

- `http://localhost:8081/auth` (Expo web)
- `exp://[your-expo-session-id].exp.direct/--/auth` (Expo Go app)
  - ⚠️ **Important**: This URL changes each time you restart Expo. Check your console logs for the exact URL.
  - Example: `exp://hh_w0zk-mowaa-8081.exp.direct/--/auth`

**For Development with Standalone App:**

- `http://localhost:8081/auth` (Expo web)
- `yabble://auth` (Mobile deep link)

**For Production:**

- `https://yourdomain.com/auth` (Your web domain)
- `yabble://auth` (Mobile deep link)

### How to Find Your Expo Go Redirect URL

1. Start your app with `npm run dev`
2. Open the app in Expo Go
3. Try to sign in with Google (it will fail initially)
4. Check your console logs for a line like:
   ```
   OAuth Redirect URI: exp://hh_w0zk-mowaa-8081.exp.direct/--/auth
   ```
5. Copy this exact URL to your Supabase redirect URLs

## 2. Google OAuth Setup (Native Sign-In for Mobile)

### For Mobile Apps (Recommended)

Mobile apps should use **Native Google Sign-In** instead of OAuth flow for better user experience.

### Create Google OAuth Clients

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API (or Google Identity API)
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID

You need to create **separate OAuth clients** for each platform:

### Android OAuth Client

1. **Application type**: Android
2. **Package name**: `com.yabble.app` (from your app.config.js)
3. **SHA-1 certificate fingerprint**:
   - **For Development**: Get from `eas credentials` command
   - **For Production**: Get from Google Play Console → App signing

### iOS OAuth Client

1. **Application type**: iOS
2. **Bundle ID**: `com.yabble.app` (from your app.config.js)
3. **App Store ID**: (if published)
4. **Team ID**: (from Apple Developer account)

### Web OAuth Client (Required for Supabase)

1. **Application type**: Web application
2. **Authorized redirect URIs**: `https://agntiglgnujyppjzcflk.supabase.co/auth/v1/callback`

### Add to Supabase

1. In Supabase Dashboard > Authentication > Providers > Google
2. Enable Google provider
3. **Client IDs**: Add ALL the Client IDs you created (Android, iOS, Web) separated by commas:
   ```
   939237185009-android-client-id.apps.googleusercontent.com,
   939237185009-ios-client-id.apps.googleusercontent.com,
   939237185009-75c21naruful8i2dj49t58m4g692pg4v.apps.googleusercontent.com
   ```
4. **Client Secret**: Use the Web client secret
5. **Skip nonce check**: Enable this for iOS (recommended)

### Update Your App Code

The native Google Sign-In is already configured in your `lib/oauth.ts` file with:

- **Web Client ID**: `939237185009-75c21naruful8i2dj49t58m4g692pg4v.apps.googleusercontent.com`
- **Scopes**: Email and profile access

### Testing

1. **Development**: Make sure you've added the development SHA-1 certificate
2. **Production**: Make sure you've added the production SHA-1 certificate from Google Play Console

## 3. Apple Sign-In Setup

### Apple Developer Account Setup

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Navigate to Certificates, Identifiers & Profiles
3. Create a new App ID or configure existing one
4. Enable "Sign In with Apple" capability

### Create Service ID

1. Create a new Services ID
2. Configure it for "Sign In with Apple"
3. Add your domain and redirect URL:
   - Primary App ID: Your app's bundle ID
   - Web Domain: `yourdomain.com`
   - Return URLs: `https://[your-supabase-project].supabase.co/auth/v1/callback`

### Generate Private Key

1. Create a new private key for "Sign In with Apple"
2. Download the .p8 file
3. Note the Key ID

### Add to Supabase

1. In Supabase Dashboard > Authentication > Providers > Apple
2. Enable Apple provider and add:
   - Client ID: Your Services ID
   - Client Secret: Generated using your private key (see Supabase docs)

## 4. Facebook OAuth Setup

### Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product

### Configure Facebook Login

**Valid OAuth Redirect URIs:**

- `https://[your-supabase-project].supabase.co/auth/v1/callback`

**Valid Domains:**

- `localhost:8081` (for development)
- `yourdomain.com` (for production)

### Add to Supabase

1. Copy App ID and App Secret from Facebook App Dashboard
2. In Supabase Dashboard > Authentication > Providers > Facebook
3. Enable Facebook provider and add your credentials

## 5. Mobile App Configuration

### Android Configuration

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<activity
    android:name="com.facebook.react.devsupport.DevSettingsActivity" />

<!-- Deep Link Handler -->
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:launchMode="singleTop"
    android:theme="@style/Theme.App.SplashScreen">

    <!-- Existing intent filters -->

    <!-- OAuth Deep Link -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="yabble" android:host="auth" />
    </intent-filter>
</activity>
```

### iOS Configuration

Add to `ios/YourApp/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>YabbleOAuth</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>yabble</string>
        </array>
    </dict>
</array>
```

## 6. Environment Variables

Add these to your `.env` file:

```bash
# Supabase (already configured)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OAuth Redirect URI (for reference)
OAUTH_REDIRECT_URI=yabble://auth
```

## 7. Testing OAuth Flow

### Development Testing

1. Start your Expo development server: `npm run dev`
2. Open your app in Expo Go or simulator
3. Navigate to sign-in screen
4. Test each OAuth provider
5. Verify successful authentication and user session

### Common Issues

**"OAuth provider not configured":**

- Check that the provider is enabled in Supabase dashboard
- Verify client credentials are correctly entered

**"Invalid redirect URI":**

- Ensure redirect URIs match exactly in all configurations
- Check URL scheme matches `yabble://auth`

**Mobile app doesn't handle deep link:**

- Verify deep link configuration in native code
- Test deep link manually: `adb shell am start -W -a android.intent.action.VIEW -d "yabble://auth" com.yabble.app`

## 8. Production Deployment

### Before Publishing

1. Update redirect URLs to use production domains
2. Configure App Store Connect / Google Play Console with OAuth capabilities
3. Test OAuth flow with production builds
4. Verify privacy policy includes OAuth data usage

### App Store Requirements

**Apple App Store:**

- If using Apple Sign-In, it must be prominently displayed
- Privacy policy must mention data collection

**Google Play Store:**

- Verify OAuth scopes match declared permissions
- Update privacy policy with OAuth provider data usage

## Security Considerations

1. **Never expose client secrets in client-side code**
2. **Use HTTPS for all redirect URLs in production**
3. **Implement proper session management**
4. **Regularly rotate OAuth credentials**
5. **Monitor OAuth usage in provider dashboards**

## Support

If you encounter issues:

1. Check Supabase auth logs
2. Verify OAuth provider configurations
3. Test with minimal example
4. Check network connectivity and firewalls
5. Consult provider-specific documentation

---

**Note:** OAuth setup can be complex and provider-specific. Always refer to the latest documentation from each OAuth provider for the most current setup instructions.
