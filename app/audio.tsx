import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Animated, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft, Music, Play, Volume2, Pause, Sparkles, Headphones } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { BackgroundSelectorRef } from '../components/audiobook/BackgroundSelector';
import { mockAudioEffects } from '../utils/mockData';
import { audioEffects } from '../lib/audio';
import { updateAudiobook, getAudiobook } from '../lib/database';
import { AUDIO_CONSTANTS } from '../constants/AudioConstants';

export default function AudioScreen() {
  const router = useRouter();
  const { id, voiceAudio, backgroundEffect } = useLocalSearchParams();
  const [selectedEffect, setSelectedEffect] = useState<string | null>((backgroundEffect as string) || null);
  const [volume, setVolume] = useState(() => {
    const initialVolume = audioEffects.getVolume();
    return isFinite(initialVolume) && !isNaN(initialVolume) ? initialVolume : 0.5;
  });
  const [backgroundVolume, setBackgroundVolume] = useState(() => {
    const initialVolume = audioEffects.getBackgroundVolume();
    return isFinite(initialVolume) && !isNaN(initialVolume) ? initialVolume : 0.3;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [waveAnimations] = useState({
    bar1: new Animated.Value(0.3),
    bar2: new Animated.Value(0.7),
    bar3: new Animated.Value(0.5),
    bar4: new Animated.Value(0.9),
  });
  const volumeTrackRef = useRef<View>(null);
  const backgroundVolumeTrackRef = useRef<View>(null);
  const backgroundSelectorRef = useRef<BackgroundSelectorRef>(null);

  const handleSelectEffect = (effectId: string) => {
    if (selectedEffect === effectId) {
      setSelectedEffect(null);
    } else {
      setSelectedEffect(effectId);
    }
  };

  const startWaveAnimation = () => {
    const animateBar = (animatedValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 400 + Math.random() * 200,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0.2,
            duration: 400 + Math.random() * 200,
            useNativeDriver: false,
          }),
        ]),
        { resetBeforeIteration: false }
      );
    };

    Animated.parallel([
      animateBar(waveAnimations.bar1, 0),
      animateBar(waveAnimations.bar2, 100),
      animateBar(waveAnimations.bar3, 200),
      animateBar(waveAnimations.bar4, 300),
    ]).start();
  };

  const stopWaveAnimation = () => {
    Object.values(waveAnimations).forEach((anim) => anim.stopAnimation());
  };

  const handlePreviewAudio = async (effectId: string, previewUrl: string) => {
    try {
      if (playingPreviewId === effectId) {
        const status = await audioEffects.getPlaybackStatus();
        if (status.backgroundIsPlaying) {
          await audioEffects.pauseAudio();
          setPlayingPreviewId(null);
          stopWaveAnimation();
        } else {
          await audioEffects.resumeAudio();
          setPlayingPreviewId(effectId);
          startWaveAnimation();
        }
        return;
      }

      // Stop any currently playing preview
      if (playingPreviewId) {
        await audioEffects.stopAllAudio();
        stopWaveAnimation();
      }

      setPlayingPreviewId(effectId);
      startWaveAnimation();

      // Load and play the background audio
      await audioEffects.loadBackgroundMusic(previewUrl);
      await audioEffects.playBackgroundMusic();

      // Monitor playback to update UI when finished
      const checkStatus = async () => {
        const status = await audioEffects.getPlaybackStatus();
        if (!status.backgroundIsPlaying) {
          setPlayingPreviewId(null);
          stopWaveAnimation();
        } else if (playingPreviewId === effectId) {
          setTimeout(checkStatus, AUDIO_CONSTANTS.STATUS_CHECK_INTERVAL_PLAYER);
        }
      };

      setTimeout(checkStatus, 1000);
    } catch (error) {
      console.error('Error playing preview:', error);
      setPlayingPreviewId(null);
      stopWaveAnimation();
    }
  };

  const handlePlayMixedPreview = async () => {
    try {
      if (isPlaying) {
        // Stop all audio
        await audioEffects.stopAllAudio();
        setIsPlaying(false);
        return;
      }

      // Load voice audio if available
      if (voiceAudio) {
        await audioEffects.loadVoiceAudio(voiceAudio as string);
      }

      // Load background effect if selected
      if (selectedEffect) {
        const effect = mockAudioEffects.find((e) => e.id === selectedEffect);
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
        } else if (isPlaying) {
          setTimeout(checkStatus, AUDIO_CONSTANTS.STATUS_CHECK_INTERVAL_PLAYER); // Check every 500ms
        }
      };

      setTimeout(checkStatus, 1000); // Start checking after 1 second
    } catch (error) {
      console.error('Error playing mixed preview:', error);
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    try {
      if (!isFinite(newVolume) || isNaN(newVolume)) {
        return;
      }

      const validVolume = Math.max(0, Math.min(1, newVolume));
      setVolume(validVolume);
    } catch (error) {
      console.error('Error changing volume:', error);
    }
  };

  const handleVolumeChangeComplete = async (newVolume: number) => {
    try {
      if (!isFinite(newVolume) || isNaN(newVolume)) {
        return;
      }

      const validVolume = Math.max(0, Math.min(1, newVolume));
      await audioEffects.setVolume(validVolume);
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  };

  const handleBackgroundVolumeChange = (newVolume: number) => {
    try {
      if (!isFinite(newVolume) || isNaN(newVolume)) {
        return;
      }

      const validVolume = Math.max(0, Math.min(1, newVolume));
      setBackgroundVolume(validVolume);
    } catch (error) {
      console.error('Error changing background volume:', error);
    }
  };

  const handleBackgroundVolumeChangeComplete = async (newVolume: number) => {
    try {
      if (!isFinite(newVolume) || isNaN(newVolume)) {
        return;
      }

      const validVolume = Math.max(0, Math.min(1, newVolume));
      await audioEffects.setBackgroundVolume(validVolume);
    } catch (error) {
      console.error('Error setting background volume:', error);
    }
  };

  const handleNext = async () => {
    try {
      // Stop any playing preview
      await backgroundSelectorRef.current?.stopPreview();

      if (id) {
        const audiobookId = Array.isArray(id) ? id[0] : id;
        // Fetch current audiobook data to get existing text_content
        const { data: audiobook, error: fetchError } = await getAudiobook(audiobookId);

        if (fetchError) {
          throw fetchError;
        }

        if (audiobook) {
          let textContent;
          try {
            textContent = JSON.parse(audiobook.text_content || '{}');
          } catch {
            textContent = {};
          }

          // Update the background effect
          textContent.backgroundEffect = selectedEffect;

          const { voiceDuration = 0 } = await audioEffects.getPlaybackStatus();

          // Update audiobook with background effect and mark as completed
          const result = await updateAudiobook(audiobookId, {
            text_content: JSON.stringify(textContent),
            status: 'completed',
            duration: Math.round(voiceDuration / 1000),
          });

          if (result.error) {
            throw result.error;
          }
        } else {
          throw new Error('No audiobook data found');
        }
      } else {
        throw new Error('No ID parameter provided');
      }

      // Small delay to ensure database update propagates before navigating
      setTimeout(() => {
        router.push('/library');
      }, 500);
    } catch (error) {
      console.error('Error updating audiobook:', error);
      // Even on error, go back to library after delay
      setTimeout(() => {
        router.push('/library');
      }, 500);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      audioEffects.cleanup();
      setPlayingPreviewId(null);
      stopWaveAnimation();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        audioEffects.cleanup();
        setPlayingPreviewId(null);
        stopWaveAnimation();
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={24} color={Colors.primary} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Music size={20} color={Colors.primary} />
            <Text style={styles.headerTitle}>Background Audio</Text>
          </View>

          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Step 1: Choose Background Audio */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>Choose Background Audio</Text>
                <Text style={styles.stepDesc}>Select music or ambient sounds (optional)</Text>
              </View>
            </View>

            {/* No Background Option - Prominent */}
            <Pressable
              style={[styles.noneOptionCard, !selectedEffect && styles.selectedNoneCard]}
              onPress={() => setSelectedEffect(null)}
            >
              <View style={styles.noneOptionContent}>
                <Text style={[styles.noneOptionTitle, !selectedEffect && styles.selectedNoneTitle]}>
                  No Background Audio
                </Text>
                <Text style={styles.noneOptionDesc}>Pure voice narration</Text>
              </View>
              {!selectedEffect && (
                <View style={styles.selectedCheckmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </Pressable>

            {/* Categories */}
            {['music', 'ambient', 'sound_effect'].map((category) => {
              const categoryEffects = mockAudioEffects.filter((e) => e.category === category);
              if (categoryEffects.length === 0) return null;

              const categoryInfo = {
                music: {
                  title: '🎵 Background Music',
                  desc: 'Instrumental tracks',
                },
                ambient: {
                  title: '🌊 Ambient Sounds',
                  desc: 'Nature and environment',
                },
                sound_effect: {
                  title: '🔊 Sound Effects',
                  desc: 'Specific audio effects',
                },
              }[category as 'music' | 'ambient' | 'sound_effect'];

              if (!categoryInfo) return null;

              return (
                <View key={category} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>{categoryInfo.title}</Text>
                    <Text style={styles.categoryCount}>{categoryEffects.length}</Text>
                  </View>
                  <Text style={styles.categoryDesc}>{categoryInfo.desc}</Text>

                  <View style={styles.audioGrid}>
                    {categoryEffects.map((effect) => (
                      <Pressable
                        key={effect.id}
                        style={[styles.audioCard, selectedEffect === effect.id && styles.selectedAudioCard]}
                        onPress={() => handleSelectEffect(effect.id)}
                      >
                        {/* Audio Name */}
                        <Text
                          style={[styles.audioName, selectedEffect === effect.id && styles.selectedAudioName]}
                          numberOfLines={2}
                        >
                          {effect.name}
                        </Text>

                        {/* Play Button - Separate and Prominent */}
                        {effect.previewUrl && (
                          <Pressable
                            style={[
                              styles.audioPlayButton,
                              playingPreviewId === effect.id && styles.playingButton,
                              selectedEffect === effect.id && styles.selectedPlayButton,
                            ]}
                            onPress={(e) => {
                              e.stopPropagation();
                              handlePreviewAudio(effect.id, effect.previewUrl!);
                            }}
                          >
                            {playingPreviewId === effect.id ? (
                              <Pause size={14} color={Colors.white} />
                            ) : (
                              <Play size={14} color={Colors.white} />
                            )}
                          </Pressable>
                        )}

                        {/* Selected Checkmark */}
                        {selectedEffect === effect.id && (
                          <View style={styles.selectedIndicator}>
                            <Text style={styles.checkmarkText}>✓</Text>
                          </View>
                        )}

                        {/* Playing Wave Animation */}
                        {playingPreviewId === effect.id && (
                          <View style={styles.playingWave}>
                            <Animated.View
                              style={[
                                styles.waveBar,
                                {
                                  height: waveAnimations.bar1.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [3, 12],
                                  }),
                                },
                              ]}
                            />
                            <Animated.View
                              style={[
                                styles.waveBar,
                                {
                                  height: waveAnimations.bar2.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [4, 14],
                                  }),
                                },
                              ]}
                            />
                            <Animated.View
                              style={[
                                styles.waveBar,
                                {
                                  height: waveAnimations.bar3.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [2, 10],
                                  }),
                                },
                              ]}
                            />
                            <Animated.View
                              style={[
                                styles.waveBar,
                                {
                                  height: waveAnimations.bar4.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [5, 13],
                                  }),
                                },
                              ]}
                            />
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Step 2: Adjust Audio Levels */}
          <Card style={styles.volumeCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>Adjust Audio Levels</Text>
                <Text style={styles.stepDesc}>Balance your voice and background audio</Text>
              </View>
            </View>

            <View style={styles.volumeControls}>
              {/* Voice Volume Slider */}
              <View style={styles.sliderCard}>
                <View style={styles.sliderHeader}>
                  <View style={styles.sliderLabelWithIcon}>
                    <Volume2 size={18} color={Colors.primary} />
                    <Text style={styles.sliderLabel}>Voice Volume</Text>
                  </View>
                  <Text style={styles.sliderValue}>{Math.round(volume * 100)}%</Text>
                </View>
                <Slider
                  value={volume}
                  onValueChange={handleVolumeChange}
                  onSlidingComplete={handleVolumeChangeComplete}
                  minimumValue={0}
                  maximumValue={1}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.gray[200]}
                  thumbTintColor={Colors.primary}
                  style={styles.slider}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelText}>Silent</Text>
                  <Text style={styles.sliderLabelText}>Loud</Text>
                </View>
              </View>

              {/* Background Volume Slider */}
              <View style={styles.sliderCard}>
                <View style={styles.sliderHeader}>
                  <View style={styles.sliderLabelWithIcon}>
                    <Music size={18} color={Colors.primary} />
                    <Text style={styles.sliderLabel}>Background Volume</Text>
                  </View>
                  <Text style={styles.sliderValue}>{Math.round(backgroundVolume * 100)}%</Text>
                </View>
                <Slider
                  value={backgroundVolume}
                  onValueChange={handleBackgroundVolumeChange}
                  onSlidingComplete={handleBackgroundVolumeChangeComplete}
                  minimumValue={0}
                  maximumValue={1}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.gray[200]}
                  thumbTintColor={Colors.primary}
                  style={styles.slider}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelText}>Silent</Text>
                  <Text style={styles.sliderLabelText}>Loud</Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Step 3: Preview Your Mix */}
          <Card style={styles.previewCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>Preview Your Mix</Text>
                <Text style={styles.stepDesc}>
                  {selectedEffect
                    ? `Voice + ${mockAudioEffects.find((e) => e.id === selectedEffect)?.name}`
                    : 'Voice only'}
                </Text>
              </View>
            </View>

            <View style={styles.previewSection}>
              <View style={styles.previewWaveform}>
                <View style={[styles.waveform, isPlaying && styles.activeWaveform]} />
              </View>

              <Pressable
                style={[styles.previewButton, isPlaying && styles.previewButtonPlaying]}
                onPress={handlePlayMixedPreview}
              >
                {isPlaying ? <Pause size={24} color={Colors.white} /> : <Play size={24} color={Colors.white} />}
              </Pressable>

              <Text style={styles.previewText}>
                {isPlaying ? 'Playing mixed audio...' : 'Tap to preview your audiobook'}
              </Text>
            </View>
          </Card>

          {/* Audio Mixing Tips */}
          <Card style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Headphones size={18} color={Colors.gray[600]} />
              <Text style={styles.tipsTitle}>Audio Mixing Tips</Text>
            </View>
            <View style={styles.tipsContent}>
              <Text style={styles.tipText}>• Keep background audio 20-30% of voice volume</Text>
              <Text style={styles.tipText}>• Choose ambient sounds that complement your content</Text>
              <Text style={styles.tipText}>• Test your mix with different listening devices</Text>
            </View>
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Back" onPress={handleBack} variant="ghost" style={styles.backFooterButton} />
          <Button
            title="Complete Audiobook"
            onPress={handleNext}
            style={styles.nextButton}
            icon={<Sparkles size={18} color={Colors.white} />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.softBackground,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.softBackground,
  },
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
  },

  stepCard: {
    marginBottom: Layout.spacing.lg,
  },
  volumeCard: {
    marginBottom: Layout.spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  previewCard: {
    marginBottom: Layout.spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray[900],
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  // None Option Card
  noneOptionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedNoneCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  noneOptionContent: {
    flex: 1,
  },
  noneOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[900],
    marginBottom: 2,
  },
  selectedNoneTitle: {
    color: Colors.primary,
  },
  noneOptionDesc: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  selectedCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },

  // Category sections
  categorySection: {
    marginBottom: Layout.spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[900],
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[500],
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryDesc: {
    fontSize: 13,
    color: Colors.gray[500],
    marginBottom: Layout.spacing.md,
  },

  // Audio grid and cards
  audioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  audioCard: {
    width: '30%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.md,
    margin: 4,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    position: 'relative',
    minHeight: 75,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  selectedAudioCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.selected,
    transform: [{ scale: 1.02 }],
  },
  audioName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[900],
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: Layout.spacing.sm,
  },
  selectedAudioName: {
    color: Colors.primary,
    fontWeight: '700',
  },
  audioPlayButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gray[600],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  playingButton: {
    backgroundColor: Colors.success,
    transform: [{ scale: 1.1 }],
  },
  selectedPlayButton: {
    backgroundColor: Colors.primary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  playingWave: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1.5,
  },
  waveBar: {
    width: 2.5,
    backgroundColor: Colors.success,
    borderRadius: 1.5,
    opacity: 0.9,
  },
  volumeControls: {
    gap: Layout.spacing.lg,
  },
  sliderCard: {
    marginBottom: Layout.spacing.lg,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  sliderLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[900],
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: Layout.spacing.xs,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabelText: {
    fontSize: 12,
    color: Colors.gray[500],
    fontWeight: '500',
  },
  previewSection: {
    alignItems: 'center',
    gap: Layout.spacing.lg,
  },
  previewButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  previewButtonPlaying: {
    backgroundColor: Colors.cyberGreen,
    shadowColor: Colors.cyberGreen,
  },
  previewText: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: Colors.gray[50],
    borderColor: Colors.gray[200],
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  tipsContent: {
    gap: Layout.spacing.xs,
  },
  previewWaveform: {
    width: '100%',
    height: 40,
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    justifyContent: 'center',
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
  volumeTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    marginHorizontal: Layout.spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  volumeTrackPressable: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
  },
  volumeFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  volumeThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    position: 'absolute',
    top: -4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  volumeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    width: 40,
    textAlign: 'right',
  },
  tipText: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    padding: Layout.spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  backFooterButton: {
    flex: 1,
    borderRadius: 12,
    minHeight: 50,
  },
  nextButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minHeight: 50,
  },
});
