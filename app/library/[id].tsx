import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Share2, Play, Pause, Bookmark, RotateCw, RotateCcw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase';
import type { Tables } from '../../lib/database';
import HighlightedText from '../../components/audiobook/HighlightedText';

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
  const [audiobook, setAudiobook] = useState<Tables['audiobooks']['Row'] | null>(null);
  const [loading, setLoading] = useState(true);

  // Player state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

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

  // Sound lifecycle management
  useEffect(() => {
    const loadSound = async () => {
      if (audiobook?.audio_url) {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
          });

          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audiobook.audio_url },
            { shouldPlay: false },
            onPlaybackStatusUpdate
          );
          setSound(newSound);
        } catch (error) {
          console.error('Error loading sound', error);
        }
      }
    };

    loadSound();

    return () => {
      sound?.unloadAsync();
    };
  }, [audiobook?.audio_url]);

  // Playback status update handler
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (!isSeeking) {
        setPosition(status.positionMillis);
      }
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
    }
  };

  // User actions
  const handlePlayPause = async () => {
    if (!sound) return;
    isPlaying ? await sound.pauseAsync() : await sound.playAsync();
  };

  const handleSeek = async (value: number) => {
    if (!sound) return;
    setIsSeeking(false);
    await sound.setPositionAsync(value);
  };

  const handleSlidingStart = () => {
    if (!sound) return;
    setIsSeeking(true);
  };

  const skipBy = async (milliseconds: number) => {
    if (!sound) return;
    const newPosition = position + milliseconds;
    await sound.setPositionAsync(Math.max(0, Math.min(newPosition, duration)));
  };

  const handleRateChange = async () => {
    if (!sound) return;
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    const newRate = PLAYBACK_RATES[nextIndex];
    try {
      await sound.setRateAsync(newRate, true);
      setPlaybackRate(newRate);
    } catch (error) {
      console.error('Failed to set playback rate', error);
    }
  };

  // Utility to get text content
  const getOriginalText = () => {
    if (!audiobook) return '';
    try {
      const parsedContent = JSON.parse(audiobook.text_content || '{}');
      return parsedContent.originalText || audiobook.text_content || '';
    } catch {
      return audiobook.text_content || '';
    }
  };

  // Render logic
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
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
        text={getOriginalText()}
        currentPosition={position}
        duration={duration}
        isPlaying={isPlaying}
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
          <Pressable
            style={styles.controlButton}
            onPress={() => {
              /* Handle bookmark */
            }}
          >
            <Bookmark size={24} color={Colors.gray[600]} />
          </Pressable>
          <Pressable style={styles.controlButton} onPress={() => skipBy(-10000)}>
            <View style={styles.skipButton}>
              <RotateCcw size={32} color={Colors.gray[600]} />
              <Text style={styles.skipButtonText}>10</Text>
            </View>
          </Pressable>
          <Pressable style={styles.playButton} onPress={handlePlayPause}>
            {isPlaying ? <Pause size={32} color={Colors.white} /> : <Play size={32} color={Colors.white} />}
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
