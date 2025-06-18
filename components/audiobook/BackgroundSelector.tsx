import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, ActivityIndicator, Animated } from 'react-native';
import { Play, Pause, Music, Headphones, Volume2 } from 'lucide-react-native';
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

const BackgroundSelector = forwardRef<BackgroundSelectorRef, BackgroundSelectorProps>(
  ({ effects, selectedEffectId, onSelectEffect, onPreviewEffect }, ref) => {
    const [playingEffectId, setPlayingEffectId] = useState<string | null>(null);
    const [loadingEffectId, setLoadingEffectId] = useState<string | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlayButtonPressed, setIsPlayButtonPressed] = useState(false);
    const [animatedValues] = useState(() =>
      effects.reduce((acc, effect) => {
        acc[effect.id] = {
          scale: new Animated.Value(1),
          waveAnimation: new Animated.Value(0),
        };
        return acc;
      }, {} as Record<string, { scale: Animated.Value; waveAnimation: Animated.Value }>)
    );

    const effectCategories = [
      { id: 'music', title: '🎵 Background Music', icon: Music },
      { id: 'ambient', title: '🌊 Ambient Sounds', icon: Headphones },
      { id: 'sound_effect', title: '🔊 Sound Effects', icon: Volume2 },
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
          setLoadingEffectId(null);

          // Stop all wave animations
          Object.values(animatedValues).forEach(({ waveAnimation }) => {
            waveAnimation.stopAnimation();
            Animated.timing(waveAnimation, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }).start();
          });
        } catch (error) {
          console.error('Error stopping sound:', error);
        }
      }
    };

    const animateWaveform = (effectId: string, isPlaying: boolean) => {
      const animations = animatedValues[effectId];
      if (!animations) return;

      if (isPlaying) {
        Animated.loop(
          Animated.timing(animations.waveAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          })
        ).start();
      } else {
        animations.waveAnimation.stopAnimation();
        Animated.timing(animations.waveAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
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

        setLoadingEffectId(effectId);

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: previewUrl },
          {
            shouldPlay: true,
            volume: audioEffects.getVolume(),
          }
        );

        setSound(newSound);
        setLoadingEffectId(null);
        setPlayingEffectId(effectId);
        animateWaveform(effectId, true);

        // Handle playback completion
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingEffectId(null);
            setSound(null);
            animateWaveform(effectId, false);
          }
        });

        await newSound.playAsync();
      } catch (error) {
        console.error('Error playing preview:', error);
        setPlayingEffectId(null);
        setLoadingEffectId(null);
        setSound(null);
        animateWaveform(effectId, false);
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

    const handleEffectPress = (effectId: string) => {
      const animations = animatedValues[effectId];
      if (animations) {
        Animated.sequence([
          Animated.timing(animations.scale, {
            toValue: 0.95,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(animations.scale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
      onSelectEffect(effectId);
    };

    const renderEffectItem = ({ item }: { item: AudioEffect }) => {
      const isSelected = item.id === selectedEffectId;
      const isPlaying = item.id === playingEffectId;
      const isLoading = item.id === loadingEffectId;
      const animations = animatedValues[item.id];

      if (!animations) return null;

      return (
        <Animated.View style={[{ transform: [{ scale: animations.scale }] }]}>
          <Pressable
            style={[styles.effectCard, isSelected && styles.selectedEffectCard]}
            onPress={async () => {
              if (!isPlayButtonPressed) {
                // Stop any playing preview before selecting the effect
                await stopCurrentSound();
                handleEffectPress(item.id);
              }
            }}
          >
            <View style={styles.effectHeader}>
              <View style={styles.effectInfo}>
                <Text style={[styles.effectName, isSelected && styles.selectedEffectName]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.effectCategory}>{item.category}</Text>
              </View>

              {item.previewUrl && (
                <Pressable
                  style={[
                    styles.playButton,
                    isPlaying && styles.playingButton,
                    isLoading && styles.loadingButton,
                    isSelected && styles.selectedPlayButton,
                  ]}
                  onPressIn={() => setIsPlayButtonPressed(true)}
                  onPressOut={() => {
                    setTimeout(() => setIsPlayButtonPressed(false), 100);
                  }}
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePlayPreview(item.id, item.previewUrl);
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : isPlaying ? (
                    <Pause size={14} color={Colors.white} />
                  ) : (
                    <Play size={14} color={Colors.white} />
                  )}
                </Pressable>
              )}
            </View>

            <View style={styles.waveformContainer}>
              <Animated.View
                style={[
                  styles.waveform,
                  isPlaying && styles.activeWaveform,
                  {
                    transform: [
                      {
                        scaleX: animations.waveAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.2],
                        }),
                      },
                    ],
                    opacity: animations.waveAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1],
                    }),
                  },
                ]}
              />
            </View>

            {/* Selected indicator */}
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <View style={styles.selectedDot} />
              </View>
            )}
          </Pressable>
        </Animated.View>
      );
    };

    return (
      <View style={styles.container}>
        {effectCategories.map((category) => {
          const categoryEffects = getEffectsByCategory(category.id);

          if (categoryEffects.length === 0) return null;

          return (
            <View key={category.id} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{categoryEffects.length} effects</Text>
                </View>
              </View>
              <FlatList
                data={categoryEffects}
                renderItem={renderEffectItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.effectList}
                snapToInterval={172}
                decelerationRate="fast"
              />
            </View>
          );
        })}
      </View>
    );
  }
);

BackgroundSelector.displayName = 'BackgroundSelector';

export default BackgroundSelector;

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.lg,
  },
  categorySection: {
    marginBottom: Layout.spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  categoryBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  effectList: {
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: 4,
  },
  effectCard: {
    width: 160,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.md,
    marginRight: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  selectedEffectCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
    shadowColor: Colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  effectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm,
  },
  effectInfo: {
    flex: 1,
    marginRight: Layout.spacing.sm,
  },
  effectName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[900],
    marginBottom: 2,
    lineHeight: 18,
  },
  selectedEffectName: {
    color: Colors.primary,
  },
  effectCategory: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.gray[500],
    textTransform: 'capitalize',
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gray[600],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedPlayButton: {
    backgroundColor: Colors.primary,
  },
  playingButton: {
    backgroundColor: Colors.cyberGreen,
  },
  loadingButton: {
    backgroundColor: Colors.gray[500],
  },
  waveformContainer: {
    height: 40,
    justifyContent: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  waveform: {
    height: 24,
    backgroundColor: Colors.gray[300],
    borderRadius: 4,
  },
  activeWaveform: {
    backgroundColor: Colors.primary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
