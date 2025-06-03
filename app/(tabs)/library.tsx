import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { Search, Filter, Headphones } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import AudiobookCard from '../../components/audiobook/AudiobookCard';
import Input from '../../components/ui/Input';
import { useAudiobooks } from '../../hooks/useAudiobooks';
import type { Tables } from '../../lib/database';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

type FilterStatus = 'all' | 'completed' | 'draft';

export default function LibraryScreen() {
  const { audiobooks, isLoading, error, refreshAudiobooks } = useAudiobooks();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  useFocusEffect(
    useCallback(() => {
      refreshAudiobooks();
    }, [])
  );

  const filteredBooks = audiobooks.filter((book) => {
    const matchesSearch = book.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' || book.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const renderFilterTab = (label: string, value: FilterStatus) => (
    <Pressable
      style={[
        styles.filterTab,
        filterStatus === value && styles.activeFilterTab,
      ]}
      onPress={() => setFilterStatus(value)}
    >
      <Text
        style={[
          styles.filterTabText,
          filterStatus === value && styles.activeFilterTabText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.black} />
          <Text style={styles.emptyText}>Loading your audiobooks...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorTitle}>Error loading audiobooks</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Headphones size={48} color={Colors.gray[400]} />
        </View>
        <Text style={styles.emptyTitle}>No audiobooks found</Text>
        <Text style={styles.emptyText}>
          {searchQuery
            ? 'Try a different search term'
            : 'Start creating your first audiobook'}
        </Text>
      </View>
    );
  };

  const handleShare = async (audiobook: Tables['audiobooks']['Row']) => {
    try {
      if (Platform.OS === 'web') {
        // Web sharing
        if (navigator.share) {
          await navigator.share({
            title: audiobook.title,
            text: 'Check out my audiobook!',
            url: audiobook.audio_url || window.location.href,
          });
        } else {
          // Fallback for browsers that don't support Web Share API
          await navigator.clipboard.writeText(
            audiobook.audio_url || window.location.href
          );
          alert('Link copied to clipboard!');
        }
      } else {
        // Native sharing
        await Share.share({
          title: audiobook.title,
          message: `Check out my audiobook: ${audiobook.title}`,
          url: audiobook.audio_url ?? undefined,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDownload = async (audiobook: Tables['audiobooks']['Row']) => {
    if (!audiobook.audio_url) {
      Alert.alert('Error', 'Audio URL not available');
      return;
    }

    const fileName = `${audiobook.title.replace(/[^a-zA-Z0-9\s]/g, '_')}.mp3`;
    const fileUri = FileSystem.cacheDirectory + fileName;

    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = audiobook.audio_url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      try {
        Alert.alert(
          'Preparing Download',
          `Starting download for "${audiobook.title}"...`
        );

        if (audiobook.audio_url.startsWith('data:')) {
          const base64Data = audiobook.audio_url.split(',')[1];
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } else {
          const downloadResult = await FileSystem.downloadAsync(
            audiobook.audio_url,
            fileUri
          );
          if (downloadResult.status !== 200) {
            Alert.alert(
              'Download Failed',
              `Failed to download "${audiobook.title}". Status: ${downloadResult.status}`
            );
            return;
          }
        }

        if (Platform.OS === 'android') {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') {
            try {
              const asset = await MediaLibrary.createAssetAsync(fileUri);
              // Optionally, try to move to a common album like 'Downloads' or your app's name
              // This is a best-effort and behavior can vary by Android version/manufacturer
              const album = await MediaLibrary.getAlbumAsync('Downloads');
              if (album) {
                await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
              } else {
                // Some devices might not have a standard 'Downloads' album accessible this way
                // Or you could create one specific to your app
                await MediaLibrary.createAlbumAsync(
                  'Downloaded Audiobooks',
                  asset,
                  false
                );
              }
              Alert.alert(
                'Download Complete',
                `"${audiobook.title}" saved to your device. Check your Files or Music app.`
              );
            } catch (saveError: any) {
              console.error('MediaLibrary save error:', saveError);
              Alert.alert(
                'Save Error',
                'Failed to save the audiobook to your library. It might be in app cache.'
              );
            }
          } else {
            Alert.alert(
              'Permission Denied',
              'Storage permission is required to save the audiobook.'
            );
          }
        } else if (Platform.OS === 'ios') {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'audio/mpeg',
              dialogTitle: `Share or save "${audiobook.title}"`,
            });
          } else {
            Alert.alert(
              'Sharing Not Available',
              'Sharing is not available on this device.'
            );
          }
        }
      } catch (e: any) {
        console.error('Download/Share error:', e);
        Alert.alert('Error', `An error occurred: ${e.message}`);
      }
    }
  };

  const renderAudiobookItem = ({
    item,
  }: {
    item: Tables['audiobooks']['Row'];
  }) => (
    <AudiobookCard
      book={item}
      onShare={() => handleShare(item)}
      onDownload={() => handleDownload(item)}
      onDelete={refreshAudiobooks}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Library</Text>
        <Input
          placeholder="Search audiobooks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchContainer}
          leftIcon={<Search size={18} color={Colors.gray[400]} />}
        />

        <View style={styles.filterContainer}>
          {renderFilterTab('All', 'all')}
          {renderFilterTab('Completed', 'completed')}
          {renderFilterTab('Drafts', 'draft')}

          <Pressable style={styles.filterButton}>
            <Filter size={18} color={Colors.black} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filteredBooks}
        renderItem={renderAudiobookItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        onRefresh={refreshAudiobooks}
        refreshing={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softCream,
  },
  header: {
    padding: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Layout.spacing.sm,
  },
  searchContainer: {
    marginBottom: Layout.spacing.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Layout.borderRadius.full,
    marginRight: Layout.spacing.sm,
  },
  activeFilterTab: {
    backgroundColor: Colors.black,
  },
  filterTabText: {
    fontSize: 14,
    color: Colors.black,
  },
  activeFilterTabText: {
    color: Colors.white,
    fontWeight: '500',
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightPeach,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  listContent: {
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xxl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Layout.spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: Layout.spacing.xs,
  },
  errorText: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center',
  },
});
