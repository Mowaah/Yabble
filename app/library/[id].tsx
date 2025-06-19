import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, Alert, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Share2, Play, Pause, Bookmark, RotateCw, RotateCcw, Rewind } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase';
import { updateAudiobook } from '../../lib/database';
import HighlightedText from '../../components/audiobook/HighlightedText';
import PlayerSkeleton from '../../components/audiobook/PlayerSkeleton';
import { mockAudioEffects } from '../../utils/mockData';
import { audioEffects } from '../../lib/audio';
import { AUDIO_CONSTANTS } from '../../constants/AudioConstants';

// Helper to format time from ms to mm:ss
const formatTime = (millis: number) => {
  if (!millis) return '0:00';
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
};

export default function AudiobookPlayerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { session } = useAuth();

  // Audiobook data
  const [audiobook, setAudiobook] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const positionRef = useRef(0);

  const PLAYBACK_RATES = [0.5, 0.75, 1, 1.5, 2];

  // Fetch audiobook data
  useEffect(() => {
    async function fetchAudiobook() {
      if (!session?.user?.id || !id) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await db
          .from('audiobooks')
          .select('*')
          .eq('id', id as string)
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;
        setAudiobook(data);
      } catch (error) {
        console.error('Error fetching audiobook:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAudiobook();
  }, [id, session?.user?.id]);

  const loadAudio = async (book: any) => {
    if (!book.audio_url) return;
    await audioEffects.stopAllAudio();
    setIsPlayerLoading(true);

    try {
      await audioEffects.loadVoiceAudio(book.audio_url);

      const content = book.text_content ? JSON.parse(book.text_content) : {};
      const backgroundEffectId = content.backgroundEffect;
      if (backgroundEffectId) {
        const effect = mockAudioEffects.find((e) => e.id === backgroundEffectId);
        if (effect?.previewUrl) {
          await audioEffects.loadBackgroundMusic(effect.previewUrl);
        }
      }

      const status = await audioEffects.getPlaybackStatus();
      if (status.voiceDuration) {
        setDuration(status.voiceDuration);
      }
      // If there's a last known position, seek to it
      if (book.last_position_millis && book.last_position_millis > 0) {
        await audioEffects.seekVoice(book.last_position_millis);
        setPosition(book.last_position_millis);
      }
    } catch (error) {
      console.error('Error loading audio:', error);
      Alert.alert('Error', 'Could not load audio for playback.');
    } finally {
      setIsPlayerLoading(false);
    }
  };

  useEffect(() => {
    if (audiobook) {
      loadAudio(audiobook);
    }

    // Cleanup on unmount
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
      const saveProgress = async () => {
        if (audiobook?.id && positionRef.current > 0) {
          await updateAudiobook(audiobook.id, {
            last_position_millis: positionRef.current,
          });
        }
      };
      saveProgress();
      audioEffects.stopAllAudio();
    };
  }, [audiobook]);

  // Smooth status polling - only update position and sync UI state
  useEffect(() => {
    if (isPlaying) {
      statusIntervalRef.current = setInterval(async () => {
        try {
          const status = await audioEffects.getPlaybackStatus();

          if (status.voiceIsPlaying) {
            // Update position while playing
            const newPosition = status.voicePosition || 0;
            if (!isSeeking) {
              // Don't update position while user is seeking
              setPosition(newPosition);
              positionRef.current = newPosition;
            }
          } else {
            // Voice stopped - sync UI state with audio state
            setIsPlaying(false);

            // If audio finished naturally, set position to the very end
            if (status.hasFinished && status.voiceDuration) {
              setPosition(status.voiceDuration); // Set slider to exact end
              positionRef.current = status.voiceDuration;
            }

            if (statusIntervalRef.current) {
              clearInterval(statusIntervalRef.current);
            }
          }
        } catch (error) {
          console.error('Error checking playback status:', error);
          setIsPlaying(false);
          if (statusIntervalRef.current) {
            clearInterval(statusIntervalRef.current);
          }
        }
      }, AUDIO_CONSTANTS.STATUS_CHECK_INTERVAL_PLAYER);
    } else {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    }

    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [isPlaying]);

  // User actions
  const handlePlayPause = async () => {
    try {
      setIsPlayerLoading(true);

      if (isPlaying) {
        await audioEffects.pauseAudio();
        setIsPlaying(false);
      } else {
        // Improved logic: Check if we should restart from beginning
        const status = await audioEffects.getPlaybackStatus();
        const shouldRestart =
          status.hasFinished ||
          (status.voicePosition &&
            status.voiceDuration &&
            status.voicePosition >= status.voiceDuration - AUDIO_CONSTANTS.RESTART_THRESHOLD_MS);

        if (shouldRestart) {
          // Reset to beginning if audio has finished or user is very close to end
          await audioEffects.seekVoice(0);
          setPosition(0);
          positionRef.current = 0;
        }

        await audioEffects.resumeAudio();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error handling play/pause:', error);
      Alert.alert('Playback Error', 'Could not play the audiobook.');
      setIsPlaying(false);
    } finally {
      setIsPlayerLoading(false);
    }
  };

  const handleSeek = async (value: number) => {
    setIsSeeking(false);

    try {
      await audioEffects.seekVoice(value);
      setPosition(value);
      positionRef.current = value;

      // Don't automatically start playing after seeking - respect current play state
      // If user seeks while paused, keep it paused
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };

  const handleSlidingStart = () => {
    setIsSeeking(true);
  };

  const skipBy = async (milliseconds: number) => {
    const newPosition = position + milliseconds;
    const newClampedPosition = Math.max(0, Math.min(newPosition, duration));
    await audioEffects.seekVoice(newClampedPosition);
    setPosition(newClampedPosition);
  };

  const handleRateChange = async () => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    const newRate = PLAYBACK_RATES[nextIndex];
    await audioEffects.setRate(newRate);
    setPlaybackRate(newRate);
  };

  const handleBookmark = async () => {
    if (!audiobook?.id) return;

    const newBookmarkedState = !audiobook.bookmarked;

    setAudiobook({
      ...audiobook,
      bookmarked: newBookmarkedState,
    });

    try {
      await updateAudiobook(audiobook.id, { bookmarked: newBookmarkedState });
    } catch (error) {
      console.error('Failed to sync bookmark status:', error);
      setAudiobook({
        ...audiobook,
        bookmarked: !newBookmarkedState,
      });
    }
  };

  // Render logic
  if (loading) {
    return <PlayerSkeleton />;
  }

  if (!audiobook) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>Audiobook not found</Text>
          <Pressable onPress={() => router.back()}>
            <Text>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.gray[800]} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {audiobook.title}
        </Text>
        <Pressable style={styles.headerButton}>
          <Share2 size={20} color={Colors.gray[800]} />
        </Pressable>
      </View>

      {/* Text Content */}
      <HighlightedText
        text={audiobook.text_content || ''}
        currentPosition={position}
        duration={duration}
        fontSize={18}
        lineHeight={30}
      />

      {/* Player */}
      <View style={styles.playerContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingStart={handleSlidingStart}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor={Colors.gray[300]}
          thumbTintColor={Colors.primary}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.controlsContainer}>
          <Pressable style={styles.controlButton} onPress={handleBookmark}>
            <Bookmark
              size={24}
              color={audiobook?.bookmarked ? Colors.primary : Colors.gray[600]}
              fill={audiobook?.bookmarked ? Colors.primary : 'none'}
            />
          </Pressable>
          <Pressable style={styles.controlButton} onPress={() => skipBy(-10000)}>
            <View style={styles.skipButton}>
              <RotateCcw size={32} color={Colors.gray[600]} />
              <Text style={styles.skipButtonText}>10</Text>
            </View>
          </Pressable>
          <Pressable style={styles.playButton} onPress={handlePlayPause} disabled={isPlayerLoading}>
            {isPlayerLoading ? (
              <ActivityIndicator size="large" color={Colors.white} />
            ) : isPlaying ? (
              <Pause size={32} color={Colors.white} />
            ) : (
              <Play size={32} color={Colors.white} />
            )}
          </Pressable>
          <Pressable style={styles.controlButton} onPress={() => skipBy(10000)}>
            <View style={styles.skipButton}>
              <RotateCw size={32} color={Colors.gray[600]} />
              <Text style={styles.skipButtonText}>10</Text>
            </View>
          </Pressable>
          <Pressable style={styles.controlButton} onPress={handleRateChange}>
            <Text style={styles.rateText}>{playbackRate}x</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softBackground,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.softBackground,
  },
  notFoundText: {
    fontSize: 18,
    color: Colors.gray[600],
    marginBottom: Layout.spacing.lg,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerButton: {
    padding: Layout.spacing.xs,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Layout.spacing.md,
  },

  // Player
  playerContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.sm,
    paddingBottom: Layout.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    elevation: 20,
    borderTopWidth: 1,
    borderColor: Colors.gray[200],
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.xs,
  },
  timeText: {
    fontSize: 12,
    color: Colors.gray[600],
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: Layout.spacing.md,
  },
  controlButton: {
    padding: Layout.spacing.md,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  skipButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.gray[600],
    position: 'absolute',
  },
  rateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gray[600],
    width: 40,
    textAlign: 'center',
  },
});
