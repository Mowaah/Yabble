import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, ActivityIndicator, Platform, Modal, Alert } from 'react-native';
import { Search, Headphones, CheckCircle2, XCircle, Trash2, X, MoreHorizontal } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import AudiobookCard from '../../components/audiobook/AudiobookCard';
import Input from '../../components/ui/Input';
import { useAudiobooks } from '../../hooks/useAudiobooks';
// import type { Tables } from '../../lib/database'; // Temporarily disabled due to TypeScript issues
import { useNavigation } from '@react-navigation/native';
import { prepareAudioFile, FilePreparationError } from '../../utils/fileUtils';
import { saveAudioToDevice, shareAudioFile, MediaError } from '../../utils/mediaUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { audioEffects } from '../../lib/audio';
import { updateAudiobook, bulkDeleteAudiobooks, publishAudiobook, toggleBookmark } from '../../lib/database';
import { shouldAutoFixStatus } from '../../utils/progressUtils';
import { AUDIO_CONSTANTS } from '../../constants/AudioConstants';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

type FilterStatus = 'completed' | 'draft' | 'saved';
type ModalStatus = 'idle' | 'loading' | 'success' | 'error';

export default function LibraryScreen() {
  const { session } = useAuth();
  const { audiobooks, isLoading, error, refreshAudiobooks } = useAudiobooks();
  const navigation = useNavigation();
  const user = session?.user;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('completed');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const [showModal, setShowModal] = useState(false);
  const [modalStatus, setModalStatus] = useState<ModalStatus>('idle');
  const [modalMessage, setModalMessage] = useState('');

  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const router = useRouter();

  // This effect is for fetching data on screen focus/re-focus.
  useFocusEffect(
    useCallback(() => {
      if (session?.user?.id) {
        refreshAudiobooks(session.user.id);
      }
      // Cleanup audio on blur
      const unsubscribe = navigation.addListener('blur', () => {
        audioEffects.stopAllAudio().catch(console.error);
      });

      return unsubscribe;
    }, [session?.user?.id, navigation, refreshAudiobooks]) // Stable dependencies
  );

  // This separate effect handles status fixing only when the audiobook data changes.
  useEffect(() => {
    const fixStatuses = async () => {
      if (!audiobooks || audiobooks.length === 0) return;

      const draftsToFix = audiobooks.filter(shouldAutoFixStatus);

      if (draftsToFix.length > 0) {
        for (const book of draftsToFix) {
          try {
            await updateAudiobook(book.id, { status: 'completed' });
          } catch (error) {
            console.error(`Failed to fix status for "${book.title}":`, error);
          }
        }
        // After fixing, perform one final refresh to get the updated state.
        if (session?.user?.id) {
          refreshAudiobooks(session.user.id);
        }
      }
    };

    fixStatuses();
  }, [audiobooks]); // This effect is now correctly decoupled.

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAudiobooks(session?.user?.id);
    setIsRefreshing(false);
  };

  const getFilterCount = (status: FilterStatus) => {
    if (!audiobooks) return 0;
    if (status === 'saved') {
      return audiobooks.filter((book) => book.is_bookmarked).length;
    }
    return audiobooks.filter((book) => book.status === status).length;
  };

  const toggleFavorite = (bookId: string) => {
    setFavorites((prev) => (prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [bookId, ...prev]));
  };

  const handleToggleBookmark = async (audiobookId: string, isBookmarked: boolean) => {
    if (!user) return; // Or prompt to login
    await toggleBookmark(audiobookId, user.id, isBookmarked);
    await refreshAudiobooks(user.id);
  };

  // Bulk selection functions
  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => !prev);
    setSelectedBooks([]);
  };

  const initiateSelectionMode = (bookId: string) => {
    setIsSelectionMode(true);
    setSelectedBooks([bookId]);
  };

  const selectAllBooks = () => {
    const sortedBooks = getSortedBooks();
    setSelectedBooks(sortedBooks.map((book) => book.id));
  };

  const clearSelection = () => {
    setSelectedBooks([]);
  };

  const toggleBookSelection = (bookId: string) => {
    setSelectedBooks((prev) => (prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]));
  };

  const handleBulkDelete = async () => {
    if (selectedBooks.length === 0) return;

    const confirmed =
      Platform.OS === 'web'
        ? window.confirm(`Are you sure you want to delete ${selectedBooks.length} audiobook(s)?`)
        : await new Promise((resolve) => {
            Alert.alert('Delete Audiobooks', `Are you sure you want to delete ${selectedBooks.length} audiobook(s)?`, [
              { text: 'Cancel', onPress: () => resolve(false) },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => resolve(true),
              },
            ]);
          });

    if (confirmed) {
      try {
        setIsBulkDeleting(true);
        await bulkDeleteAudiobooks(selectedBooks);
        await refreshAudiobooks(session?.user?.id);
        setSelectedBooks([]);
        setIsSelectionMode(false);
      } catch (error) {
        const errorMessage = 'Failed to delete selected audiobooks';
        if (Platform.OS === 'web') {
          alert(errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
      } finally {
        setIsBulkDeleting(false);
      }
    }
  };

  const getSortedBooks = () => {
    if (!audiobooks) return [];

    let filteredBooks = audiobooks.filter((book) => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase());

      if (filterStatus === 'saved') {
        return matchesSearch && book.is_bookmarked;
      }

      const matchesFilter = book.status === filterStatus;
      return matchesSearch && matchesFilter;
    });

    // Sort bookmarked to top
    return filteredBooks.sort((a, b) => {
      const aIsFav = favorites.includes(a.id);
      const bIsFav = favorites.includes(b.id);

      if (aIsFav && !bIsFav) return -1;
      if (!aIsFav && bIsFav) return 1;

      // if both are favorited or not, sort by date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const renderFilterTab = (label: string, value: FilterStatus, count: number) => (
    <Pressable
      style={[styles.filterTab, filterStatus === value && styles.activeFilterTab]}
      onPress={() => setFilterStatus(value)}
    >
      <Text style={[styles.filterTabText, filterStatus === value && styles.activeFilterTabText]}>{label}</Text>
      <View style={[styles.filterCount, filterStatus === value && styles.activeFilterCount]}>
        <Text style={[styles.filterCountText, filterStatus === value && styles.activeFilterCountText]}>{count}</Text>
      </View>
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

    const getEmptyMessage = () => {
      if (searchQuery) {
        return `No audiobooks match "${searchQuery}"`;
      }

      switch (filterStatus) {
        case 'completed':
          return 'No completed audiobooks yet';
        case 'draft':
          return 'No drafts in progress';
        case 'saved':
          return 'No bookmarked audiobooks yet';
        default:
          return 'No audiobooks found';
      }
    };

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Headphones size={48} color={Colors.gray[400]} />
        </View>
        <Text style={styles.emptyTitle}>{getEmptyMessage()}</Text>
        <Text style={styles.emptyText}>
          {searchQuery
            ? 'Try a different search term'
            : filterStatus === 'saved'
            ? 'Bookmark audiobooks by tapping the bookmark icon in the player'
            : 'Start creating your first audiobook'}
        </Text>
      </View>
    );
  };

  const handlePublishToHub = async (bookId: string) => {
    setShowModal(true);
    setModalStatus('loading');
    setModalMessage('Publishing your audiobook to the Hub...');

    try {
      await publishAudiobook(bookId);
      await refreshAudiobooks(session?.user?.id);
      setModalStatus('success');
      setModalMessage('Your audiobook is now live on the Hub!');
    } catch (error: any) {
      setModalStatus('error');
      setModalMessage(error.message || 'Failed to publish audiobook.');
    }
  };

  const handleShare = async (audiobook: any) => {
    setShowModal(true);
    setModalStatus('loading');
    setModalMessage(`Preparing "${audiobook.title}" for sharing...`);

    try {
      const localFileUriToShare = await prepareAudioFile(audiobook.audio_url, audiobook.title, 'sharing');

      // Proceed with platform-specific sharing
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: audiobook.title,
            text: `Check out my audiobook: ${audiobook.title}`,
            url: audiobook.audio_url || window.location.href,
          });
          setModalStatus('success');
          setModalMessage('Shared successfully!');
        } else {
          await navigator.clipboard.writeText(audiobook.audio_url || window.location.href);
          setModalStatus('success');
          setModalMessage('Link copied to clipboard!');
        }
      } else {
        // Native sharing using new utility
        await shareAudioFile(localFileUriToShare, audiobook.title);
        // If shareAudioFile completes without error, the share sheet was presented.
        // For native, we often close the modal once the share sheet is up, rather than waiting for a 'success' state from the share itself.
        closeModal();
      }
    } catch (error: any) {
      console.error('Sharing process error:', error);
      if (error instanceof FilePreparationError || error instanceof MediaError) {
        setModalStatus('error');
        setModalMessage(error.message);
      } else {
        setModalStatus('error');
        setModalMessage(error.message || 'Failed to initiate sharing.');
      }
    }
  };

  const handleDownload = async (audiobook: any) => {
    setShowModal(true);
    setModalStatus('loading');
    setModalMessage(`Downloading "${audiobook.title}"...`);

    try {
      const localFileUriForDownload = await prepareAudioFile(audiobook.audio_url, audiobook.title, 'download');

      // At this point, file is prepared. Proceed with platform-specific saving.
      if (Platform.OS === 'android') {
        await saveAudioToDevice(localFileUriForDownload, audiobook.title);
        setModalStatus('success');
        setModalMessage(`"${audiobook.title}" saved. Check your device's Files app or media gallery.`);
      } else if (Platform.OS === 'ios') {
        // On iOS, saving is typically done via the share sheet.
        await shareAudioFile(localFileUriForDownload, audiobook.title, `Save: ${audiobook.title}`);
        setModalStatus('success');
        setModalMessage('Ready to save. Choose an option from the share menu (e.g., Save to Files).');
      } else if (Platform.OS === 'web') {
        const link = document.createElement('a');
        // For web, it's better to use the original URL for direct download if it's not a data URI
        // as localFileUriForDownload might be a file:// URI from cache which browsers block for direct linking.
        if (audiobook.audio_url && !audiobook.audio_url.startsWith('data:')) {
          link.href = audiobook.audio_url;
        } else {
          // If it was a data URI that got written to cache, downloading from localFileUriForDownload
          // directly via href is tricky. A robust solution would involve reading it to a blob.
          // For now, we alert that this specific case (cached data URI for web download) is complex.
          // Or, we can try to use the localFileUri, knowing it might not be ideal for all browsers.
          console.warn('Web download from cached data URI is not fully optimized. Using original URL if possible.');
          link.href = localFileUriForDownload; // Attempt, but might be problematic
          // A better approach if localFileUriForDownload MUST be used:
          // const blob = await FileSystem.readAsStringAsync(localFileUriForDownload, { encoding: FileSystem.EncodingType.Base64 });
          // link.href = `data:audio/mpeg;base64,${blob}`;
        }
        link.download = `${audiobook.title.replace(/[^a-zA-Z0-9\s]/g, '_')}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setModalStatus('success');
        setModalMessage(`"${audiobook.title}" download initiated in browser.`);
      }
    } catch (error: any) {
      console.error('Download process error:', error);
      if (error instanceof FilePreparationError || error instanceof MediaError) {
        setModalStatus('error');
        setModalMessage(error.message);
      } else {
        setModalStatus('error');
        setModalMessage(error.message || 'An error occurred during the download process.');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalStatus('idle');
    setModalMessage('');
  };

  const renderAudiobookItem = ({ item }: { item: any }) => (
    <AudiobookCard
      book={item}
      context="library"
      isFavorite={favorites.includes(item.id)}
      onToggleFavorite={() => toggleFavorite(item.id)}
      isBookmarked={item.is_bookmarked}
      onToggleBookmark={() => handleToggleBookmark(item.id, !!item.is_bookmarked)}
      onShare={() => handleShare(item)}
      onDownload={() => handleDownload(item)}
      onDelete={() => refreshAudiobooks(session?.user?.id)}
      onPublishToHub={() => handlePublishToHub(item.id)}
      onEdit={() => router.push(`/library/edit/${item.id}`)}
      isSelectionMode={isSelectionMode}
      isSelected={selectedBooks.includes(item.id)}
      onSelect={toggleBookSelection}
      onInitiateSelection={initiateSelectionMode}
    />
  );

  const sortedBooks = getSortedBooks();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Modal transparent={true} animationType="fade" visible={showModal} onRequestClose={closeModal}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            {modalStatus === 'loading' && <ActivityIndicator size="large" color={Colors.orange || '#FF8C00'} />}
            {modalStatus === 'success' && <CheckCircle2 size={48} color={Colors.success || 'green'} />}
            {modalStatus === 'error' && <XCircle size={48} color={Colors.error || 'red'} />}
            <Text style={styles.loadingText}>{modalMessage}</Text>
            {(modalStatus === 'success' || modalStatus === 'error') && (
              <Pressable style={styles.okButton} onPress={closeModal}>
                <Text style={styles.okButtonText}>OK</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        {!isSelectionMode ? (
          <>
            <Text style={styles.title}>Your Library</Text>
            <Input
              placeholder="Search audiobooks..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              containerStyle={styles.searchContainer}
              leftIcon={<Search size={18} color={Colors.gray[400]} />}
            />

            <View style={styles.filterContainer}>
              {renderFilterTab('Completed', 'completed', getFilterCount('completed'))}
              {renderFilterTab('Drafts', 'draft', getFilterCount('draft'))}
              {renderFilterTab('Saved', 'saved', getFilterCount('saved'))}
            </View>
          </>
        ) : (
          <View style={styles.bulkActionHeader}>
            {/* Selection Mode Header */}
            <View style={styles.selectionHeader}>
              <Pressable style={styles.cancelButton} onPress={toggleSelectionMode}>
                <X size={20} color={Colors.gray[600]} />
              </Pressable>
              <View style={styles.selectionInfo}>
                <Text style={styles.selectionTitle}>Select Items</Text>
                <Text style={styles.selectionCount}>
                  {selectedBooks.length} of {sortedBooks.length} selected
                </Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <View style={styles.leftActions}>
                <Pressable style={styles.selectAllButton} onPress={selectAllBooks}>
                  <Text style={styles.selectAllText}>Select All</Text>
                </Pressable>
                <Pressable style={styles.clearButton} onPress={clearSelection}>
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              </View>

              <Pressable
                style={[styles.deleteButton, selectedBooks.length === 0 && styles.disabledButton]}
                onPress={handleBulkDelete}
                disabled={selectedBooks.length === 0 || isBulkDeleting}
              >
                {isBulkDeleting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Trash2 size={18} color={Colors.white} />
                    <Text style={styles.deleteButtonText}>Delete ({selectedBooks.length})</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <FlatList
        data={sortedBooks}
        renderItem={renderAudiobookItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softBackground,
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
    color: Colors.primary,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Layout.borderRadius.full,
    marginRight: Layout.spacing.sm,
    backgroundColor: Colors.gray[100],
  },
  activeFilterTab: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: Colors.gray[600],
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: Colors.white,
    fontWeight: '600',
  },
  bulkActionHeader: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionInfo: {
    flex: 1,
    alignItems: 'center',
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 2,
  },
  selectionCount: {
    fontSize: 12,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  headerSpacer: {
    width: 40,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftActions: {
    flexDirection: 'row',
    gap: 12,
  },
  selectAllButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  selectAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.gray[100],
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  clearText: {
    fontSize: 14,
    color: Colors.gray[600],
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.error,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
    marginLeft: 6,
  },
  disabledButton: {
    backgroundColor: Colors.gray[300],
    shadowOpacity: 0,
    elevation: 0,
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
    color: Colors.primary,
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
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 15, 35, 0.8)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '80%',
    minHeight: 150,
  },
  loadingText: {
    marginTop: Layout.spacing.md,
    fontSize: 16,
    color: Colors.primary,
    textAlign: 'center',
    paddingHorizontal: Layout.spacing.sm,
  },
  okButton: {
    marginTop: Layout.spacing.lg,
    backgroundColor: Colors.accent,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.xl,
    borderRadius: Layout.borderRadius.md,
  },
  okButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  filterCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: Colors.white,
    marginLeft: Layout.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilterCount: {
    backgroundColor: Colors.white,
  },
  filterCountText: {
    fontSize: 11,
    color: Colors.gray[700],
    fontWeight: '600',
  },
  activeFilterCountText: {
    color: Colors.black,
    fontWeight: '700',
  },
});
