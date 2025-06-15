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

**For Development:**

- `http://localhost:8081/auth` (Expo web)
- `yabble://auth` (Mobile deep link)

**For Production:**

- `https://yourdomain.com/auth` (Your web domain)
- `yabble://auth` (Mobile deep link)

## 2. Google OAuth Setup

### Create Google OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID

### Configure OAuth Client

**For Web Application:**

- Authorized JavaScript origins: `http://localhost:8081`, `https://yourdomain.com`
- Authorized redirect URIs: `https://[your-supabase-project].supabase.co/auth/v1/callback`

**For Mobile Application (Android):**

- Package name: `com.yabble.app`
- SHA-1 certificate fingerprint: (Get from your keystore)

**For Mobile Application (iOS):**

- Bundle ID: `com.yabble.app`

### Add to Supabase

1. Copy the Client ID (Client Secret is not needed for mobile OAuth)
2. In Supabase Dashboard > Authentication > Providers > Google
3. Enable Google provider and add your Client ID
4. Leave Client Secret empty for mobile-only apps

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
