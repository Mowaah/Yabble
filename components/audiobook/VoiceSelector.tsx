import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Play, Pause, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import { Audio } from 'expo-av';
import { audioEffects } from '../../lib/audio';

const { width } = Dimensions.get('window');

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

// Generate unique gradient colors for each voice
const generateGradientColors = (name: string, gender: 'male' | 'female') => {
  const hash = name.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const gradients =
    gender === 'female'
      ? [
          ['#FF6B9D', '#C44569', '#FF8E9B'], // Pink gradient
          ['#A8E6CF', '#7FCDCD', '#88E5A3'], // Mint gradient
          ['#FFB347', '#FF8C69', '#FFD93D'], // Peach gradient
          ['#DDA0DD', '#9370DB', '#E6A8E6'], // Purple gradient
          ['#87CEEB', '#4682B4', '#98D8E8'], // Sky blue gradient
          ['#F0E68C', '#DAA520', '#F5E050'], // Gold gradient
        ]
      : [
          ['#4ECDC4', '#44A08D', '#5ED5CC'], // Teal gradient
          ['#667eea', '#764ba2', '#7B68EE'], // Blue purple gradient
          ['#f093fb', '#f5576c', '#F06292'], // Pink red gradient
          ['#4facfe', '#00f2fe', '#26C6DA'], // Blue cyan gradient
          ['#43e97b', '#38f9d7', '#4CAF50'], // Green gradient
          ['#fa709a', '#fee140', '#FF7043'], // Pink yellow gradient
        ];

  return gradients[Math.abs(hash) % gradients.length];
};

export default function VoiceSelector({
  voices,
  selectedVoiceId,
  onSelectVoice,
  onPreviewVoice,
  voiceSettings,
}: VoiceSelectorProps) {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [animatedValues] = useState(() =>
    voices.reduce((acc, voice) => {
      acc[voice.voice_id] = {
        scale: new Animated.Value(1),
        gradientAnimation: new Animated.Value(0),
        pulseAnimation: new Animated.Value(1),
      };
      return acc;
    }, {} as Record<string, { scale: Animated.Value; gradientAnimation: Animated.Value; pulseAnimation: Animated.Value }>)
  );

  const voiceCategories = [
    {
      id: 'female',
      title: '👩 Female Voices',
      gender: 'female',
    },
    {
      id: 'male',
      title: '👨 Male Voices',
      gender: 'male',
    },
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

        // Stop all animations
        Object.values(animatedValues).forEach(
          ({ gradientAnimation, pulseAnimation }) => {
            gradientAnimation.stopAnimation();
            pulseAnimation.stopAnimation();
            Animated.timing(gradientAnimation, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }).start();
            Animated.timing(pulseAnimation, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }
        );

        setPlayingVoiceId(null);
        setLoadingVoiceId(null);
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
    }
  };

  const animateVoiceCard = (voiceId: string, isPlaying: boolean) => {
    const animations = animatedValues[voiceId];
    if (!animations) return;

    if (isPlaying) {
      // Start playing animations
      Animated.parallel([
        Animated.loop(
          Animated.timing(animations.gradientAnimation, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: false,
          })
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(animations.pulseAnimation, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(animations.pulseAnimation, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      // Stop animations
      animations.gradientAnimation.stopAnimation();
      animations.pulseAnimation.stopAnimation();
      Animated.parallel([
        Animated.timing(animations.gradientAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(animations.pulseAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
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

      setLoadingVoiceId(voiceId);

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: previewUrl },
        {
          shouldPlay: true,
          volume: audioEffects.getVolume(),
          rate: voiceSettings?.speed || 1,
        }
      );

      setSound(newSound);
      setLoadingVoiceId(null);
      setPlayingVoiceId(voiceId);
      animateVoiceCard(voiceId, true);

      // Handle playback completion
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingVoiceId(null);
          setSound(null);
          animateVoiceCard(voiceId, false);
        }
      });

      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing preview:', error);
      setPlayingVoiceId(null);
      setLoadingVoiceId(null);
      setSound(null);
      animateVoiceCard(voiceId, false);
    }
  };

  const handleVoicePress = (voiceId: string) => {
    const animations = animatedValues[voiceId];
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
    onSelectVoice(voiceId);
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
    const isLoading = item.voice_id === loadingVoiceId;
    const animations = animatedValues[item.voice_id];
    const gradientColors = generateGradientColors(
      item.name,
      item.gender || 'female'
    );

    if (!animations) return null;

    return (
      <Animated.View style={[{ transform: [{ scale: animations.scale }] }]}>
        <Pressable
          style={[styles.voiceCard, isSelected && styles.selectedVoiceCard]}
          onPress={() => handleVoicePress(item.voice_id)}
        >
          {/* Animated Gradient Background with Play Button */}
          <Animated.View
            style={[
              styles.gradientContainer,
              { transform: [{ scale: animations.pulseAnimation }] },
            ]}
          >
            <LinearGradient
              colors={gradientColors as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBackground}
            >
              {/* Moving overlay for animation effect */}
              {isPlaying && (
                <Animated.View
                  style={[
                    styles.movingOverlay,
                    {
                      transform: [
                        {
                          translateX: animations.gradientAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-60, 60],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}

              {/* Play Button in center (replaces initial) */}
              {item.preview_url ? (
                <Pressable
                  style={[
                    styles.centerPlayButton,
                    isPlaying && styles.centerPlayButtonActive,
                    isLoading && styles.centerPlayButtonLoading,
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePlayPreview(item.voice_id, item.preview_url);
                    if (!isPlaying && !isLoading) {
                      onPreviewVoice?.(item.voice_id);
                    }
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : isPlaying ? (
                    <Pause size={16} color={Colors.white} />
                  ) : (
                    <Play size={16} color={Colors.white} />
                  )}
                </Pressable>
              ) : (
                <Text style={styles.voiceInitial}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              )}

              {/* Selected Badge */}
              {isSelected && (
                <View style={styles.selectedBadge}>
                  <Sparkles size={8} color={Colors.white} />
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Voice Name */}
          <Text
            style={[styles.voiceName, isSelected && styles.selectedVoiceName]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {voiceCategories.map((category) => {
        const categoryVoices = getVoicesByCategory(category.gender);

        if (categoryVoices.length === 0) return null;

        return (
          <View key={category.id} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {categoryVoices.length} voices
                </Text>
              </View>
            </View>

            <FlatList
              data={categoryVoices}
              renderItem={renderVoiceItem}
              keyExtractor={(item) => item.voice_id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.voiceList}
              snapToInterval={102}
              decelerationRate="fast"
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.xs,
  },
  categorySection: {
    marginBottom: Layout.spacing.md,
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
  voiceList: {
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: 4,
  },
  voiceCard: {
    width: 90,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.sm,
    marginRight: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
  },
  selectedVoiceCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
    shadowColor: Colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  gradientContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: Layout.spacing.xs,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradientBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  movingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
  },
  voiceInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 2,
  },
  centerPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  centerPlayButtonActive: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    transform: [{ scale: 1.1 }],
  },
  centerPlayButtonLoading: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  selectedBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    zIndex: 3,
  },
  voiceName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[900],
    letterSpacing: -0.1,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },
  selectedVoiceName: {
    color: Colors.primary,
  },
});
