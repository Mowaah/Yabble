import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Image,
} from 'react-native';
import { Play, Pause, Star } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Card from '../ui/Card';
import { Audio } from 'expo-av';
import { audioEffects } from '../../lib/audio';

interface VoiceSelectorProps {
  voices: Array<{
    voice_id: string;
    name: string;
    preview_url?: string;
    category?: string;
    gender?: 'male' | 'female';
  }>;
  selectedVoiceId?: string | null;
  onSelectVoice: (voiceId: string) => void;
  onPreviewVoice?: (voiceId: string) => void;
  voiceSettings?: {
    pitch?: number;
    speed?: number;
    stability?: number;
  };
}

export default function VoiceSelector({
  voices,
  selectedVoiceId,
  onSelectVoice,
  onPreviewVoice,
  voiceSettings,
}: VoiceSelectorProps) {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const voiceCategories = [
    { id: 'male', title: 'Male Voices', gender: 'male' },
    { id: 'female', title: 'Female Voices', gender: 'female' },
  ];

  const getVoicesByCategory = (gender: string) => {
    return voices.filter((voice) => voice.gender === gender);
  };

  const stopCurrentSound = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingVoiceId(null);
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
    }
  };

  const handlePlayPreview = async (voiceId: string, previewUrl?: string) => {
    try {
      // If the same voice is playing, stop it
      if (playingVoiceId === voiceId) {
        await stopCurrentSound();
        return;
      }

      // Stop any currently playing sound before starting a new one
      await stopCurrentSound();

      if (!previewUrl) return;

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: previewUrl },
        {
          shouldPlay: true,
          volume: audioEffects.getVolume(),
          rate: voiceSettings?.speed || 1,
        }
      );

      setSound(newSound);
      setPlayingVoiceId(voiceId);

      // Handle playback completion
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingVoiceId(null);
          setSound(null);
        }
      });

      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing preview:', error);
      setPlayingVoiceId(null);
      setSound(null);
    }
  };

  // Cleanup sound on unmount or when voice settings change
  React.useEffect(() => {
    return () => {
      stopCurrentSound();
    };
  }, [voiceSettings]);

  const renderVoiceItem = ({
    item,
  }: {
    item: VoiceSelectorProps['voices'][0];
  }) => {
    const isSelected = item.voice_id === selectedVoiceId;
    const isPlaying = item.voice_id === playingVoiceId;

    return (
      <Card
        style={StyleSheet.flatten([
          styles.voiceCard,
          isSelected && styles.selectedVoiceCard,
        ])}
        onPress={() => onSelectVoice(item.voice_id)}
      >
        <View style={styles.voiceHeader}>
          <Image
            source={{
              uri:
                item.gender === 'female'
                  ? 'https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
                  : 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            }}
            style={styles.voiceImage}
          />

          <View style={styles.voiceInfo}>
            <Text style={styles.voiceName}>{item.name}</Text>
          </View>

          {item.preview_url && (
            <Pressable
              style={[styles.playButton, isPlaying && styles.playingButton]}
              onPress={(e) => {
                e.stopPropagation();
                handlePlayPreview(item.voice_id, item.preview_url);
                if (!isPlaying) {
                  onPreviewVoice?.(item.voice_id);
                }
              }}
            >
              {isPlaying ? (
                <Pause size={16} color={Colors.white} />
              ) : (
                <Play size={16} color={Colors.white} />
              )}
            </Pressable>
          )}
        </View>

        <View style={styles.waveformContainer}>
          <View style={[styles.waveform, isPlaying && styles.activeWaveform]} />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {voiceCategories.map((category) => {
        const categoryVoices = getVoicesByCategory(category.gender);

        if (categoryVoices.length === 0) return null;

        return (
          <View key={category.id} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <FlatList
              data={categoryVoices}
              renderItem={renderVoiceItem}
              keyExtractor={(item) => item.voice_id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.voiceList}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.lg,
  },
  categorySection: {
    marginBottom: Layout.spacing.md,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
    color: Colors.black,
  },
  voiceList: {
    paddingVertical: Layout.spacing.xs,
  },
  voiceCard: {
    width: 160,
    marginRight: Layout.spacing.md,
  },
  selectedVoiceCard: {
    borderWidth: 2,
    borderColor: Colors.black,
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  voiceImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  voiceInfo: {
    flex: 1,
    marginHorizontal: Layout.spacing.sm,
  },
  voiceName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
  },
  playButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingButton: {
    backgroundColor: Colors.success,
  },
  waveformContainer: {
    height: 32,
    justifyContent: 'center',
  },
  waveform: {
    height: 24,
    backgroundColor: Colors.softCream,
    borderRadius: Layout.borderRadius.sm,
  },
  activeWaveform: {
    backgroundColor: Colors.lightPeach,
  },
});
