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
import { Play, Pause, Download, Share2, Trash2, Heart, Upload, MoreHorizontal } from 'lucide-react-native';
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
  compact?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onPublishToHub?: () => void;
}

export default function AudiobookCard({
  book,
  compact = false,
  isFavorite = false,
  onToggleFavorite,
  onShare,
  onDownload,
  onDelete,
  onPublishToHub,
}: AudiobookCardProps) {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [favoriteScale] = useState(new Animated.Value(1));
  const [playButtonScale] = useState(new Animated.Value(1));
  const [sparkles] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  const handlePress = () => {
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

  const handlePlayPause = async () => {
    if (!book.audio_url) return;

    // Animate play button press
    Animated.sequence([
      Animated.timing(playButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(playButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const isCurrentlyPlayingBook = audioEffects.getCurrentVoiceUrl() === book.audio_url;

    try {
      if (isPlaying) {
        setIsLoadingAudio(true);
        await audioEffects.pauseAudio();
        setIsPlaying(false);
        setIsLoadingAudio(false);
      } else {
        setIsLoadingAudio(true);

        if (isCurrentlyPlayingBook) {
          // Check if we're at the end and need to restart from beginning
          const status = await audioEffects.getPlaybackStatus();
          const isAtEnd =
            status.voicePosition && status.voiceDuration && status.voicePosition >= status.voiceDuration - 1000; // Within 1 second of end

          if (isAtEnd) {
            await audioEffects.seekVoice(0);
          }

          await audioEffects.resumeAudio();
        } else {
          await audioEffects.loadVoiceAudio(book.audio_url);

          const backgroundEffectId = await getBackgroundEffectFromFullBook(book.id);
          if (backgroundEffectId) {
            const effect = mockAudioEffects.find((e) => e.id === backgroundEffectId);
            if (effect?.previewUrl) {
              await audioEffects.loadBackgroundMusic(effect.previewUrl);
            }
          }

          await audioEffects.playMixedAudio();
        }

        setIsPlaying(true);
        setIsLoadingAudio(false);

        const checkStatus = async () => {
          // Only continue checking if this book is the one playing
          if (audioEffects.getCurrentVoiceUrl() !== book.audio_url) {
            setIsPlaying(false);
            return;
          }

          const status = await audioEffects.getPlaybackStatus();
          if (!status.voiceIsPlaying) {
            setIsPlaying(false);
            return;
          }
          setTimeout(checkStatus, 1000); // Less frequent checking for library cards
        };

        setTimeout(checkStatus, AUDIO_CONSTANTS.INITIAL_STATUS_CHECK_DELAY); // Longer delay for library cards
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Could not play audio');
      setIsPlaying(false);
      setIsLoadingAudio(false);
    }
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

  const handleActionPress = (action: () => void) => {
    setShowActionsMenu(false);
    action();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const isThisBookPlaying = audioEffects.getCurrentVoiceUrl() === book.audio_url;
      if (!isThisBookPlaying && isPlaying) {
        setIsPlaying(false);
      }
    }, AUDIO_CONSTANTS.STATUS_CHECK_INTERVAL_CARD);
    return () => clearInterval(interval);
  }, [isPlaying, book.audio_url]);

  return (
    <Card onPress={handlePress} style={styles.container}>
      <View style={styles.cardContent}>
        {/* Book Cover */}
        <Image
          source={{
            uri:
              book.cover_image ||
              'https://images.pexels.com/photos/1261180/pexels-photo-1261180.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
          }}
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
              <View style={styles.metaRow}>
                <Text style={styles.duration}>{formatDuration(book.duration)}</Text>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.voice}>{getVoiceName()}</Text>
              </View>
            </View>

            {/* Favorite button in top right */}
            <View style={styles.favoriteButtonContainer}>
              {/* Sparkles */}
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
                        {
                          scale: sparkle.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1],
                          }),
                        },
                        {
                          rotate: sparkle.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '180deg'],
                          }),
                        },
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
              {book.status === 'completed' && book.audio_url && (
                <Animated.View style={{ transform: [{ scale: playButtonScale }] }}>
                  <Pressable
                    style={[
                      styles.playButton,
                      isPlaying && styles.playingButton,
                      isLoadingAudio && styles.loadingButton,
                    ]}
                    onPress={handlePlayPause}
                    disabled={isLoadingAudio}
                  >
                    {isLoadingAudio ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : isPlaying ? (
                      <Pause size={18} color={Colors.white} />
                    ) : (
                      <Play size={18} color={Colors.white} />
                    )}
                  </Pressable>
                </Animated.View>
              )}
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
            {book.status === 'completed' && (
              <Pressable style={styles.menuItem} onPress={() => handleActionPress(onPublishToHub!)}>
                <Upload size={16} color={Colors.gray[700]} />
                <Text style={styles.menuText}>Publish to Hub</Text>
              </Pressable>
            )}

            {book.status === 'completed' && (
              <Pressable style={styles.menuItem} onPress={() => handleActionPress(onDownload!)}>
                <Download size={16} color={Colors.gray[700]} />
                <Text style={styles.menuText}>Download</Text>
              </Pressable>
            )}

            <Pressable style={styles.menuItem} onPress={() => handleActionPress(onShare!)}>
              <Share2 size={16} color={Colors.gray[700]} />
              <Text style={styles.menuText}>Share</Text>
            </Pressable>

            <Pressable style={[styles.menuItem, styles.deleteMenuItem]} onPress={handleDelete}>
              {isDeleting ? (
                <ActivityIndicator size="small" color={Colors.error} />
              ) : (
                <Trash2 size={16} color={Colors.error} />
              )}
              <Text style={[styles.menuText, { color: Colors.error }]}>{isDeleting ? 'Deleting...' : 'Delete'}</Text>
            </Pressable>
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
});
