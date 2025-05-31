import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Share2,
  Download,
  CreditCard as Edit,
  Clock,
  CalendarDays,
  Headphones,
  Play,
  Pause,
} from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Player from '../../components/audiobook/Player';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { audioEffects } from '../../lib/audio';
import { mockAudioEffects } from '../../utils/mockData';
import type { Tables } from '../../lib/database';

export default function AudiobookDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audiobook, setAudiobook] = useState<
    Tables['audiobooks']['Row'] | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAudiobook() {
      if (!session?.user?.id || !id) return;

      try {
        const { data, error } = await supabase
          .from('audiobooks')
          .select('*')
          .eq('id', id)
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;
        setAudiobook(data);
      } catch (error) {
        console.error('Error fetching audiobook:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAudiobook();
  }, [id, session?.user?.id]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (isPlaying) {
        audioEffects.stopAllAudio();
      }
    };
  }, [isPlaying]);

  const getBackgroundEffect = () => {
    if (!audiobook) return null;
    try {
      const parsedContent = JSON.parse(audiobook.text_content);
      return parsedContent.backgroundEffect;
    } catch {
      return null;
    }
  };

  const getOriginalText = () => {
    if (!audiobook) return '';
    try {
      const parsedContent = JSON.parse(audiobook.text_content);
      return parsedContent.originalText || audiobook.text_content;
    } catch {
      return audiobook.text_content;
    }
  };

  const getBackgroundEffectName = () => {
    const backgroundEffectId = getBackgroundEffect();
    if (!backgroundEffectId) return 'None';

    const effect = mockAudioEffects.find((e) => e.id === backgroundEffectId);
    return effect ? effect.name : 'Custom Effect';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!audiobook) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Audiobook not found</Text>
        <Button title="Go back" onPress={() => router.back()} />
      </View>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePlay = async () => {
    if (!audiobook.audio_url) return;

    try {
      if (isPlaying) {
        // Stop all audio
        await audioEffects.stopAllAudio();
        setIsPlaying(false);
      } else {
        // Load voice audio
        await audioEffects.loadVoiceAudio(audiobook.audio_url);

        // Load background effect if available
        const backgroundEffectId = getBackgroundEffect();
        if (backgroundEffectId) {
          const effect = mockAudioEffects.find(
            (e) => e.id === backgroundEffectId
          );
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
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color={Colors.black} />
          </Pressable>

          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton}>
              <Share2 size={20} color={Colors.black} />
            </Pressable>

            <Pressable style={styles.iconButton}>
              <Download size={20} color={Colors.black} />
            </Pressable>

            <Pressable style={styles.iconButton}>
              <Edit size={20} color={Colors.black} />
            </Pressable>
          </View>
        </View>

        <View style={styles.coverContainer}>
          <Image
            source={{
              uri:
                audiobook.cover_image ||
                'https://images.pexels.com/photos/1261180/pexels-photo-1261180.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            }}
            style={styles.coverImage}
          />
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{audiobook.title}</Text>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <CalendarDays size={16} color={Colors.gray[500]} />
              <Text style={styles.metaText}>
                {formatDate(audiobook.created_at)}
              </Text>
            </View>

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{audiobook.status}</Text>
            </View>
          </View>

          {audiobook.status === 'completed' && audiobook.audio_url && (
            <Button
              title={isPlaying ? 'Pause' : 'Play'}
              onPress={handlePlay}
              icon={
                isPlaying ? (
                  <Pause size={18} color={Colors.white} />
                ) : (
                  <Play size={18} color={Colors.white} />
                )
              }
              fullWidth
              style={styles.playButton}
            />
          )}
        </View>

        <Card style={styles.textPreviewCard}>
          <Text style={styles.previewTitle}>Text Preview</Text>
          <Text style={styles.previewText} numberOfLines={10}>
            {getOriginalText()}
          </Text>
          <Button
            title="Show Full Text"
            variant="outline"
            size="sm"
            onPress={() => {}}
            style={styles.showMoreButton}
          />
        </Card>

        <Card style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Voice & Audio</Text>

          <View style={styles.detailItem}>
            <View style={styles.detailLabel}>
              <Text style={styles.detailLabelText}>Voice</Text>
            </View>
            <Text style={styles.detailValue}>
              {audiobook.voice_id ? 'Custom Voice' : 'Default Voice'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailLabel}>
              <Text style={styles.detailLabelText}>Background</Text>
            </View>
            <Text style={styles.detailValue}>{getBackgroundEffectName()}</Text>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailLabel}>
              <Text style={styles.detailLabelText}>Status</Text>
            </View>
            <Text style={[styles.detailValue, { textTransform: 'capitalize' }]}>
              {audiobook.status}
            </Text>
          </View>
        </Card>

        <View style={styles.actionsContainer}>
          <Button
            title="Share"
            variant="outline"
            onPress={() => {}}
            icon={<Share2 size={18} color={Colors.black} />}
            style={styles.actionButton}
          />

          <Button
            title="Edit"
            variant="outline"
            onPress={() => {}}
            icon={<Edit size={18} color={Colors.black} />}
            style={styles.actionButton}
          />

          <Button
            title="Download"
            variant="outline"
            onPress={() => {}}
            icon={<Download size={18} color={Colors.black} />}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>

      {isPlaying && (
        <View style={styles.playerContainer}>
          <Player audiobook={audiobook} />
        </View>
      )}
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Layout.spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  coverContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  coverImage: {
    width: 240,
    height: 240,
    borderRadius: Layout.borderRadius.lg,
  },
  titleContainer: {
    marginBottom: Layout.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Layout.spacing.sm,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: Layout.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
    marginBottom: Layout.spacing.xs,
  },
  metaText: {
    fontSize: 14,
    color: Colors.gray[500],
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.lightPeach,
    borderRadius: Layout.borderRadius.full,
    marginBottom: Layout.spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.black,
    textTransform: 'capitalize',
  },
  playButton: {
    marginTop: Layout.spacing.sm,
  },
  textPreviewCard: {
    marginBottom: Layout.spacing.lg,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Layout.spacing.sm,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.black,
    marginBottom: Layout.spacing.md,
  },
  showMoreButton: {
    alignSelf: 'flex-start',
  },
  detailsCard: {
    marginBottom: Layout.spacing.lg,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Layout.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  detailLabel: {
    width: 100,
  },
  detailLabelText: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.lg,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: Layout.spacing.xs,
  },
  playerContainer: {
    padding: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.md,
  },
  notFoundText: {
    fontSize: 18,
    color: Colors.gray[600],
    marginBottom: Layout.spacing.md,
  },
});
