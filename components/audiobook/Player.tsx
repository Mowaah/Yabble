import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Play, Pause, SkipBack, SkipForward, Volume2, Clock, Share } from 'lucide-react-native';
import { Audio } from 'expo-av';
import Slider from '../ui/Slider';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import { audioEffects } from '../../lib/audio';
import { mockAudioEffects } from '../../utils/mockData';
import type { Tables } from '../../lib/database';

interface PlayerProps {
  audiobook: Tables['audiobooks']['Row'];
  minimized?: boolean;
  onExpand?: () => void;
}

export default function Player({ audiobook, minimized = false, onExpand }: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    return () => {
      // Cleanup audio when component unmounts
      if (isPlaying) {
        audioEffects.stopAllAudio();
      }
    };
  }, [isPlaying]);

  const getBackgroundEffect = () => {
    try {
      const parsedContent = JSON.parse(audiobook.text_content);
      return parsedContent.backgroundEffect;
    } catch {
      return null;
    }
  };

  const togglePlayback = async () => {
    if (!audiobook.audio_url) return;

    try {
      if (isPlaying) {
        // Stop all audio
        await audioEffects.stopAllAudio();
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      } else {
        // Load voice audio
        await audioEffects.loadVoiceAudio(audiobook.audio_url);

        // Load background effect if available
        const backgroundEffectId = getBackgroundEffect();
        if (backgroundEffectId) {
          const effect = mockAudioEffects.find((e) => e.id === backgroundEffectId);
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

          if (status.voiceDuration && status.voiceDuration > 0) {
            const newDuration = status.voiceDuration / 1000; // Convert to seconds
            const newCurrentTime = status.voicePosition ? status.voicePosition / 1000 : 0;
            const newProgress = newDuration > 0 ? newCurrentTime / newDuration : 0;

            setDuration(newDuration);
            setCurrentTime(newCurrentTime);
            setProgress(newProgress);
          }

          if (!status.voiceIsPlaying && !status.backgroundIsPlaying) {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
            return; // Stop monitoring when audio ends
          }
          // Continue monitoring while audio is playing
          setTimeout(checkStatus, 500); // Check every 500ms
        };

        setTimeout(checkStatus, 1000); // Start checking after 1 second
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      setIsPlaying(false);
    }
  };

  const handleSkipBack = async () => {
    // For now, we'll just restart the audio as seeking requires more complex implementation
    if (isPlaying) {
      await audioEffects.stopAllAudio();
      setTimeout(() => {
        togglePlayback();
      }, 100);
    }
  };

  const handleSkipForward = async () => {
    // For now, we'll just stop the audio
    if (isPlaying) {
      await audioEffects.stopAllAudio();
      setIsPlaying(false);
      setProgress(1);
      setCurrentTime(duration);
    }
  };

  const handleSliderChange = async (value: number) => {
    // Seeking in mixed audio is complex, so for now we'll just update the visual
    const newTime = value * duration;
    setProgress(value);
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Minimized player
  if (minimized) {
    return (
      <Pressable style={styles.minimizedContainer} onPress={onExpand}>
        <View style={styles.minimizedInfo}>
          <Text style={styles.minimizedTitle} numberOfLines={1}>
            {audiobook.title}
          </Text>
          <View style={styles.progressBarMini}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <Pressable
          style={styles.minimizedPlayButton}
          onPress={(e) => {
            e.stopPropagation();
            togglePlayback();
          }}
        >
          {isPlaying ? <Pause size={20} color={Colors.white} /> : <Play size={20} color={Colors.white} />}
        </Pressable>
      </Pressable>
    );
  }

  // Full player
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.currentTime}>
          <Clock size={16} color={Colors.gray[500]} />
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        </View>

        <View style={styles.title}>
          <Text style={styles.titleText} numberOfLines={1}>
            {audiobook.title}
          </Text>
        </View>

        <Pressable style={styles.shareButton}>
          <Share size={20} color={Colors.black} />
        </Pressable>
      </View>

      <View style={styles.progressContainer}>
        <Slider
          value={progress}
          onValueChange={handleSliderChange}
          minimumTrackTintColor={Colors.black}
          maximumTrackTintColor={Colors.gray[300]}
          thumbTintColor={Colors.black}
        />

        <View style={styles.timeLabels}>
          <Text style={styles.timeLabel}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeLabel}>-{formatTime(duration - currentTime)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.mainControls}>
          <Pressable style={styles.skipButton} onPress={handleSkipBack}>
            <SkipBack size={24} color={Colors.black} />
          </Pressable>

          <Pressable style={styles.playPauseButton} onPress={togglePlayback}>
            {isPlaying ? <Pause size={28} color={Colors.white} /> : <Play size={28} color={Colors.white} />}
          </Pressable>

          <Pressable style={styles.skipButton} onPress={handleSkipForward}>
            <SkipForward size={24} color={Colors.black} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
  },
  currentTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: Colors.gray[500],
    marginLeft: 4,
  },
  title: {
    flex: 1,
    marginHorizontal: Layout.spacing.md,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.black,
  },
  shareButton: {
    padding: 8,
  },
  progressContainer: {
    marginBottom: Layout.spacing.md,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  controls: {
    alignItems: 'center',
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipButton: {
    padding: 12,
  },
  playPauseButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Layout.spacing.md,
  },

  // Minimized player styles
  minimizedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  minimizedInfo: {
    flex: 1,
    marginRight: Layout.spacing.md,
  },
  minimizedTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: Colors.black,
  },
  progressBarMini: {
    height: 3,
    backgroundColor: Colors.gray[200],
    borderRadius: Layout.borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.black,
  },
  minimizedPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
