import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, Animated, Dimensions, Vibration } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Mic, Sparkles, Settings, ChevronDown, ChevronUp } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import Button from '../components/ui/Button';
import VoiceSelector from '../components/audiobook/VoiceSelector';
import { useVoices } from '../hooks/useVoices';
import { updateAudiobook } from '../lib/database';
import { elevenlabsApi } from '../lib/elevenlabs';
import { saveVoiceSettings } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';

export default function VoiceScreen() {
  const router = useRouter();
  const { id, title, text } = useLocalSearchParams();
  const { session } = useAuth();
  const { voices, isLoading: loadingVoices } = useVoices();
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [pitch, setPitch] = useState(1.0);
  const [speed, setSpeed] = useState(1.0);
  const [stability, setStability] = useState(0.7);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSelectVoice = (voiceId: string) => {
    setSelectedVoice(voiceId);
    Vibration.vibrate(50);
  };

  const handleNext = async () => {
    if (!selectedVoice || !id || !session?.user) {
      Alert.alert('Error', 'Please select a voice first');
      return;
    }

    try {
      setIsProcessing(true);

      // Save voice settings
      await saveVoiceSettings({
        user_id: session.user.id,
        voice_id: selectedVoice,
        pitch,
        speed,
        stability,
      });

      // Generate voice audio
      const originalText = (() => {
        try {
          const parsedContent = JSON.parse(decodeURIComponent(text as string));
          return parsedContent.originalText || decodeURIComponent(text as string);
        } catch {
          return decodeURIComponent(text as string);
        }
      })();

      const audioBlob = await elevenlabsApi.textToSpeech(originalText, selectedVoice, {
        stability,
        speed,
        pitch,
      });

      // Convert blob to base64 with proper MIME type for iOS compatibility
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        let base64Audio = reader.result as string;

        // Ensure proper MIME type for iOS compatibility
        if (!base64Audio.startsWith('data:audio/')) {
          // If the MIME type is missing or incorrect, fix it
          const base64Data = base64Audio.split(',')[1];
          base64Audio = `data:audio/mpeg;base64,${base64Data}`;
        }

        // Update audiobook with voice audio only
        await updateAudiobook(id as string, {
          voice_id: selectedVoice,
          audio_url: base64Audio,
          status: 'completed',
        });

        // Navigate to audio effects for background selection
        router.push({
          pathname: '/audio',
          params: {
            id,
            voiceAudio: base64Audio,
          },
        });
      };
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loadingVoices) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Sparkles size={32} color={Colors.primary} />
          <Text style={styles.loadingText}>Loading voices...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.innerContainer, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={24} color={Colors.primary} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Mic size={20} color={Colors.primary} />
            <Text style={styles.headerTitle}>Choose Voice</Text>
          </View>

          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Voice Selection */}
          <VoiceSelector
            voices={voices}
            selectedVoiceId={selectedVoice}
            onSelectVoice={handleSelectVoice}
            voiceSettings={{
              pitch,
              speed,
              stability,
            }}
          />

          {/* Advanced Settings (Collapsible) */}
          <View style={styles.advancedSection}>
            <Pressable style={styles.advancedToggle} onPress={() => setShowAdvanced(!showAdvanced)}>
              <View style={styles.advancedHeader}>
                <Settings size={18} color={Colors.gray[600]} />
                <Text style={styles.advancedTitle}>Advanced Settings</Text>
              </View>
              {showAdvanced ? (
                <ChevronUp size={20} color={Colors.gray[600]} />
              ) : (
                <ChevronDown size={20} color={Colors.gray[600]} />
              )}
            </Pressable>

            {showAdvanced && (
              <View style={styles.advancedContent}>
                <Text style={styles.advancedDesc}>Fine-tune voice parameters for the perfect sound</Text>

                {/* Pitch Slider */}
                <View style={styles.sliderCard}>
                  <View style={styles.sliderHeader}>
                    <Text style={styles.sliderLabel}>Pitch</Text>
                    <Text style={styles.sliderValue}>{pitch.toFixed(1)}</Text>
                  </View>
                  <Slider
                    value={pitch}
                    onValueChange={setPitch}
                    minimumValue={0.5}
                    maximumValue={1.5}
                    minimumTrackTintColor={Colors.primary}
                    maximumTrackTintColor={Colors.gray[200]}
                    thumbTintColor={Colors.primary}
                    style={styles.slider}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabelText}>Lower</Text>
                    <Text style={styles.sliderLabelText}>Higher</Text>
                  </View>
                </View>

                {/* Speed Slider */}
                <View style={styles.sliderCard}>
                  <View style={styles.sliderHeader}>
                    <Text style={styles.sliderLabel}>Speed</Text>
                    <Text style={styles.sliderValue}>{speed.toFixed(1)}x</Text>
                  </View>
                  <Slider
                    value={speed}
                    onValueChange={setSpeed}
                    minimumValue={0.5}
                    maximumValue={1.5}
                    minimumTrackTintColor={Colors.primary}
                    maximumTrackTintColor={Colors.gray[200]}
                    thumbTintColor={Colors.primary}
                    style={styles.slider}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabelText}>Slower</Text>
                    <Text style={styles.sliderLabelText}>Faster</Text>
                  </View>
                </View>

                {/* Stability Slider */}
                <View style={styles.sliderCard}>
                  <View style={styles.sliderHeader}>
                    <Text style={styles.sliderLabel}>Stability</Text>
                    <Text style={styles.sliderValue}>{stability.toFixed(1)}</Text>
                  </View>
                  <Slider
                    value={stability}
                    onValueChange={setStability}
                    minimumValue={0}
                    maximumValue={1}
                    minimumTrackTintColor={Colors.primary}
                    maximumTrackTintColor={Colors.gray[200]}
                    thumbTintColor={Colors.primary}
                    style={styles.slider}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabelText}>Creative</Text>
                    <Text style={styles.sliderLabelText}>Consistent</Text>
                  </View>
                </View>

                <View style={styles.advancedTip}>
                  <Text style={styles.tipText}>💡 Tip: Use the preview button above to test your settings</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Simple Footer */}
        <View style={styles.footer}>
          <Button title="Back" onPress={handleBack} variant="ghost" style={styles.backFooterButton} />
          <Button
            title="Generate Audiobook"
            onPress={handleNext}
            style={styles.generateButton}
            icon={<Sparkles size={18} color={Colors.white} />}
            loading={isProcessing}
            disabled={!selectedVoice}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softBackground,
  },
  innerContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray[600],
    fontWeight: '500',
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

  advancedSection: {
    marginTop: Layout.spacing.sm,
  },

  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  advancedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  advancedContent: {
    marginTop: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  advancedDesc: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: Layout.spacing.lg,
    textAlign: 'center',
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
  advancedTip: {
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    padding: Layout.spacing.md,
    marginTop: Layout.spacing.sm,
  },
  tipText: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
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
  generateButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minHeight: 50,
  },
});
