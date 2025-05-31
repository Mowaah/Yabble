import React from 'react';
import { StyleSheet, Text, View, ScrollView, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, ChevronRight } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import AudiobookCard from '../../components/audiobook/AudiobookCard';
import { mockAudiobooks } from '../../utils/mockData';

export default function HomeScreen() {
  const router = useRouter();
  const recentBooks = mockAudiobooks.slice(0, 2);
  
  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.appName}>StoryVoice</Text>
        <Text style={styles.welcomeText}>Transform your text into beautiful audiobooks</Text>
      </View>
      
      <Card style={styles.createCard} onPress={() => router.push('/create')}>
        <View style={styles.createCardContent}>
          <View style={styles.createTextContainer}>
            <Text style={styles.createTitle}>Create a new audiobook</Text>
            <Text style={styles.createSubtitle}>
              Turn any text into a professional audiobook in minutes
            </Text>
          </View>
          
          <View style={styles.createButtonContainer}>
            <View style={styles.createButton}>
              <Plus size={24} color={Colors.white} />
            </View>
          </View>
        </View>
      </Card>
      
      {recentBooks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Audiobooks</Text>
            <Pressable 
              style={styles.seeAllButton} 
              onPress={() => router.push('/library')}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <ChevronRight size={16} color={Colors.black} />
            </Pressable>
          </View>
          
          {recentBooks.map(book => (
            <AudiobookCard key={book.id} book={book} />
          ))}
        </View>
      )}
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Voices</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.voicesScrollContent}
        >
          {[1, 2, 3, 4].map(i => (
            <Card key={i} style={styles.voiceCard}>
              <Image 
                source={{ uri: `https://images.pexels.com/photos/12${i}680/pexels-photo-12${i}680.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2` }} 
                style={styles.voiceImage} 
              />
              <View style={styles.voiceInfo}>
                <Text style={styles.voiceName}>Voice {i}</Text>
                <Text style={styles.voiceDesc}>Professional Narrator</Text>
              </View>
              <Button 
                title="Try" 
                size="sm" 
                variant="outline" 
                onPress={() => {}}
                style={styles.tryButton}
              />
            </Card>
          ))}
        </ScrollView>
      </View>
      
      <Card style={styles.tipCard}>
        <Text style={styles.tipTitle}>Pro Tip</Text>
        <Text style={styles.tipText}>
          For best results, break dialogue with quotation marks and use punctuation to create natural pauses.
        </Text>
      </Card>
      
      <View style={styles.premiumSection}>
        <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
        <Text style={styles.premiumDesc}>
          Get access to all premium voices, unlimited exports, and advanced editing features.
        </Text>
        <Button 
          title="Explore Premium" 
          variant="secondary" 
          onPress={() => {}}
          style={styles.premiumButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softCream,
  },
  content: {
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxl,
  },
  header: {
    marginBottom: Layout.spacing.lg,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Layout.spacing.xs,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  createCard: {
    backgroundColor: Colors.black,
    marginBottom: Layout.spacing.lg,
  },
  createCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  createTextContainer: {
    flex: 1,
  },
  createTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  createSubtitle: {
    fontSize: 14,
    color: Colors.gray[300],
  },
  createButtonContainer: {
    marginLeft: Layout.spacing.md,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: Layout.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.black,
    marginRight: 4,
  },
  voicesScrollContent: {
    paddingVertical: Layout.spacing.sm,
  },
  voiceCard: {
    width: 160,
    marginRight: Layout.spacing.md,
  },
  voiceImage: {
    width: '100%',
    height: 80,
    borderTopLeftRadius: Layout.borderRadius.md,
    borderTopRightRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.xs,
  },
  voiceInfo: {
    marginBottom: Layout.spacing.sm,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
  },
  voiceDesc: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  tryButton: {
    alignSelf: 'flex-start',
  },
  tipCard: {
    backgroundColor: Colors.lightPeach,
    marginBottom: Layout.spacing.lg,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: Colors.black,
    lineHeight: 20,
  },
  premiumSection: {
    padding: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.lightPeach,
    marginBottom: Layout.spacing.lg,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  premiumDesc: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: Layout.spacing.md,
    lineHeight: 20,
  },
  premiumButton: {
    alignSelf: 'flex-start',
  },
});