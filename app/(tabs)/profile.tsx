import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {
  User,
  Settings,
  CreditCard,
  Share2,
  ChevronRight,
  Volume2,
  Shield,
  LogOut,
} from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useProfile } from '../../hooks/useProfile';
import { signOut as supabaseSignOut } from '../../lib/auth';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      const { error } = await supabaseSignOut();
      if (error) {
        throw error;
      }
      router.replace('/(auth)/sign-in');
    } catch (e: any) {
      setSignOutError(e.message || 'Failed to sign out');
    } finally {
      setIsSigningOut(false);
    }
  };

  const menuItems = [
    {
      icon: <Settings size={20} color={Colors.black} />,
      title: 'Account Settings',
      onPress: () => {},
    },
    {
      icon: <Volume2 size={20} color={Colors.black} />,
      title: 'Voice Preferences',
      onPress: () => {},
    },
    {
      icon: <CreditCard size={20} color={Colors.black} />,
      title: 'Subscription',
      onPress: () => {},
    },
    {
      icon: <Shield size={20} color={Colors.black} />,
      title: 'Privacy',
      onPress: () => {},
    },
    {
      icon: <Share2 size={20} color={Colors.black} />,
      title: 'Share App',
      onPress: () => {},
    },
    {
      icon: <LogOut size={20} color={Colors.error} />,
      title: 'Sign Out',
      textColor: Colors.error,
      onPress: handleSignOut,
    },
  ];

  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.black} />
      </View>
    );
  }

  if (profileError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Error loading profile: {profileError}
        </Text>
        <Button title="Try Again" onPress={() => window.location.reload()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileHeader}>
        <Image
          source={{
            uri:
              profile?.avatar_url ||
              'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
          }}
          style={styles.avatar}
        />

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {profile?.name || 'Anonymous User'}
          </Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>

          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profile?.created_books || 0}
              </Text>
              <Text style={styles.statLabel}>Books</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profile?.is_premium ? 'Premium' : 'Free'}
              </Text>
              <Text style={styles.statLabel}>Plan</Text>
            </View>
          </View>
        </View>
      </View>

      {!profile?.is_premium && (
        <Card style={styles.premiumCard}>
          <View style={styles.premiumContent}>
            <View style={styles.premiumInfo}>
              <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
              <Text style={styles.premiumDesc}>
                Unlock all voices and advanced features
              </Text>
            </View>

            <Button
              title="Upgrade"
              variant="secondary"
              onPress={() => {}}
              style={styles.upgradeButton}
            />
          </View>
        </Card>
      )}

      <Card style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              styles.menuItem,
              index < menuItems.length - 1 && styles.menuItemBorder,
              pressed && styles.menuItemPressed,
            ]}
            onPress={item.onPress}
          >
            <View style={styles.menuItemContent}>
              <View style={styles.menuIconContainer}>{item.icon}</View>
              <Text
                style={[
                  styles.menuItemText,
                  item.textColor ? { color: item.textColor } : null,
                ]}
              >
                {item.title}
              </Text>
            </View>
            {item.title === 'Sign Out' && isSigningOut ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <ChevronRight size={18} color={Colors.gray[400]} />
            )}
          </Pressable>
        ))}
      </Card>

      {signOutError && (
        <View style={styles.signOutErrorContainer}>
          <Text style={styles.errorText}>{signOutError}</Text>
        </View>
      )}

      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>StoryVoice v1.0.0</Text>
        <View style={styles.linksContainer}>
          <Text style={styles.link}>Terms of Service</Text>
          <Text style={styles.linkDivider}>•</Text>
          <Text style={styles.link}>Privacy Policy</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softCream,
  },
  content: {
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.softCream,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.softCream,
    padding: Layout.spacing.lg,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Layout.spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: Layout.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: Layout.spacing.sm,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.gray[300],
    marginHorizontal: Layout.spacing.md,
  },
  premiumCard: {
    backgroundColor: Colors.lightPeach,
    marginBottom: Layout.spacing.md,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumInfo: {
    flex: 1,
    marginRight: Layout.spacing.md,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  premiumDesc: {
    fontSize: 14,
    color: Colors.black,
  },
  upgradeButton: {
    paddingHorizontal: Layout.spacing.md,
  },
  menuCard: {
    marginBottom: Layout.spacing.lg,
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  menuItemPressed: {
    backgroundColor: Colors.gray[100],
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.softCream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.black,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: Layout.spacing.lg,
  },
  appVersion: {
    fontSize: 14,
    color: Colors.gray[500],
    marginBottom: Layout.spacing.sm,
  },
  linksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  link: {
    fontSize: 14,
    color: Colors.black,
    textDecorationLine: 'underline',
  },
  linkDivider: {
    fontSize: 14,
    color: Colors.gray[500],
    marginHorizontal: Layout.spacing.xs,
  },
  signOutErrorContainer: {
    padding: Layout.spacing.md,
    alignItems: 'center',
  },
});
