import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Play,
  Pause,
  Download,
  Share2,
  Trash2,
  Heart,
  Upload,
  MoreHorizontal,
  Check,
  CheckSquare,
  Bookmark,
  Pencil,
  PenSquare,
} from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Card from '../ui/Card';
import { Audio } from 'expo-av';
import { deleteAudiobook, getAudiobook } from '../../lib/database';
import { audioEffects } from '../../lib/audio';
import { mockAudioEffects } from '../../utils/mockData';
import { calculateAudiobookProgress, getDraftContinuationRoute } from '../../utils/progressUtils';
import { AUDIO_CONSTANTS } from '../../constants/AudioConstants';

interface AudiobookCardProps {
  book: any;
  context?: 'library' | 'hub';
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onPublishToHub?: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (bookId: string) => void;
  onInitiateSelection?: (bookId: string) => void;
  onEdit?: () => void;
}

export default function AudiobookCard({
  book,
  context = 'library',
  isFavorite = false,
  onToggleFavorite,
  isBookmarked = false,
  onToggleBookmark,
  onShare,
  onDownload,
  onDelete,
  onPublishToHub,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
  onInitiateSelection,
  onEdit,
}: AudiobookCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [favoriteScale] = useState(new Animated.Value(1));
  const [bookmarkScale] = useState(new Animated.Value(1));
  const [sparkles] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  const handlePress = () => {
    // In selection mode, handle selection instead of navigation
    if (isSelectionMode && context === 'library') {
      onSelect?.(book.id);
      return;
    }

    // If it's a completed audiobook, go to the player
    if (book.status === 'completed') {
      router.push(`/library/${book.id}`);
      return;
    }

    // If it's a draft, continue where user left off
    if (book.status === 'draft') {
      const progress = getProgress();

      if (progress.stage === AUDIO_CONSTANTS.PROGRESS_STAGES.TEXT_ONLY) {
        // Stage 1: Only text, need to select voice
        router.push({
          pathname: '/voice',
          params: { id: book.id },
        });
      } else if (progress.stage === AUDIO_CONSTANTS.PROGRESS_STAGES.TEXT_AND_VOICE) {
        // Stage 2: Text + voice, need to select background audio
        router.push({
          pathname: '/audio',
          params: { id: book.id },
        });
      } else {
        // Stage 3: Should be completed, go to player
        router.push(`/library/${book.id}`);
      }
      return;
    }

    // Fallback: go to player
    router.push(`/library/${book.id}`);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getVoiceName = () => {
    if (!book.voice_id) return 'Default Voice';
    return `Voice ${book.voice_id.slice(0, 8)}`;
  };

  const getProgress = () => {
    return calculateAudiobookProgress(book);
  };

  const getBackgroundEffectFromFullBook = async (bookId: string) => {
    try {
      const { data: fullBook, error } = await getAudiobook(bookId);
      if (error) {
        console.warn('Failed to get background effect:', error);
        return null;
      }
      if (fullBook?.text_content) {
        const parsedContent = JSON.parse(fullBook.text_content);
        return parsedContent.backgroundEffect;
      }
    } catch (error) {
      console.warn('Failed to get background effect:', error);
    }
    return null;
  };

  const handleDelete = async () => {
    setShowActionsMenu(false);

    if (isDeleting) return;

    const confirmed =
      Platform.OS === 'web'
        ? window.confirm(`Are you sure you want to delete "${book.title}"?`)
        : await new Promise((resolve) => {
            Alert.alert('Delete Audiobook', `Are you sure you want to delete "${book.title}"?`, [
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
        setIsDeleting(true);
        await deleteAudiobook(book.id);
        onDelete?.();
      } catch (error) {
        const errorMessage = 'Failed to delete audiobook';
        if (Platform.OS === 'web') {
          alert(errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleFavorite = (e: any) => {
    e.stopPropagation();

    // Do not trigger favorite animation if it's already favorited
    if (isFavorite) {
      onToggleFavorite?.();
      return;
    }

    // Reset sparkles
    sparkles.forEach((sparkle) => sparkle.setValue(0));

    // Animate the heart and sparkles
    Animated.parallel([
      // Heart animation
      Animated.sequence([
        Animated.timing(favoriteScale, {
          toValue: 1.4,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(favoriteScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      // Sparkles animation
      Animated.stagger(
        100,
        sparkles.map((sparkle) =>
          Animated.sequence([
            Animated.timing(sparkle, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(sparkle, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        )
      ),
    ]).start();

    onToggleFavorite?.();
  };

  const handleBookmark = (e: any) => {
    e.stopPropagation();

    Animated.sequence([
      Animated.timing(bookmarkScale, {
        toValue: 1.4,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(bookmarkScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    onToggleBookmark?.();
  };

  const handleActionPress = (action: () => void) => {
    setShowActionsMenu(false);
    action();
  };

  useEffect(() => {
    // This effect was responsible for syncing the play/pause state
    // of the card with the global audio player. Since the play button
    // has been removed from the card to prevent memory issues, this
    // is no longer needed.
  }, []);

  const cardStyle = [styles.container, ...(isSelected ? [styles.selectedContainer] : [])];

  return (
    <Card onPress={handlePress} style={cardStyle}>
      <View style={styles.cardContent}>
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <View style={styles.selectionCheckbox}>
            <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
              {isSelected && <Check size={16} color={Colors.white} />}
            </View>
          </View>
        )}

        {/* Book Cover */}
        <Image
          source={book.cover_image ? { uri: book.cover_image } : require('../../assets/images/gallery.png')}
          style={styles.coverImage}
        />

        {/* Content */}
        <View style={styles.contentSection}>
          {/* Header with title and favorite button */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {book.title}
              </Text>
              {context === 'hub' && book.author?.name && <Text style={styles.authorText}>by {book.author.name}</Text>}
              <View style={styles.metaRow}>
                <Text style={styles.duration}>{formatDuration(book.duration)}</Text>
                {context === 'library' ? (
                  <>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.voice}>{getVoiceName()}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.separator}>•</Text>
                    <View style={styles.bookmarkCountContainer}>
                      <Bookmark size={12} color={Colors.gray[500]} />
                      <Text style={styles.bookmarkCountText}>{book.bookmarks_count || 0} bookmarks</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Action button in top right (Favorite or Bookmark) */}
            <View style={styles.favoriteButtonContainer}>
              {context === 'library' ? (
                <>
                  {/* Sparkles for favorite animation */}
                  {sparkles.map((sparkle, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.sparkle,
                        index === 0
                          ? styles.sparkle1
                          : index === 1
                          ? styles.sparkle2
                          : index === 2
                          ? styles.sparkle3
                          : styles.sparkle4,
                        {
                          opacity: sparkle,
                          transform: [
                            { scale: sparkle.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
                            { rotate: sparkle.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) },
                          ],
                        },
                      ]}
                    >
                      <Text style={styles.sparkleText}>✨</Text>
                    </Animated.View>
                  ))}
                  <Animated.View style={{ transform: [{ scale: favoriteScale }] }}>
                    <Pressable style={styles.favoriteButton} onPress={handleFavorite}>
                      <Heart
                        size={22}
                        color={isFavorite ? Colors.error : Colors.gray[400]}
                        fill={isFavorite ? Colors.error : 'none'}
                      />
                    </Pressable>
                  </Animated.View>
                </>
              ) : (
                <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
                  <Pressable style={styles.favoriteButton} onPress={handleBookmark}>
                    <Bookmark
                      size={22}
                      color={isBookmarked ? Colors.primary : Colors.gray[400]}
                      fill={isBookmarked ? Colors.primary : 'none'}
                    />
                  </Pressable>
                </Animated.View>
              )}
            </View>
          </View>

          {/* Progress Bar for Drafts */}
          {book.status === 'draft' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <View style={styles.progressInfo}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${getProgress().percentage}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {getProgress().stage}/{getProgress().total}
                  </Text>
                </View>
                <Text style={styles.continueHint}>Tap to continue</Text>
              </View>
            </View>
          )}

          {/* Bottom Actions Row */}
          <View style={styles.bottomActions}>
            <View style={styles.leftActions}>
              {/* The play button has been removed to prevent memory crashes. */}
              {/* Playback is now handled exclusively on the player screen. */}
            </View>

            <Pressable style={styles.moreButton} onPress={() => setShowActionsMenu(true)}>
              <MoreHorizontal size={16} color={Colors.gray[600]} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Actions Menu Modal */}
      <Modal
        transparent={true}
        visible={showActionsMenu}
        onRequestClose={() => setShowActionsMenu(false)}
        animationType="fade"
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowActionsMenu(false)}>
          <View style={styles.actionsMenu}>
            {context === 'library' && !isSelectionMode && (
              <Pressable
                style={styles.menuItem}
                onPress={() => handleActionPress(() => onInitiateSelection?.(book.id))}
              >
                <CheckSquare size={16} color={Colors.primary} />
                <Text style={[styles.menuText, { color: Colors.primary }]}>Select</Text>
              </Pressable>
            )}

            {context === 'library' && (
              <Pressable style={styles.menuItem} onPress={() => handleActionPress(onToggleBookmark!)}>
                <Bookmark size={16} color={Colors.gray[700]} />
                <Text style={styles.menuText}>{isBookmarked ? 'Remove from Saved' : 'Save to Library'}</Text>
              </Pressable>
            )}

            {book.status === 'completed' && (
              <Pressable style={styles.menuItem} onPress={() => handleActionPress(onDownload!)}>
                <Download size={16} color={Colors.gray[700]} />
                <Text style={styles.menuText}>Download</Text>
              </Pressable>
            )}

            {context === 'library' && book.status === 'completed' && !book.is_published && (
              <Pressable style={styles.menuItem} onPress={() => handleActionPress(onPublishToHub!)}>
                <Upload size={16} color={Colors.gray[700]} />
                <Text style={styles.menuText}>Publish to Hub</Text>
              </Pressable>
            )}

            {onEdit && (
              <Pressable style={styles.menuItem} onPress={() => handleActionPress(onEdit)}>
                <Pencil size={18} color={Colors.primary} />
                <Text style={styles.menuItemText}>Edit Details</Text>
              </Pressable>
            )}

            {onShare && (
              <Pressable style={styles.menuItem} onPress={() => handleActionPress(onShare)}>
                <PenSquare size={18} color={Colors.primary} />
                <Text style={styles.menuItemText}>Share</Text>
              </Pressable>
            )}

            {context === 'library' && (
              <Pressable style={[styles.menuItem, styles.deleteMenuItem]} onPress={handleDelete}>
                {isDeleting ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <Trash2 size={16} color={Colors.error} />
                )}
                <Text style={[styles.menuText, { color: Colors.error }]}>{isDeleting ? 'Deleting...' : 'Delete'}</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  cardContent: {
    flexDirection: 'row',
  },
  coverImage: {
    width: 90,
    height: 135,
    borderRadius: Layout.borderRadius.md,
    marginRight: Layout.spacing.lg,
  },
  contentSection: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 135,
  },
  header: {
    flex: 1,
    position: 'relative',
  },
  titleContainer: {
    flex: 1,
    paddingRight: 50, // Make room for favorite button
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 6,
    lineHeight: 22,
  },
  authorText: {
    fontSize: 14,
    color: Colors.gray[600],
    marginTop: 2,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  duration: {
    fontSize: 13,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  separator: {
    marginHorizontal: 8,
    fontSize: 13,
    color: Colors.gray[400],
  },
  voice: {
    fontSize: 13,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  favoriteButtonContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
  },
  favoriteButton: {
    padding: 12,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.white,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  playingButton: {
    backgroundColor: Colors.cyberGreen,
    shadowColor: Colors.cyberGreen,
  },
  loadingButton: {
    backgroundColor: Colors.gray[500],
    shadowColor: Colors.gray[500],
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Layout.spacing.sm,
    paddingTop: Layout.spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[200],
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  progressText: {
    fontSize: 11,
    color: Colors.gray[500],
    marginLeft: 10,
    fontWeight: '600',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  continueHint: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Layout.spacing.xs,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44, // Keep space consistent after removing play button
  },
  moreButton: {
    padding: 10,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.gray[100],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 15, 35, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsMenu: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.xs,
    minWidth: 180,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.sm,
  },
  menuText: {
    fontSize: 14,
    color: Colors.gray[700],
    marginLeft: 12,
    fontWeight: '500',
  },
  deleteMenuItem: {
    marginTop: 4,
  },
  sparkle: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  sparkleText: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  sparkle1: {
    transform: [{ translateX: -20 }, { translateY: -15 }],
  },
  sparkle2: {
    transform: [{ translateX: 20 }, { translateY: -15 }],
  },
  sparkle3: {
    transform: [{ translateX: -15 }, { translateY: 20 }],
  },
  sparkle4: {
    transform: [{ translateX: 15 }, { translateY: 20 }],
  },
  selectedContainer: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: `${Colors.primary}05`,
  },
  selectionCheckbox: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  bookmarkCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkCountText: {
    marginLeft: 4,
    fontSize: 13,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  menuItemText: {
    fontSize: 14,
    color: Colors.gray[700],
    marginLeft: 12,
    fontWeight: '500',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 6,
    lineHeight: 22,
  },
});
