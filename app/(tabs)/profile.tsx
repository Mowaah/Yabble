import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Dimensions,
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
  Sparkles,
  Trophy,
  Target,
  Calendar,
  Star,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useProfile } from '../../hooks/useProfile';
import { signOut as supabaseSignOut } from '../../lib/auth';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

const { width } = Dimensions.get('window');

// Enhanced color palette
const EnhancedColors = {
  ...Colors,
  accent: '#6366F1', // Indigo accent
  success: '#10B981', // Emerald
  warning: '#F59E0B', // Amber
  info: '#3B82F6', // Blue
  surface: '#F8FAFC', // Light surface
  cardShadow: 'rgba(15, 23, 42, 0.08)',
  bottomSheetHandle: 'rgba(0, 0, 0, 0.1)',
  gradient: {
    primary: ['#8B5CF6', '#A855F7'],
    secondary: ['#06B6D4', '#0891B2'],
    accent: ['#EC4899', '#BE185D'],
  },
  glass: 'rgba(255, 255, 255, 0.1)',
};

function ProfileScreenContent() {
  const { profile, isLoading: profileLoading, error: profileError, updateProfile } = useProfile();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleComingSoon = () => {
    Alert.alert('Coming Soon!', 'This feature is under development and will be available in a future update.');
  };

  // Bottom sheet state
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['33%'], []);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleCloseModalPress = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.5} />
    ),
    []
  );

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile?.name]);

  const handleToggleEditMode = async () => {
    if (isEditMode && isEditingName) {
      await handleNameUpdate();
    }
    setIsEditMode(!isEditMode);
  };

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
    handleCloseModalPress();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
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

  const handleAvatarRemove = async () => {
    handleCloseModalPress();
    if (profile) {
      setIsUpdating(true);
      try {
        await updateProfile({
          ...profile,
          avatar_url: null,
          avatarFile: undefined,
        });
      } catch (error) {
        Alert.alert('Remove Error', 'Failed to remove your avatar.');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const menuItems = [
    {
      icon: <Settings size={22} color={EnhancedColors.accent} />,
      title: 'Account Settings',
      subtitle: 'Privacy, security & preferences',
      onPress: handleComingSoon,
      color: EnhancedColors.accent,
    },
    {
      icon: <CreditCard size={22} color={EnhancedColors.success} />,
      title: 'Subscription',
      subtitle: 'Manage your plan & billing',
      onPress: handleComingSoon,
      color: EnhancedColors.success,
    },
    {
      icon: <Share2 size={22} color={EnhancedColors.info} />,
      title: 'Share & Earn',
      subtitle: 'Invite friends and get rewards',
      onPress: handleComingSoon,
      color: EnhancedColors.info,
    },
    {
      icon: <Shield size={22} color={EnhancedColors.warning} />,
      title: 'Privacy & Security',
      subtitle: 'Control your data & safety',
      onPress: handleComingSoon,
      color: EnhancedColors.warning,
    },
  ];

  const achievements = [
    {
      icon: <BookOpen size={18} color={Colors.white} />,
      value: 0,
      label: 'Books Created',
      color: EnhancedColors.success,
      isMock: true,
    },
    {
      icon: <Clock size={18} color={Colors.white} />,
      value: '12h',
      label: 'Reading Time',
      color: EnhancedColors.info,
      isMock: true,
    },
    {
      icon: <Trophy size={18} color={Colors.white} />,
      value: 5,
      label: 'Achievements',
      color: EnhancedColors.warning,
      isMock: true,
    },
    {
      icon: <Target size={18} color={Colors.white} />,
      value: '7',
      label: 'Streak Days',
      color: EnhancedColors.accent,
      isMock: true,
    },
  ];

  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Header with Gradient */}
        <View style={[styles.profileHeader, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerGradient} />

          <View style={styles.profileHeaderContent}>
            {/* Enhanced Avatar Section */}
            <View style={styles.avatarSection}>
              <Pressable style={styles.avatarContainer} onPress={handlePresentModalPress}>
                {isUpdating && (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator size="large" color={Colors.white} />
                  </View>
                )}
                <Image
                  key={profile?.avatar_url}
                  source={{
                    uri:
                      profile?.avatar_url ||
                      'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
                  }}
                  style={styles.avatar}
                />
                <View style={styles.avatarRing} />
              </Pressable>

              {/* Premium Badge */}
              {profile?.is_premium && (
                <View style={styles.premiumBadge}>
                  <Star size={12} color={Colors.white} />
                  <Text style={styles.premiumBadgeText}>PRO</Text>
                </View>
              )}
            </View>

            {/* Enhanced Profile Info */}
            <View style={styles.profileInfo}>
              {isEditingName ? (
                <View style={styles.editNameContainer}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    style={styles.nameInput}
                    autoFocus
                    placeholder="Enter your name"
                    placeholderTextColor={EnhancedColors.glass}
                  />
                  <Pressable style={styles.saveButton} onPress={handleNameUpdate} disabled={isUpdating}>
                    {isUpdating ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Check size={18} color={Colors.white} />
                    )}
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => setIsEditingName(true)} style={styles.nameContainer}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {profile?.name || 'Anonymous User'}
                  </Text>
                </Pressable>
              )}

              <Text style={styles.profileEmail}>{profile?.email}</Text>

              {/* Join Date */}
              <View style={styles.joinDateContainer}>
                <Calendar size={14} color={Colors.gray[300]} />
                <Text style={styles.joinDate}>Member since {new Date().getFullYear()}</Text>
              </View>
            </View>
          </View>

          {/* Enhanced Stats Cards */}
          <View style={styles.statsContainer}>
            {achievements.map((stat, index) => (
              <Pressable
                key={index}
                style={styles.statCardWrapper}
                onPress={stat.isMock ? handleComingSoon : undefined}
              >
                <View style={[styles.statCard, { backgroundColor: stat.color }, stat.isMock && { opacity: 0.7 }]}>
                  {stat.isMock && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(0,0,0,0.25)',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                        zIndex: 1,
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 8, fontWeight: 'bold', letterSpacing: 0.5 }}>SOON</Text>
                    </View>
                  )}
                  <View style={styles.statIconContainer}>{stat.icon}</View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel} numberOfLines={1}>
                    {stat.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.mainContent}>
          {/* Enhanced Premium Banner */}
          {!profile?.is_premium && (
            <Pressable style={styles.premiumBanner} onPress={handleComingSoon}>
              <View style={styles.premiumGradient} />
              <View style={styles.premiumContent}>
                <View style={styles.premiumIcon}>
                  <Sparkles size={28} color={Colors.white} />
                </View>
                <View style={styles.premiumTextContainer}>
                  <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                  <Text style={styles.premiumDesc}>Unlock unlimited books, advanced voices & more</Text>
                </View>
                <ChevronRight size={24} color={Colors.white} />
              </View>
            </Pressable>
          )}

          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                  index === menuItems.length - 1 && styles.lastMenuItem,
                ]}
                onPress={item.onPress}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>{item.icon}</View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
                <ChevronRight size={20} color={Colors.gray[400]} />
              </Pressable>
            ))}
          </View>

          {/* Enhanced Sign Out Button */}
          <Pressable style={styles.signOutButton} onPress={handleSignOut} disabled={isSigningOut}>
            <View style={styles.signOutContent}>
              {isSigningOut ? (
                <ActivityIndicator size="small" color={Colors.error} />
              ) : (
                <LogOut size={20} color={Colors.error} />
              )}
              <Text style={styles.signOutButtonText}>{isSigningOut ? 'Signing out...' : 'Sign Out'}</Text>
            </View>
          </Pressable>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appVersion}>Yabble v1.0.0</Text>
            <Text style={styles.appCopyright}>© 2024 Yabble. All rights reserved.</Text>
          </View>
        </View>
      </ScrollView>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        handleIndicatorStyle={styles.bottomSheetHandle}
        backgroundStyle={styles.bottomSheetBackground}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.modalTitle}>Change Profile Photo</Text>
          <Pressable
            style={({ pressed }) => [styles.modalButton, pressed && styles.modalButtonPressed]}
            onPress={handleAvatarChange}
          >
            <ImageIcon size={22} color={EnhancedColors.accent} style={styles.modalButtonIcon} />
            <Text style={styles.modalButtonText}>Choose from Gallery</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.modalButton, pressed && styles.modalButtonPressed]}
            onPress={handleAvatarRemove}
          >
            <Trash2 size={22} color={Colors.error} style={styles.modalButtonIcon} />
            <Text style={[styles.modalButtonText, { color: Colors.error }]}>Remove Photo</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}

export default function ProfileScreen() {
  return <ProfileScreenContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EnhancedColors.surface,
  },
  scrollContent: {
    paddingBottom: Layout.spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: EnhancedColors.surface,
  },
  loadingText: {
    marginTop: Layout.spacing.md,
    fontSize: 16,
    color: Colors.gray[600],
    fontWeight: '500',
  },
  mainContent: {
    padding: Layout.spacing.lg,
  },
  profileHeader: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    opacity: 0.9,
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginRight: Layout.spacing.lg,
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 46.5,
    borderWidth: 2,
    borderColor: EnhancedColors.glass,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 42.5,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EnhancedColors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.white,
    marginLeft: 4,
  },
  profileInfo: {
    flex: 1,
    paddingTop: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    borderBottomWidth: 2,
    borderColor: Colors.white,
    paddingVertical: 4,
    marginRight: Layout.spacing.sm,
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    marginRight: Layout.spacing.sm,
  },
  profileEmail: {
    fontSize: 15,
    color: Colors.gray[200],
    marginBottom: 8,
  },
  joinDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinDate: {
    fontSize: 13,
    color: Colors.gray[300],
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Layout.spacing.sm,
  },
  statCardWrapper: {
    flex: 1,
    marginHorizontal: 3,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
    zIndex: 1,
  },
  comingSoonText: {
    color: Colors.white,
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  premiumBanner: {
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Layout.spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  premiumGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
  },
  premiumIcon: {
    marginRight: Layout.spacing.sm,
    backgroundColor: EnhancedColors.glass,
    padding: 8,
    borderRadius: Layout.borderRadius.full,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 2,
  },
  premiumDesc: {
    fontSize: 13,
    color: Colors.gray[200],
    marginBottom: 4,
  },
  premiumFeatures: {
    flexDirection: 'row',
  },
  premiumFeature: {
    fontSize: 11,
    color: Colors.gray[300],
    marginRight: Layout.spacing.sm,
  },
  sectionHeader: {
    marginBottom: Layout.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  menuContainer: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: EnhancedColors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemPressed: {
    backgroundColor: Colors.gray[50],
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.gray[800],
    fontWeight: '600',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: Colors.gray[500],
  },
  signOutButton: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    marginTop: Layout.spacing.xl,
    shadowColor: EnhancedColors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  signOutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.md,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
    marginLeft: Layout.spacing.sm,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  appVersion: {
    fontSize: 13,
    color: Colors.gray[400],
    fontWeight: '500',
  },
  appCopyright: {
    fontSize: 11,
    color: Colors.gray[400],
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: EnhancedColors.glass,
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  // Bottom Sheet Styles
  bottomSheetBackground: {
    backgroundColor: EnhancedColors.surface,
    borderRadius: 24,
  },
  bottomSheetHandle: {
    backgroundColor: EnhancedColors.bottomSheetHandle,
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  bottomSheetContent: {
    padding: Layout.spacing.lg,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.lg,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    width: '100%',
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  modalButtonPressed: {
    backgroundColor: Colors.gray[100],
  },
  modalButtonIcon: {
    marginRight: Layout.spacing.md,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
  },
});
