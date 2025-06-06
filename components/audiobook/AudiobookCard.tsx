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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Play, Pause, Download, Share2, Trash2 } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Card from '../ui/Card';
import { Audio } from 'expo-av';
import { deleteAudiobook } from '../../lib/database';
import { audioEffects } from '../../lib/audio';
import { mockAudioEffects } from '../../utils/mockData';
import type { Tables } from '../../lib/database';

interface AudiobookCardProps {
  book: Tables['audiobooks']['Row'];
  compact?: boolean;
  onShare?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}

export default function AudiobookCard({
  book,
  compact = false,
  onShare,
  onDownload,
  onDelete,
}: AudiobookCardProps) {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePress = () => {
    router.push(`/library/${book.id}`);
  };

  const getBackgroundEffect = () => {
    try {
      const parsedContent = JSON.parse(book.text_content);
      return parsedContent.backgroundEffect;
    } catch {
      return null;
    }
  };

  const handlePlayPause = async () => {
    if (!book.audio_url) return;

    try {
      if (isPlaying) {
        // Stop all audio
        await audioEffects.stopAllAudio();
        setIsPlaying(false);
      } else {
        // Load voice audio
        await audioEffects.loadVoiceAudio(book.audio_url);

        // Load background effect if available
        const backgroundEffectId = getBackgroundEffect();
        if (backgroundEffectId) {
          const effect = mockAudioEffects.find(
            (e) => e.id === backgroundEffectId
          );
          if (effect?.previewUrl) {
            await audioEffects.loadBackgroundMusic(effect.previewUrl);
          }
        }

        // Play mixed audio (voice controls the duration)
        await audioEffects.playMixedAudio();
        setIsPlaying(true);

        // Monitor playback status to update UI when audio ends
        const checkStatus = async () => {
          const status = await audioEffects.getPlaybackStatus();
          if (!status.voiceIsPlaying && !status.backgroundIsPlaying) {
            setIsPlaying(false);
            return; // Stop monitoring when audio ends
          }
          // Continue monitoring while audio is playing
          setTimeout(checkStatus, 500); // Check every 500ms
        };

        setTimeout(checkStatus, 1000); // Start checking after 1 second
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Could not play audio');
      setIsPlaying(false);
    }
  };

  const handleDelete = async (e: any) => {
    // Stop event propagation
    e.stopPropagation();

    if (isDeleting) return;

    const confirmed =
      Platform.OS === 'web'
        ? window.confirm(`Are you sure you want to delete "${book.title}"?`)
        : await new Promise((resolve) => {
            Alert.alert(
              'Delete Audiobook',
              `Are you sure you want to delete "${book.title}"?`,
              [
                { text: 'Cancel', onPress: () => resolve(false) },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => resolve(true),
                },
              ]
            );
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

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (isPlaying) {
        audioEffects.stopAllAudio();
      }
    };
  }, [isPlaying]);

  if (compact) {
    return (
      <Card onPress={handlePress} style={styles.compactContainer}>
        <View style={styles.compactContent}>
          <Image
            source={{
              uri:
                book.cover_image ||
                'https://images.pexels.com/photos/1261180/pexels-photo-1261180.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            }}
            style={styles.compactImage}
          />
          <View style={styles.compactDetails}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {book.title}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{book.status}</Text>
            </View>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card onPress={handlePress} style={styles.container}>
      <Image
        source={{
          uri:
            book.cover_image ||
            'https://images.pexels.com/photos/1261180/pexels-photo-1261180.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        }}
        style={styles.image}
      />

      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {book.title}
          </Text>

          <View style={styles.metaContainer}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{book.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <Pressable
            style={[styles.actionButton, isDeleting && styles.disabledButton]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <Trash2 size={20} color={Colors.error} />
            )}
          </Pressable>

          {book.status === 'completed' && book.audio_url && (
            <>
              <Pressable style={styles.actionButton} onPress={onDownload}>
                <Download size={20} color={Colors.black} />
              </Pressable>

              <Pressable style={styles.actionButton} onPress={onShare}>
                <Share2 size={20} color={Colors.black} />
              </Pressable>

              <Pressable
                style={[styles.playButton, isPlaying && styles.playingButton]}
                onPress={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause size={20} color={Colors.white} />
                ) : (
                  <Play size={20} color={Colors.white} />
                )}
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.md,
  },
  image: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: Layout.borderRadius.md,
    borderTopRightRadius: Layout.borderRadius.md,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: Layout.spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: Colors.black,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.lightPeach,
    borderRadius: Layout.borderRadius.full,
  },
  statusText: {
    fontSize: 12,
    color: Colors.black,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightPeach,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  disabledButton: {
    opacity: 0.5,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingButton: {
    backgroundColor: Colors.success,
  },

  // Compact styles
  compactContainer: {
    marginBottom: Layout.spacing.sm,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactImage: {
    width: 60,
    height: 60,
    borderTopLeftRadius: Layout.borderRadius.md,
    borderBottomLeftRadius: Layout.borderRadius.md,
  },
  compactDetails: {
    flex: 1,
    padding: Layout.spacing.sm,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: Colors.black,
  },
});
