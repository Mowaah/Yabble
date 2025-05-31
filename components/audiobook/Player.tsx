import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, Clock, Share
} from 'lucide-react-native';
import { Audio } from 'expo-av';
import Slider from '../ui/Slider';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import type { Tables } from '../../lib/database';

interface PlayerProps {
  audiobook: Tables['audiobooks']['Row'];
  minimized?: boolean;
  onExpand?: () => void;
}

export default function Player({ audiobook, minimized = false, onExpand }: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  useEffect(() => {
    loadAudio();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audiobook.audio_url]);

  const loadAudio = async () => {
    if (!audiobook.audio_url) return;

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audiobook.audio_url },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);

      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
      }
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;

    const position = status.positionMillis / 1000;
    const duration = status.durationMillis / 1000;
    setCurrentTime(position);
    setProgress(position / duration);

    if (status.didJustFinish) {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }
  };
  
  const togglePlayback = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };
  
  const handleSkipBack = async () => {
    if (!sound) return;
    const newTime = Math.max(0, currentTime - 15);
    await sound.setPositionAsync(newTime * 1000);
  };
  
  const handleSkipForward = async () => {
    if (!sound) return;
    const newTime = Math.min(duration, currentTime + 15);
    await sound.setPositionAsync(newTime * 1000);
  };
  
  const handleSliderChange = async (value: number) => {
    if (!sound) return;
    const newPosition = value * duration;
    setProgress(value);
    await sound.setPositionAsync(newPosition * 1000);
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
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress * 100}%` }
              ]} 
            />
          </View>
        </View>
        
        <Pressable 
          style={styles.minimizedPlayButton} 
          onPress={(e) => {
            e.stopPropagation();
            togglePlayback();
          }}
        >
          {isPlaying ? (
            <Pause size={20} color={Colors.white} />
          ) : (
            <Play size={20} color={Colors.white} />
          )}
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
          <Text style={styles.timeText}>
            {formatTime(currentTime)}
          </Text>
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
            {isPlaying ? (
              <Pause size={28} color={Colors.white} />
            ) : (
              <Play size={28} color={Colors.white} />
            )}
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