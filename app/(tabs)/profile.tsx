import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Settings,
  CreditCard,
  Share2,
  ChevronRight,
  Volume2,
  Shield,
  LogOut,
  Edit2,
  Check,
  Award,
  BookOpen,
  Clock,
} from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useProfile } from '../../hooks/useProfile';
import { signOut as supabaseSignOut } from '../../lib/auth';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
    updateProfile,
  } = useProfile();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile?.name]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabaseSignOut();
      router.replace('/(auth)/sign-in');
    } catch (e: any) {
      Alert.alert('Sign Out Error', e.message || 'Failed to sign out');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleNameUpdate = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    if (!profile) return;

    setIsUpdating(true);
    try {
      await updateProfile({ ...profile, name });
      setIsEditingName(false);
    } catch (error) {
      Alert.alert('Update Error', 'Failed to update your name.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarChange = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Sorry, we need camera roll permissions to make this work!'
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const { assets } = result;
      if (assets && assets.length > 0) {
        const { uri } = assets[0];
        const fileName = uri.split('/').pop();
        const file = {
          uri,
          name: fileName || `avatar-${Date.now()}.jpg`,
        };

        if (profile) {
          setIsUpdating(true);
          try {
            await updateProfile({ ...profile, avatarFile: file });
          } catch (error) {
            Alert.alert('Upload Error', 'Failed to update your avatar.');
          } finally {
            setIsUpdating(false);
          }
        }
      }
    }
  };

  const menuItems = [
    {
      icon: <Settings size={20} color={Colors.gray[600]} />,
      title: 'Account Settings',
      onPress: () => {},
    },
    {
      icon: <CreditCard size={20} color={Colors.gray[600]} />,
      title: 'Subscription',
      onPress: () => {},
    },
    {
      icon: <Share2 size={20} color={Colors.gray[600]} />,
      title: 'Share & Earn',
      onPress: () => {},
    },
    {
      icon: <LogOut size={20} color={Colors.error} />,
      title: 'Sign Out',
      textColor: Colors.error,
      onPress: handleSignOut,
      loading: isSigningOut,
    },
  ];

  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileHeader}>
        <Pressable style={styles.avatarContainer} onPress={handleAvatarChange}>
          {isUpdating && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator size="large" color={Colors.white} />
            </View>
          )}
          <Image
            source={{
              uri:
                profile?.avatar_url ||
                'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            }}
            style={styles.avatar}
          />
          <View style={styles.avatarEditBadge}>
            <Edit2 size={12} color={Colors.white} />
          </View>
        </Pressable>

        <View style={styles.profileInfo}>
          {isEditingName ? (
            <View style={styles.editNameContainer}>
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.nameInput}
                autoFocus
              />
              <Pressable onPress={handleNameUpdate} disabled={isUpdating}>
                {isUpdating ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Check size={24} color={Colors.primary} />
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.nameContainer}>
              <Text style={styles.profileName} numberOfLines={1}>
                {profile?.name || 'Anonymous'}
              </Text>
              <Pressable onPress={() => setIsEditingName(true)}>
                <Edit2 size={18} color={Colors.gray[500]} />
              </Pressable>
            </View>
          )}

          <Text style={styles.profileEmail}>{profile?.email}</Text>
        </View>
      </View>

      <Card style={styles.statsCard}>
        <View style={styles.statItem}>
          <BookOpen size={24} color={Colors.primary} />
          <Text style={styles.statValue}>{profile?.created_books || 0}</Text>
          <Text style={styles.statLabel}>Audiobooks</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Clock size={24} color={Colors.primary} />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Hours Listened</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Award size={24} color={Colors.primary} />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Challenges</Text>
        </View>
      </Card>

      {!profile?.is_premium && (
        <Card style={styles.premiumCard}>
          <View>
            <Text style={styles.premiumTitle}>Upgrade to Yabble Premium</Text>
            <Text style={styles.premiumDesc}>
              Unlock premium voices, advanced editing, and more.
            </Text>
          </View>
          <Button
            title="Upgrade Now"
            variant="secondary"
            onPress={() => {}}
            style={styles.upgradeButton}
          />
        </Card>
      )}

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
            onPress={item.onPress}
            disabled={item.loading}
          >
            <View style={styles.menuIconContainer}>{item.icon}</View>
            <Text
              style={[
                styles.menuItemText,
                item.textColor ? { color: item.textColor } : {},
              ]}
            >
              {item.title}
            </Text>
            <View style={styles.menuRightContent}>
              {item.loading ? (
                <ActivityIndicator
                  size="small"
                  color={item.textColor || Colors.primary}
                />
              ) : (
                <ChevronRight size={20} color={Colors.gray[400]} />
              )}
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Yabble v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softBackground,
  },
  content: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.softBackground,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Layout.spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: Colors.primary,
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  profileInfo: {
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.xs,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.gray[900],
    borderBottomWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 4,
    marginRight: Layout.spacing.sm,
    textAlign: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.gray[900],
    marginRight: Layout.spacing.sm,
  },
  profileEmail: {
    fontSize: 16,
    color: Colors.gray[500],
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.gray[900],
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray[200],
    height: '60%',
    alignSelf: 'center',
  },
  premiumCard: {
    backgroundColor: Colors.primary,
    marginBottom: Layout.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.lg,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Layout.spacing.xs,
  },
  premiumDesc: {
    fontSize: 14,
    color: Colors.gray[200],
    maxWidth: '90%',
  },
  upgradeButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: Layout.spacing.md,
  },
  menuContainer: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  menuItemPressed: {
    backgroundColor: Colors.gray[50],
  },
  menuIconContainer: {
    marginRight: Layout.spacing.md,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: Colors.gray[800],
    fontWeight: '500',
  },
  menuRightContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 20,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  appVersion: {
    fontSize: 12,
    color: Colors.gray[400],
  },
});
