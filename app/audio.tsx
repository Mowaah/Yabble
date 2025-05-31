import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Music, Play, Volume2 } from 'lucide-react-native';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { mockAudioEffects } from '../utils/mockData';
import { AudioEffect } from '../types';
import { audioEffects } from '../lib/audio';

export default function AudioScreen() {
  const router = useRouter();
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [volume, setVolume] = useState(audioEffects.getVolume());
  const [isPlaying, setIsPlaying] = useState(false);
  
  const effectCategories = [
    { id: 'music', title: 'Background Music' },
    { id: 'ambient', title: 'Ambient Sounds' },
    { id: 'sound_effect', title: 'Sound Effects' }
  ];
  
  const getEffectsByCategory = (category: string) => {
    return mockAudioEffects.filter(effect => effect.category === category);
  };
  
  const handleSelectEffect = async (effectId: string) => {
    try {
      const effect = mockAudioEffects.find(e => e.id === effectId);
      if (!effect) return;

      if (selectedEffect === effectId) {
        await audioEffects.stopBackgroundMusic();
        setSelectedEffect(null);
        setIsPlaying(false);
      } else {
        await audioEffects.loadBackgroundMusic(effect.previewUrl);
        await audioEffects.playBackgroundMusic();
        setSelectedEffect(effectId);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error handling effect selection:', error);
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    try {
      await audioEffects.setVolume(newVolume);
      setVolume(newVolume);
    } catch (error) {
      console.error('Error changing volume:', error);
    }
  };
  
  const handleNext = () => {
    router.push('/export');
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
  
  const renderEffectItem = ({ item }: { item: AudioEffect }) => (
    <Card 
      style={[
        styles.effectCard,
        selectedEffect === item.id && styles.selectedEffectCard
      ]}
      onPress={() => handleSelectEffect(item.id)}
    >
      <View style={styles.effectHeader}>
        <Text style={styles.effectName}>{item.name}</Text>
        <Pressable 
          style={[
            styles.playButton,
            selectedEffect === item.id && styles.playingButton
          ]}
        >
          <Play size={14} color={Colors.white} />
        </Pressable>
      </View>
      
      <View style={styles.waveformContainer}>
        <View style={[
          styles.waveform,
          selectedEffect === item.id && styles.activeWaveform
        ]} />
      </View>
    </Card>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton} 
          onPress={handleBack}
        >
          <ChevronLeft size={24} color={Colors.black} />
        </Pressable>
        
        <Text style={styles.headerTitle}>Audio Effects</Text>
        
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enhance Your Audiobook</Text>
          <Text style={styles.sectionDesc}>
            Add background music, ambient sounds, or effects to enhance the listening experience.
          </Text>
        </View>
        
        {effectCategories.map(category => {
          const categoryEffects = getEffectsByCategory(category.id);
          
          if (categoryEffects.length === 0) return null;
          
          return (
            <View key={category.id} style={styles.section}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              
              <FlatList
                data={categoryEffects}
                renderItem={renderEffectItem}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.effectsListContent}
              />
            </View>
          );
        })}
        
        <View style={styles.volumeSection}>
          <Text style={styles.volumeTitle}>Effect Volume</Text>
          
          <View style={styles.volumeSlider}>
            <Volume2 size={18} color={Colors.black} />
            <Pressable 
              style={styles.volumeTrack}
              onTouchStart={(e) => {
                const { locationX } = e.nativeEvent;
                const width = e.nativeEvent.target.offsetWidth;
                const newVolume = Math.max(0, Math.min(1, locationX / width));
                handleVolumeChange(newVolume);
              }}
            >
              <View 
                style={[
                  styles.volumeFill,
                  { width: `${volume * 100}%` }
                ]} 
              />
            </Pressable>
            <Text style={styles.volumeValue}>{Math.round(volume * 100)}%</Text>
          </View>
        </View>
        
        <Card style={styles.previewCard}>
          <Text style={styles.previewTitle}>Audio Preview</Text>
          <Text style={styles.previewDesc}>
            Listen to a sample of your audiobook with the selected effects.
          </Text>
          
          <View style={styles.previewWaveform}>
            <View style={styles.waveformContainer}>
              <View style={[
                styles.waveform,
                isPlaying && styles.activeWaveform
              ]} />
            </View>
          </View>
          
          <Button 
            title="Play Preview" 
            variant="secondary"
            onPress={() => {}}
            icon={<Play size={18} color={Colors.black} />}
            style={styles.previewButton}
          />
        </Card>
        
        <View style={styles.tipSection}>
          <Text style={styles.tipTitle}>Audio Tips</Text>
          <Text style={styles.tipText}>
            • Choose effects that match the mood of your content
          </Text>
          <Text style={styles.tipText}>
            • Keep background audio subtle to avoid distracting from narration
          </Text>
          <Text style={styles.tipText}>
            • Different sections can have different background sounds
          </Text>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button 
          title="Back: Voice" 
          variant="outline"
          onPress={handleBack}
          style={styles.footerButton}
        />
        
        <Button 
          title="Next: Export" 
          onPress={handleNext}
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
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxl,
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
  },
  volumeFill: {
    height: '100%',
    backgroundColor: Colors.black,
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
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  footerButton: {
    flex: 1,
    marginHorizontal: Layout.spacing.xs,
  },
});