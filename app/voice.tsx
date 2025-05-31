import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, Volume2, Settings } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
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
  const [pitch, setPitch] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [stability, setStability] = useState(0.7);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSelectVoice = (voiceId: string) => {
    setSelectedVoice(voiceId);
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

      // Update audiobook status
      await updateAudiobook(id as string, {
        voice_id: selectedVoice,
        status: 'processing',
      });

      // Generate audio
      const audioBlob = await elevenlabsApi.textToSpeech(
        decodeURIComponent(text as string),
        selectedVoice,
        {
          stability,
          speed,
          pitch,
        }
      );

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        // Update audiobook with audio
        await updateAudiobook(id as string, {
          audio_url: base64Audio,
          status: 'completed',
        });

        // Navigate to audio effects
        router.push({
          pathname: '/audio',
          params: { id },
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
      <View style={styles.loadingContainer}>
        <Text>Loading voices...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton} 
          onPress={handleBack}
        >
          <ChevronLeft size={24} color={Colors.black} />
        </Pressable>
        
        <Text style={styles.headerTitle}>Choose Voice</Text>
        
        <Pressable style={styles.settingsButton}>
          <Settings size={20} color={Colors.black} />
        </Pressable>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select a Voice</Text>
          <Text style={styles.sectionDesc}>
            Choose a voice that best fits your audiobook's style and tone.
          </Text>
          
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
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Settings</Text>
          <Text style={styles.sectionDesc}>
            Customize the voice to match your preferences. Click the play button above to preview changes.
          </Text>
          
          <View style={styles.sliderContainer}>
            <View style={styles.sliderLabel}>
              <Volume2 size={18} color={Colors.black} />
              <Text style={styles.sliderText}>Pitch</Text>
            </View>
            
            <View style={styles.sliderContent}>
              <Slider
                value={pitch}
                onValueChange={setPitch}
                minimumValue={0.5}
                maximumValue={1.5}
                minimumTrackTintColor={Colors.black}
                maximumTrackTintColor={Colors.gray[300]}
                thumbTintColor={Colors.black}
                style={styles.slider}
              />
              
              <View style={styles.sliderValues}>
                <Text style={styles.sliderValueText}>Low</Text>
                <Text style={styles.sliderValueText}>{pitch.toFixed(1)}</Text>
                <Text style={styles.sliderValueText}>High</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.sliderContainer}>
            <View style={styles.sliderLabel}>
              <Volume2 size={18} color={Colors.black} />
              <Text style={styles.sliderText}>Speed</Text>
            </View>
            
            <View style={styles.sliderContent}>
              <Slider
                value={speed}
                onValueChange={setSpeed}
                minimumValue={0.5}
                maximumValue={1.5}
                minimumTrackTintColor={Colors.black}
                maximumTrackTintColor={Colors.gray[300]}
                thumbTintColor={Colors.black}
                style={styles.slider}
              />
              
              <View style={styles.sliderValues}>
                <Text style={styles.sliderValueText}>Slow</Text>
                <Text style={styles.sliderValueText}>{speed.toFixed(1)}x</Text>
                <Text style={styles.sliderValueText}>Fast</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.sliderContainer}>
            <View style={styles.sliderLabel}>
              <Volume2 size={18} color={Colors.black} />
              <Text style={styles.sliderText}>Stability</Text>
            </View>
            
            <View style={styles.sliderContent}>
              <Slider
                value={stability}
                onValueChange={setStability}
                minimumValue={0}
                maximumValue={1}
                minimumTrackTintColor={Colors.black}
                maximumTrackTintColor={Colors.gray[300]}
                thumbTintColor={Colors.black}
                style={styles.slider}
              />
              
              <View style={styles.sliderValues}>
                <Text style={styles.sliderValueText}>Creative</Text>
                <Text style={styles.sliderValueText}>{stability.toFixed(1)}</Text>
                <Text style={styles.sliderValueText}>Stable</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.tipSection}>
          <Text style={styles.tipTitle}>Voice Tips</Text>
          <Text style={styles.tipText}>
            • Higher stability produces more consistent narration
          </Text>
          <Text style={styles.tipText}>
            • Adjust pitch to match character personalities
          </Text>
          <Text style={styles.tipText}>
            • Try different speeds for different content types
          </Text>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button 
          title="Back: Text Input" 
          variant="outline"
          onPress={handleBack}
          style={styles.footerButton}
        />
        
        <Button 
          title="Next: Audio Effects" 
          onPress={handleNext}
          loading={isProcessing}
          disabled={!selectedVoice || isProcessing}
          style={styles.footerButton}
          icon={<ChevronRight size={18} color={Colors.white} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softCream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.softCream,
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
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxl,
  },
  section: {
    marginBottom: Layout.spacing.xl,
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
    marginBottom: Layout.spacing.md,
  },
  sliderContainer: {
    marginBottom: Layout.spacing.md,
  },
  sliderLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  sliderText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
    marginLeft: Layout.spacing.xs,
  },
  sliderContent: {
    paddingHorizontal: Layout.spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderValueText: {
    fontSize: 12,
    color: Colors.gray[500],
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
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  footerButton: {
    flex: 1,
    marginHorizontal: Layout.spacing.xs,
  },
});