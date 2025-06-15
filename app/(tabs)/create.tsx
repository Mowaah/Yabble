import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, ActivityIndicator, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { FileUp, Mic, Link as LinkIcon, Text as TextIcon, Bot, ChevronRight, Play, Plus } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useCreateAudiobook } from '../../hooks/useCreateAudiobook';
import { useAuth } from '../../contexts/AuthContext';
import { processDocument, validateTextForTTS, DocumentProcessingError } from '../../utils/documentProcessor';

const { width } = Dimensions.get('window');

enum InputMethod {
  TEXT = 'text',
  FILE = 'file',
  URL = 'url',
}

export default function CreateScreen() {
  const router = useRouter();
  const { session: authSession, isLoading: isAuthLoading } = useAuth();
  const { create, isLoading: isCreating, error: createError } = useCreateAudiobook();
  const [inputMethod, setInputMethod] = useState<InputMethod | null>(null);
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const insets = useSafeAreaInsets();

  const handleMethodSelect = (method: InputMethod) => {
    if (isProcessingFile) return;
    if (inputMethod !== method) {
      setText('');
      setUrl('');
      setSelectedFile(null);
      setInputMethod(method);
    }
  };

  const handleFileInput = async () => {
    handleMethodSelect(InputMethod.FILE);
    try {
      setIsProcessingFile(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/pdf',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setInputMethod(null);
        return;
      }

      const asset = result.assets[0];
      setSelectedFile(asset.name);
      const extractedText = await processDocument(asset.uri, asset.mimeType, asset.name);

      const validation = validateTextForTTS(extractedText);
      if (!validation.isValid) {
        Alert.alert('File Error', validation.message || 'Invalid text');
        setSelectedFile(null);
        setInputMethod(null);
        return;
      }
      setText(extractedText);
    } catch (error: any) {
      const errorMessage =
        error instanceof DocumentProcessingError ? error.message : 'Could not process the selected file.';
      Alert.alert('File Processing Error', errorMessage);
      setSelectedFile(null);
      setInputMethod(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleUrlInput = () => {
    handleMethodSelect(InputMethod.URL);
    Alert.alert('Coming Soon', 'URL processing is not yet implemented.');
  };

  const handleNext = async () => {
    if (isAuthLoading || !authSession?.user?.id) {
      Alert.alert('Authentication Error', 'Please wait or sign in.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Input Error', 'Please enter a title for your audiobook.');
      return;
    }
    let contentToProcess = '';
    if (inputMethod === InputMethod.TEXT) contentToProcess = text;
    if (inputMethod === InputMethod.FILE) contentToProcess = text;
    if (inputMethod === InputMethod.URL) contentToProcess = url;

    if (!contentToProcess.trim()) {
      Alert.alert('Input Error', `Please provide content for the audiobook via ${inputMethod}.`);
      return;
    }

    try {
      const audiobook = await create({
        title,
        textContent: JSON.stringify({
          originalText: contentToProcess,
          backgroundEffect: null,
        }),
      });

      if (!audiobook) {
        throw new Error(createError || 'Failed to create audiobook.');
      }

      router.push({
        pathname: '/voice',
        params: {
          id: audiobook.id,
          title: encodeURIComponent(title),
          text: encodeURIComponent(contentToProcess),
        },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    }
  };

  if (isAuthLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Audiobook</Text>
          <Text style={styles.headerSubtitle}>Transform your content into AI speech</Text>
        </View>
        {!inputMethod ? (
          // Step 1: Choose Method
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Choose your source</Text>
            </View>

            <View style={styles.optionsGrid}>
              <Pressable style={styles.optionCard} onPress={() => handleMethodSelect(InputMethod.TEXT)}>
                <View style={styles.optionIcon}>
                  <TextIcon size={32} color={Colors.primary} />
                </View>
                <Text style={styles.optionTitle}>Text</Text>
                <Text style={styles.optionDesc}>Type directly</Text>
              </Pressable>

              <Pressable style={styles.optionCard} onPress={handleFileInput} disabled={isProcessingFile}>
                <View style={styles.optionIcon}>
                  {isProcessingFile ? (
                    <ActivityIndicator color={Colors.primary} />
                  ) : (
                    <FileUp size={32} color={Colors.primary} />
                  )}
                </View>
                <Text style={styles.optionTitle}>File</Text>
                <Text style={styles.optionDesc}>Upload document</Text>
              </Pressable>

              <Pressable style={[styles.optionCard, styles.disabledCard]} onPress={handleUrlInput}>
                <View style={styles.optionIcon}>
                  <LinkIcon size={32} color={Colors.gray[400]} />
                </View>
                <Text style={[styles.optionTitle, styles.disabledText]}>URL</Text>
                <Text style={[styles.optionDesc, styles.disabledText]}>Coming soon</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          // Step 2: Add Content
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Add your content</Text>
            </View>

            <View>
              {inputMethod === InputMethod.TEXT && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Your Text</Text>
                  <Input
                    placeholder="Start typing your content here..."
                    value={text}
                    onChangeText={setText}
                    multiline
                    textAlignVertical="top"
                    inputStyle={styles.textInput}
                  />
                </View>
              )}

              {inputMethod === InputMethod.FILE && selectedFile && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Selected File</Text>
                  <View style={styles.fileDisplay}>
                    <FileUp size={24} color={Colors.primary} />
                    <Text style={styles.fileName}>{selectedFile}</Text>
                    <View style={styles.fileStatus}>
                      <Text style={styles.fileStatusText}>Ready</Text>
                    </View>
                  </View>
                </View>
              )}

              {inputMethod === InputMethod.URL && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Website URL</Text>
                  <Input
                    placeholder="https://example.com/article"
                    value={url}
                    onChangeText={setUrl}
                    keyboardType="url"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Audiobook Title</Text>
                <Input placeholder="Give your audiobook a title" value={title} onChangeText={setTitle} />
              </View>

              <View style={styles.actionButtons}>
                <Button title="Back" variant="ghost" onPress={() => setInputMethod(null)} style={styles.backButton} />
                <Button
                  title="Create"
                  onPress={handleNext}
                  loading={isCreating}
                  icon={<Play size={18} color={Colors.white} />}
                  style={styles.createButton}
                />
              </View>
            </View>
          </View>
        )}

        {/* Quick Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Quick Tips</Text>
          <Text style={styles.tipItem}>• Use clear punctuation for natural speech</Text>
          <Text style={styles.tipItem}>• Longer content works better for AI voices</Text>
          <Text style={styles.tipItem}>• Check spelling before creating</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Layout.spacing.sm,
    color: Colors.gray[500],
    fontSize: 16,
  },
  header: {
    paddingBottom: Layout.spacing.xl,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 18,
    color: Colors.gray[500],
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl * 2,
  },
  stepContainer: {
    marginBottom: Layout.spacing.xl,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  stepNumberText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gray[900],
    letterSpacing: -0.5,
  },
  optionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Layout.spacing.md,
  },
  optionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Layout.spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray[200],
  },
  disabledCard: {
    opacity: 0.5,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[900],
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 12,
    color: Colors.gray[500],
    textAlign: 'center',
  },
  disabledText: {
    color: Colors.gray[400],
  },
  inputContainer: {
    marginBottom: Layout.spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.sm,
  },
  textInput: {
    backgroundColor: 'transparent',
    color: Colors.gray[900],
    fontSize: 16,
    minHeight: 240,
    borderWidth: 0,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  fileDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    padding: Layout.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  fileName: {
    flex: 1,
    color: Colors.gray[900],
    fontSize: 16,
    marginLeft: Layout.spacing.sm,
  },
  fileStatus: {
    backgroundColor: Colors.cyberGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fileStatusText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    marginTop: Layout.spacing.md,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  createButton: {
    flex: 2,
    backgroundColor: Colors.primary,
  },
  tipsSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Layout.spacing.lg,
    marginTop: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[900],
    marginBottom: Layout.spacing.sm,
  },
  tipItem: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: Layout.spacing.xs,
    lineHeight: 20,
  },
});
