import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, DownloadCloud, Share2, Music, 
  Bookmark, CheckCircle2, AlertCircle
} from 'lucide-react-native';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

enum ExportStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error',
}

export default function ExportScreen() {
  const router = useRouter();
  const [exportStatus, setExportStatus] = useState<ExportStatus>(ExportStatus.IDLE);
  const [selectedFormat, setSelectedFormat] = useState<string>('mp3');
  
  const exportFormats = [
    { id: 'mp3', name: 'MP3', description: 'Standard audio format (smaller file)' },
    { id: 'wav', name: 'WAV', description: 'High quality lossless audio (larger file)' },
  ];
  
  const handleExport = () => {
    setExportStatus(ExportStatus.PROCESSING);
    
    // Simulate export process
    setTimeout(() => {
      setExportStatus(ExportStatus.SUCCESS);
    }, 3000);
  };
  
  const handleBack = () => {
    router.back();
  };
  
  const handleComplete = () => {
    // Navigate to the library screen
    router.replace('/library');
  };
  
  const renderExportContent = () => {
    switch (exportStatus) {
      case ExportStatus.PROCESSING:
        return (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={Colors.black} />
            <Text style={styles.processingTitle}>Creating Your Audiobook</Text>
            <Text style={styles.processingDesc}>
              This may take a few minutes depending on the length of your text.
            </Text>
          </View>
        );
      
      case ExportStatus.SUCCESS:
        return (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <CheckCircle2 size={48} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Audiobook Created!</Text>
            <Text style={styles.successDesc}>
              Your audiobook has been successfully created and added to your library.
            </Text>
            
            <View style={styles.actionsContainer}>
              <Button 
                title="Download" 
                variant="outline"
                onPress={() => {}}
                icon={<DownloadCloud size={18} color={Colors.black} />}
                style={styles.actionButton}
              />
              
              <Button 
                title="Share" 
                variant="outline"
                onPress={() => {}}
                icon={<Share2 size={18} color={Colors.black} />}
                style={styles.actionButton}
              />
            </View>
            
            <Button 
              title="Go to Library" 
              onPress={handleComplete}
              fullWidth
              style={styles.completeButton}
            />
          </View>
        );
      
      case ExportStatus.ERROR:
        return (
          <View style={styles.errorContainer}>
            <View style={styles.errorIcon}>
              <AlertCircle size={48} color={Colors.error} />
            </View>
            <Text style={styles.errorTitle}>Export Failed</Text>
            <Text style={styles.errorDesc}>
              There was an error creating your audiobook. Please try again.
            </Text>
            
            <Button 
              title="Try Again" 
              onPress={handleExport}
              style={styles.tryAgainButton}
            />
          </View>
        );
      
      default:
        return (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Export Settings</Text>
              <Text style={styles.sectionDesc}>
                Choose your preferred format and options before exporting.
              </Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.optionTitle}>File Format</Text>
              
              {exportFormats.map(format => (
                <Pressable 
                  key={format.id}
                  style={[
                    styles.formatOption,
                    selectedFormat === format.id && styles.selectedFormatOption
                  ]}
                  onPress={() => setSelectedFormat(format.id)}
                >
                  <View style={styles.formatRadio}>
                    {selectedFormat === format.id && (
                      <View style={styles.formatRadioSelected} />
                    )}
                  </View>
                  
                  <View style={styles.formatInfo}>
                    <Text style={styles.formatName}>{format.name}</Text>
                    <Text style={styles.formatDesc}>{format.description}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
            
            <View style={styles.section}>
              <Text style={styles.optionTitle}>Additional Options</Text>
              
              <View style={styles.optionItem}>
                <View style={styles.optionCheckbox} />
                <Text style={styles.optionLabel}>Add chapter markers</Text>
                <Bookmark size={16} color={Colors.gray[500]} />
              </View>
              
              <View style={styles.optionItem}>
                <View style={styles.optionCheckbox} />
                <Text style={styles.optionLabel}>Include background music</Text>
                <Music size={16} color={Colors.gray[500]} />
              </View>
            </View>
            
            <Button 
              title="Create Audiobook" 
              onPress={handleExport}
              fullWidth
              style={styles.exportButton}
            />
            
            <Card style={styles.infoCard}>
              <Text style={styles.infoTitle}>Before You Export</Text>
              <Text style={styles.infoText}>
                Exporting will use ElevenLabs' API to generate your audiobook. This process may take a few minutes depending on the length of your text.
              </Text>
            </Card>
          </>
        );
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton} 
          onPress={handleBack}
          disabled={exportStatus === ExportStatus.PROCESSING}
        >
          <ChevronLeft size={24} color={Colors.black} />
        </Pressable>
        
        <Text style={styles.headerTitle}>Export</Text>
        
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderExportContent()}
      </ScrollView>
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
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Layout.spacing.sm,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.sm,
  },
  selectedFormatOption: {
    borderWidth: 2,
    borderColor: Colors.black,
  },
  formatRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.black,
    marginRight: Layout.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formatRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.black,
  },
  formatInfo: {
    flex: 1,
  },
  formatName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
    marginBottom: 2,
  },
  formatDesc: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.sm,
  },
  optionCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.black,
    marginRight: Layout.spacing.md,
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.black,
  },
  exportButton: {
    marginBottom: Layout.spacing.lg,
  },
  infoCard: {
    backgroundColor: Colors.lightPeach,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: Colors.black,
    lineHeight: 20,
  },
  
  // Processing state styles
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xxl,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.black,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.sm,
  },
  processingDesc: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
    marginHorizontal: Layout.spacing.lg,
  },
  
  // Success state styles
  successContainer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  successIcon: {
    marginBottom: Layout.spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Layout.spacing.sm,
  },
  successDesc: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
    marginHorizontal: Layout.spacing.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Layout.spacing.lg,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: Layout.spacing.xs,
  },
  completeButton: {
    marginTop: Layout.spacing.md,
  },
  
  // Error state styles
  errorContainer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  errorIcon: {
    marginBottom: Layout.spacing.lg,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Layout.spacing.sm,
  },
  errorDesc: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
    marginHorizontal: Layout.spacing.md,
  },
  tryAgainButton: {
    marginTop: Layout.spacing.md,
  },
});