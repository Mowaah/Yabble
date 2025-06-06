import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Card from '../ui/Card';
import { Audio } from 'expo-av';
import { audioEffects } from '../../lib/audio';
import type { AudioEffect } from '../../types';

interface BackgroundSelectorProps {
  effects: AudioEffect[];
  selectedEffectId?: string | null;
  onSelectEffect: (effectId: string) => void;
  onPreviewEffect?: (effectId: string) => void;
}

export interface BackgroundSelectorRef {
  stopPreview: () => Promise<void>;
}

const BackgroundSelector = forwardRef<
  BackgroundSelectorRef,
  BackgroundSelectorProps
>(({ effects, selectedEffectId, onSelectEffect, onPreviewEffect }, ref) => {
  const [playingEffectId, setPlayingEffectId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayButtonPressed, setIsPlayButtonPressed] = useState(false);

  const effectCategories = [
    { id: 'music', title: 'Background Music' },
    { id: 'ambient', title: 'Ambient Sounds' },
    { id: 'sound_effect', title: 'Sound Effects' },
  ];

  const getEffectsByCategory = (category: string) => {
    return effects.filter((effect) => effect.category === category);
  };

  const stopCurrentSound = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingEffectId(null);
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
    }
  };

  const handlePlayPreview = async (effectId: string, previewUrl?: string) => {
    try {
      // If the same effect is playing, stop it
      if (playingEffectId === effectId) {
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
        }
      );

      setSound(newSound);
      setPlayingEffectId(effectId);

      // Handle playback completion
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingEffectId(null);
          setSound(null);
        }
      });

      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing preview:', error);
      setPlayingEffectId(null);
      setSound(null);
    }
  };

  // Expose stopPreview method to parent components
  useImperativeHandle(ref, () => ({
    stopPreview: stopCurrentSound,
  }));

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      stopCurrentSound();
    };
  }, []);

  const renderEffectItem = ({ item }: { item: AudioEffect }) => {
    const isSelected = item.id === selectedEffectId;
    const isPlaying = item.id === playingEffectId;

    return (
      <Card
        style={StyleSheet.flatten([
          styles.effectCard,
          isSelected && styles.selectedEffectCard,
        ])}
        onPress={async () => {
          if (!isPlayButtonPressed) {
            // Stop any playing preview before selecting the effect
            await stopCurrentSound();
            onSelectEffect(item.id);
          }
        }}
      >
        <View style={styles.effectHeader}>
          <Text style={styles.effectName}>{item.name}</Text>

          {item.previewUrl && (
            <Pressable
              style={StyleSheet.flatten([
                styles.playButton,
                isPlaying && styles.playingButton,
              ])}
              onPressIn={() => setIsPlayButtonPressed(true)}
              onPressOut={() => {
                setTimeout(() => setIsPlayButtonPressed(false), 100);
              }}
              onPress={(e) => {
                e.stopPropagation();
                handlePlayPreview(item.id, item.previewUrl);
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
          <View
            style={StyleSheet.flatten([
              styles.waveform,
              isPlaying && styles.activeWaveform,
            ])}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {effectCategories.map((category) => {
        const categoryEffects = getEffectsByCategory(category.id);

        if (categoryEffects.length === 0) return null;

        return (
          <View key={category.id} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <FlatList
              data={categoryEffects}
              renderItem={renderEffectItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.effectList}
            />
          </View>
        );
      })}
    </View>
  );
});

BackgroundSelector.displayName = 'BackgroundSelector';

export default BackgroundSelector;

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
  effectList: {
    paddingVertical: Layout.spacing.xs,
  },
  effectCard: {
    width: 160,
    marginRight: Layout.spacing.md,
  },
  selectedEffectCard: {
    borderWidth: 2,
    borderColor: Colors.black,
  },
  effectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm,
  },
  effectName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
    flex: 1,
    marginRight: Layout.spacing.sm,
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
