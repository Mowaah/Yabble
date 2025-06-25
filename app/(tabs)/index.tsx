import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Image,
  ImageBackground,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, TrendingUp, Clock, Zap, Bookmark, Headphones, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import { useHubData } from '../../hooks/useHubAudiobooks';
import { HubAudiobook } from '../../types';
import Card from '../../components/ui/Card';

export default function HubScreen() {
  const { featured, trending, newest, quickListens, isLoading, error, refresh, toggleBookmark } = useHubData();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const renderSectionHeader = (title: string, icon: React.ReactNode) => (
    <View style={styles.sectionHeader}>
      {icon}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderHubCard = ({
    item,
    category,
  }: {
    item: HubAudiobook;
    category: 'trending' | 'newest' | 'quickListens';
  }) => (
    <Pressable onPress={() => router.push(`/library/${item.id}`)} style={styles.hubCard}>
      <View style={styles.hubCardImageContainer}>
        <Image
          source={item.cover_image ? { uri: item.cover_image } : require('../../assets/images/gallery.png')}
          style={styles.hubCardImage}
        />
        <View style={styles.hubCardStatsOverlay}>
          <View style={styles.hubCardStat}>
            <Headphones size={12} color={Colors.white} />
            <Text style={styles.hubCardStatTextOverlay}>{formatDuration(item.duration)}</Text>
          </View>
          <View style={styles.hubCardStat}>
            <Bookmark size={12} color={Colors.white} />
            <Text style={styles.hubCardStatTextOverlay}>{item.bookmarks_count || 0}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.hubCardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.hubCardAuthor} numberOfLines={1}>
        by {item.author?.name || 'Unknown'}
      </Text>
    </Pressable>
  );

  const renderCarousel = (
    data: HubAudiobook[],
    title: string,
    icon: React.ReactNode,
    category: 'trending' | 'newest' | 'quickListens'
  ) => {
    if (!data || data.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        {renderSectionHeader(title, icon)}
        <FlatList
          data={data}
          renderItem={({ item }) => renderHubCard({ item, category })}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
        />
      </View>
    );
  };

  const renderGrid = (
    data: HubAudiobook[],
    title: string,
    icon: React.ReactNode,
    category: 'newest' | 'quickListens'
  ) => {
    if (!data || data.length === 0) {
      return null;
    }

    const CardComponent = ({ item }: { item: HubAudiobook }) => (
      <View style={styles.gridItem}>
        <Pressable onPress={() => router.push(`/library/${item.id}`)} style={[styles.hubCard, styles.hubCardInGrid]}>
          <View style={styles.hubCardImageContainer}>
            <Image
              source={item.cover_image ? { uri: item.cover_image } : require('../../assets/images/gallery.png')}
              style={styles.hubCardImage}
            />
            <View style={styles.hubCardStatsOverlay}>
              <View style={styles.hubCardStat}>
                <Headphones size={12} color={Colors.white} />
                <Text style={styles.hubCardStatTextOverlay}>{formatDuration(item.duration)}</Text>
              </View>
              <View style={styles.hubCardStat}>
                <Bookmark size={12} color={Colors.white} />
                <Text style={styles.hubCardStatTextOverlay}>{item.bookmarks_count || 0}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.hubCardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.hubCardAuthor} numberOfLines={1}>
            by {item.author?.name || 'Unknown'}
          </Text>
        </Pressable>
      </View>
    );

    return (
      <View style={styles.section}>
        {renderSectionHeader(title, icon)}
        <View style={styles.gridContainer}>
          {data.map((item) => (
            <CardComponent key={item.id} item={item} />
          ))}
        </View>
      </View>
    );
  };

  const renderFeaturedCard = () => {
    if (!featured) {
      return null;
    }
    return (
      <View style={styles.section}>
        {renderSectionHeader('Featured Audiobook', <Star size={24} color={Colors.warning} />)}
        <Pressable onPress={() => router.push(`/library/${featured.id}`)}>
          <ImageBackground
            source={featured.cover_image ? { uri: featured.cover_image } : require('../../assets/images/gallery.png')}
            style={styles.featuredCard}
            imageStyle={styles.featuredImage}
          >
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.featuredGradient}>
              <View style={styles.featuredContent}>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {featured.title}
                </Text>
                <Text style={styles.featuredAuthor}>by {featured.author?.name || 'Unknown Author'}</Text>
                <View style={styles.featuredStats}>
                  <View style={styles.featuredStat}>
                    <Headphones size={16} color={Colors.white} />
                    <Text style={styles.featuredStatText}>{formatDuration(featured.duration)}</Text>
                  </View>
                  <View style={styles.featuredStat}>
                    <Bookmark size={16} color={Colors.white} />
                    <Text style={styles.featuredStatText}>{featured.bookmarks_count || 0}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </Pressable>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>The Hub is quiet...</Text>
      <Text style={styles.emptySubText}>Check back later for new community audiobooks.</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Building the Hub...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Pressable onPress={() => refresh()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const hasContent = featured || trending.length > 0 || newest.length > 0 || quickListens.length > 0;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={Colors.primary} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>The Hub</Text>
          <Text style={styles.subtitle}>Discover audiobooks from the Yabble community</Text>
        </View>
        <Pressable onPress={() => Linking.openURL('https://bolt.new/')}>
          <Image source={require('../../assets/images/bolt.png')} style={styles.boltIcon} />
        </Pressable>
      </View>

      {hasContent ? (
        <>
          {renderFeaturedCard()}
          {renderCarousel(trending, 'Trending This Week', <TrendingUp size={22} color={Colors.primary} />, 'trending')}
          {renderGrid(newest, 'Newly Published', <Sparkles size={22} color={Colors.primary} />, 'newest')}
          {renderGrid(
            quickListens,
            'Quick Listens (< 15min)',
            <Clock size={22} color={Colors.primary} />,
            'quickListens'
          )}
        </>
      ) : (
        renderEmptyState()
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: Layout.spacing.xl,
  },
  header: {
    paddingTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.lg,
    paddingLeft: Layout.spacing.lg,
    paddingRight: 120,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.gray[900],
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray[600],
    marginTop: 2,
  },
  section: {
    marginTop: Layout.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginLeft: Layout.spacing.sm,
  },
  carouselContent: {
    paddingHorizontal: Layout.spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Layout.window.height / 5,
    paddingHorizontal: Layout.spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[700],
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.gray[500],
    marginTop: Layout.spacing.sm,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: Layout.spacing.md,
    fontSize: 16,
    color: Colors.gray[600],
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Layout.spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  featuredCard: {
    marginHorizontal: Layout.spacing.lg,
    height: 220,
    borderRadius: Layout.borderRadius.lg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  featuredImage: {
    borderRadius: Layout.borderRadius.lg,
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: Layout.spacing.md,
  },
  featuredContent: {},
  featuredTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  featuredAuthor: {
    fontSize: 14,
    color: Colors.gray[200],
    marginTop: 4,
  },
  featuredStats: {
    flexDirection: 'row',
    marginTop: Layout.spacing.sm,
  },
  featuredStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  featuredStatText: {
    fontSize: 12,
    color: Colors.white,
    marginLeft: Layout.spacing.xs,
    fontWeight: '600',
  },
  hubCard: {
    width: 150,
    marginRight: Layout.spacing.md,
  },
  hubCardImageContainer: {
    width: '100%',
    height: 130,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.gray[200],
    marginBottom: Layout.spacing.sm,
  },
  hubCardImage: {
    width: '100%',
    height: '100%',
  },
  hubCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  hubCardAuthor: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  hubCardStatsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Layout.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  hubCardInGrid: {
    width: '100%',
    marginRight: 0,
  },
  hubCardStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hubCardStatTextOverlay: {
    fontSize: 11,
    color: Colors.white,
    marginLeft: 4,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
  },
  gridItem: {
    width: '48%',
    marginBottom: Layout.spacing.lg,
  },
  boltIcon: {
    width: 100,
    height: 100,
  },
});
