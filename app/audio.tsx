import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Music,
  Play,
  Volume2,
  Pause,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import BackgroundSelector, {
  BackgroundSelectorRef,
} from '../components/audiobook/BackgroundSelector';
import { mockAudioEffects } from '../utils/mockData';
import { audioEffects } from '../lib/audio';
import { updateAudiobook } from '../lib/database';

export default function AudioScreen() {
  const router = useRouter();
  const { id, voiceAudio, backgroundEffect } = useLocalSearchParams();
  const [selectedEffect, setSelectedEffect] = useState<string | null>(
    (backgroundEffect as string) || null
  );
  const [volume, setVolume] = useState(() => {
    const initialVolume = audioEffects.getVolume();
    return isFinite(initialVolume) && !isNaN(initialVolume)
      ? initialVolume
      : 0.5;
  });
  const [backgroundVolume, setBackgroundVolume] = useState(() => {
    const initialVolume = audioEffects.getBackgroundVolume();
    return isFinite(initialVolume) && !isNaN(initialVolume)
      ? initialVolume
      : 0.3;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(0);
  const [backgroundSliderWidth, setBackgroundSliderWidth] = useState(0);
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
          setTimeout(checkStatus, 500); // Check every 500ms
        }
      };

      setTimeout(checkStatus, 1000); // Start checking after 1 second
    } catch (error) {
      console.error('Error playing mixed preview:', error);
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    try {
      if (!isFinite(newVolume) || isNaN(newVolume)) {
        return;
      }

      const validVolume = Math.max(0, Math.min(1, newVolume));
      await audioEffects.setVolume(validVolume);
      setVolume(validVolume);
    } catch (error) {
      console.error('Error changing volume:', error);
    }
  };

  const handleBackgroundVolumeChange = async (newVolume: number) => {
    try {
      if (!isFinite(newVolume) || isNaN(newVolume)) {
        return;
      }

      const validVolume = Math.max(0, Math.min(1, newVolume));
      await audioEffects.setBackgroundVolume(validVolume);
      setBackgroundVolume(validVolume);
    } catch (error) {
      console.error('Error changing background volume:', error);
    }
  };

  const handleNext = async () => {
    try {
      // Stop any playing preview before moving to export
      await backgroundSelectorRef.current?.stopPreview();

      if (selectedEffect && id) {
        // Update audiobook with selected background effect
        const originalText = (() => {
          try {
            // Try to get original text from existing audiobook data
            // This would require fetching the audiobook, but for now we'll use a placeholder
            return 'Generated audiobook text'; // In a real app, fetch this from the audiobook
          } catch {
            return 'Generated audiobook text';
          }
        })();

        await updateAudiobook(id as string, {
          text_content: JSON.stringify({
            originalText,
            backgroundEffect: selectedEffect,
          }),
        });
      }

      router.push('/export');
    } catch (error) {
      console.error('Error updating audiobook:', error);
      router.push('/export');
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      audioEffects.cleanup();
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.softCream }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={24} color={Colors.black} />
          </Pressable>

          <Text style={styles.headerTitle}>Background Audio</Text>

          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Background Audio</Text>
            <Text style={styles.sectionDesc}>
              Choose background music, ambient sounds, or effects to enhance
              your audiobook experience. This is optional but can add atmosphere
              to your narration.
            </Text>
          </View>

          <BackgroundSelector
            ref={backgroundSelectorRef}
            effects={mockAudioEffects}
            selectedEffectId={selectedEffect}
            onSelectEffect={handleSelectEffect}
          />

          <View style={styles.volumeSection}>
            <Text style={styles.volumeTitle}>Voice Volume</Text>

            <View style={styles.volumeSlider}>
              <Volume2 size={18} color={Colors.black} />
              <View
                ref={volumeTrackRef}
                style={styles.volumeTrack}
                onLayout={(event) => {
                  const { width } = event.nativeEvent.layout;
                  setSliderWidth(width);
                }}
              >
                <TouchableWithoutFeedback
                  onPress={(e) => {
                    if (!volumeTrackRef.current || !sliderWidth) {
                      return;
                    }

                    volumeTrackRef.current.measure(
                      (x, y, width, height, pageX, pageY) => {
                        const touchX = e.nativeEvent.pageX;
                        const relativeX = touchX - pageX;

                        if (relativeX < 0 || relativeX > width) {
                          return;
                        }

                        const newVolume = Math.max(
                          0,
                          Math.min(1, relativeX / width)
                        );

                        if (isFinite(newVolume) && !isNaN(newVolume)) {
                          handleVolumeChange(newVolume);
                        }
                      }
                    );
                  }}
                >
                  <View style={styles.volumeTrackPressable}>
                    <View
                      style={[styles.volumeFill, { width: `${volume * 100}%` }]}
                    />
                    <View
                      style={[
                        styles.volumeThumb,
                        {
                          left: `${Math.max(
                            0,
                            Math.min(100, volume * 100 - 1)
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </TouchableWithoutFeedback>
              </View>
              <Text style={styles.volumeValue}>
                {Math.round(volume * 100)}%
              </Text>
            </View>
          </View>

          <View style={styles.volumeSection}>
            <Text style={styles.volumeTitle}>Background Volume</Text>

            <View style={styles.volumeSlider}>
              <Music size={18} color={Colors.black} />
              <View
                ref={backgroundVolumeTrackRef}
                style={styles.volumeTrack}
                onLayout={(event) => {
                  const { width } = event.nativeEvent.layout;
                  setBackgroundSliderWidth(width);
                }}
              >
                <TouchableWithoutFeedback
                  onPress={(e) => {
                    if (
                      !backgroundVolumeTrackRef.current ||
                      !backgroundSliderWidth
                    ) {
                      return;
                    }

                    backgroundVolumeTrackRef.current.measure(
                      (x, y, width, height, pageX, pageY) => {
                        const touchX = e.nativeEvent.pageX;
                        const relativeX = touchX - pageX;

                        if (relativeX < 0 || relativeX > width) {
                          return;
                        }

                        const newVolume = Math.max(
                          0,
                          Math.min(1, relativeX / width)
                        );

                        if (isFinite(newVolume) && !isNaN(newVolume)) {
                          handleBackgroundVolumeChange(newVolume);
                        }
                      }
                    );
                  }}
                >
                  <View style={styles.volumeTrackPressable}>
                    <View
                      style={[
                        styles.volumeFill,
                        { width: `${backgroundVolume * 100}%` },
                      ]}
                    />
                    <View
                      style={[
                        styles.volumeThumb,
                        {
                          left: `${Math.max(
                            0,
                            Math.min(100, backgroundVolume * 100 - 1)
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </TouchableWithoutFeedback>
              </View>
              <Text style={styles.volumeValue}>
                {Math.round(backgroundVolume * 100)}%
              </Text>
            </View>
          </View>

          <Card style={styles.previewCard}>
            <Text style={styles.previewTitle}>Final Audiobook Preview</Text>
            <Text style={styles.previewDesc}>
              Listen to your complete audiobook with voice narration and
              background audio mixed together.
            </Text>

            <View style={styles.previewWaveform}>
              <View style={styles.waveformContainer}>
                <View
                  style={[styles.waveform, isPlaying && styles.activeWaveform]}
                />
              </View>
            </View>

            <Button
              title={isPlaying ? 'Stop Preview' : 'Play Preview'}
              variant="secondary"
              onPress={handlePlayMixedPreview}
              icon={
                isPlaying ? (
                  <Pause size={18} color={Colors.black} />
                ) : (
                  <Play size={18} color={Colors.black} />
                )
              }
              style={styles.previewButton}
            />
          </Card>

          <View style={styles.tipSection}>
            <Text style={styles.tipTitle}>Audio Mixing Tips</Text>
            <Text style={styles.tipText}>
              • Background audio is automatically mixed at a lower volume
            </Text>
            <Text style={styles.tipText}>
              • Adjust voice and background volumes independently
            </Text>
            <Text style={styles.tipText}>
              • Use the preview to test your final audiobook mix
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Back"
            onPress={handleBack}
            variant="outline"
            style={styles.footerButton}
            icon={<ChevronLeft size={18} color={Colors.black} />}
          />
          <Button
            title="Next: Export"
            onPress={handleNext}
            style={styles.footerButton}
            icon={<ChevronRight size={18} color={Colors.white} />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softCream,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.xl,
  },
  section: {
    marginBottom: Layout.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Layout.spacing.xs,
  },
  sectionDesc: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Layout.spacing.sm,
  },
  effectsListContent: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  effectName: {
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
  volumeSection: {
    marginBottom: Layout.spacing.lg,
  },
  volumeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Layout.spacing.sm,
  },
  volumeSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
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
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  volumeFill: {
    height: '100%',
    backgroundColor: Colors.black,
    borderRadius: 4,
  },
  volumeThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.black,
    position: 'absolute',
    top: -4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  volumeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
    width: 40,
    textAlign: 'right',
  },
  previewCard: {
    marginBottom: Layout.spacing.lg,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  previewDesc: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: Layout.spacing.md,
  },
  previewWaveform: {
    marginBottom: Layout.spacing.md,
  },
  previewButton: {
    alignSelf: 'center',
  },
  tipSection: {
    padding: Layout.spacing.md,
    backgroundColor: Colors.lightPeach,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.lg,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Layout.spacing.sm,
  },
  tipText: {
    fontSize: 14,
    color: Colors.black,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    backgroundColor: Colors.white,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: Layout.spacing.xs,
  },
});
