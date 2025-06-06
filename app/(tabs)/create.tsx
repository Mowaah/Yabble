import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  FileUp,
  Mic,
  Link as LinkIcon,
  Text as TextIcon,
  Bot,
  ChevronRight,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useCreateAudiobook } from '../../hooks/useCreateAudiobook';
import { useAuth } from '../../contexts/AuthContext';
import {
  processDocument,
  validateTextForTTS,
  DocumentProcessingError,
} from '../../utils/documentProcessor';

enum InputMethod {
  TEXT = 'text',
  FILE = 'file',
  URL = 'url',
}

export default function CreateScreen() {
  const router = useRouter();
  const { session: authSession, isLoading: isAuthLoading } = useAuth();
  const {
    create,
    isLoading: isCreating,
    error: createError,
  } = useCreateAudiobook();
  const [inputMethod, setInputMethod] = useState<InputMethod | null>(null);
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

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
      const extractedText = await processDocument(
        asset.uri,
        asset.mimeType,
        asset.name
      );

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
        error instanceof DocumentProcessingError
          ? error.message
          : 'Could not process the selected file.';
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
      Alert.alert(
        'Input Error',
        `Please provide content for the audiobook via ${inputMethod}.`
      );
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
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.black} />
        <Text style={styles.loadingText}>Loading session...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={styles.aiBadge}>
          <Bot size={14} color={Colors.gray[600]} />
          <Text style={styles.aiBadgeText}>Powered by AI</Text>
        </View>
        <Text style={styles.title}>AI Audiobook Studio</Text>
        <Text style={styles.subtitle}>
          Transform any content into lifelike speech
        </Text>
      </View>

      <View style={styles.methodsContainer}>
        <MethodButton
          icon={<TextIcon size={24} color={Colors.black} />}
          title="Text Input"
          description="Type or paste your text directly"
          tag="Instant"
          onPress={() => handleMethodSelect(InputMethod.TEXT)}
          isSelected={inputMethod === InputMethod.TEXT}
        />
        <MethodButton
          icon={<FileUp size={24} color={Colors.black} />}
          title="Upload File"
          description="DOCX, PDF, or TXT files"
          tag="Smart"
          onPress={handleFileInput}
          isSelected={inputMethod === InputMethod.FILE}
          isLoading={isProcessingFile}
        />
        <MethodButton
          icon={<LinkIcon size={24} color={Colors.black} />}
          title="From URL"
          description="Extract content from any webpage"
          tag="Auto"
          onPress={handleUrlInput}
          isSelected={inputMethod === InputMethod.URL}
        />
      </View>

      {inputMethod && (
        <View style={styles.inputSection}>
          {inputMethod === InputMethod.TEXT && (
            <Input
              label="Text to convert"
              placeholder="Enter or paste your text here..."
              value={text}
              onChangeText={setText}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              inputStyle={styles.textArea}
              labelStyle={styles.inputLabel}
            />
          )}
          {inputMethod === InputMethod.FILE && selectedFile && (
            <View style={styles.fileInfo}>
              <Text style={styles.inputLabel}>Selected File</Text>
              <Text style={styles.fileName} numberOfLines={1}>
                {selectedFile}
              </Text>
            </View>
          )}
          {inputMethod === InputMethod.URL && (
            <Input
              label="Article URL"
              placeholder="https://example.com/article"
              value={url}
              onChangeText={setUrl}
              keyboardType="url"
              labelStyle={styles.inputLabel}
            />
          )}
          <Input
            label="Audiobook Title"
            placeholder="Enter a title for your audiobook"
            value={title}
            onChangeText={setTitle}
            labelStyle={styles.inputLabel}
            containerStyle={{ marginTop: Layout.spacing.md }}
          />
          <Button
            title="Next: Choose Voice"
            onPress={handleNext}
            fullWidth
            style={styles.nextButton}
            icon={<Mic size={18} color={Colors.white} />}
            loading={isCreating}
          />
        </View>
      )}

      <View style={styles.tipContainer}>
        <Text style={styles.tipTitle}>Tips for best results:</Text>
        <Text style={styles.tipText}>
          • Use proper punctuation for natural pauses
        </Text>
        <Text style={styles.tipText}>• Mark dialogue with quotation marks</Text>
        <Text style={styles.tipText}>• Check for spelling errors</Text>
      </View>
    </ScrollView>
  );
}

const MethodButton = ({
  icon,
  title,
  description,
  tag,
  onPress,
  isSelected,
  isLoading,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
  onPress: () => void;
  isSelected: boolean;
  isLoading?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    style={[styles.methodButton, isSelected && styles.selectedMethodButton]}
    disabled={isLoading}
  >
    <View style={styles.methodIcon}>{icon}</View>
    <View style={styles.methodTextContainer}>
      <View style={styles.methodTitleContainer}>
        <Text style={styles.methodTitle}>{title}</Text>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      </View>
      <Text style={styles.methodDesc}>{description}</Text>
    </View>
    {isLoading ? (
      <ActivityIndicator color={Colors.black} />
    ) : (
      <ChevronRight size={20} color={Colors.gray[400]} />
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softCream,
  },
  content: {
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.xl * 2,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.softCream,
  },
  loadingText: {
    marginTop: Layout.spacing.sm,
    fontSize: 16,
    color: Colors.gray[600],
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
    paddingTop: Layout.spacing.lg,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.white,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  aiBadgeText: {
    color: Colors.gray[600],
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  methodsContainer: {
    marginBottom: Layout.spacing.lg,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Layout.spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    shadowColor: Colors.gray[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedMethodButton: {
    borderColor: Colors.orange,
    backgroundColor: Colors.lightPeach,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.softCream,
    marginRight: Layout.spacing.md,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  tag: {
    marginLeft: Layout.spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.orange,
  },
  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.white,
  },
  methodDesc: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  inputSection: {
    backgroundColor: Colors.white,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.sm,
  },
  textArea: {
    minHeight: 120,
    backgroundColor: Colors.gray[100],
    borderColor: Colors.gray[300],
    color: Colors.black,
  },
  fileInfo: {
    marginBottom: Layout.spacing.md,
  },
  fileName: {
    color: Colors.black,
    fontSize: 16,
    backgroundColor: Colors.gray[100],
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
  },
  nextButton: {
    marginTop: Layout.spacing.lg,
    backgroundColor: Colors.orange,
  },
  tipContainer: {
    marginTop: Layout.spacing.lg,
    padding: Layout.spacing.md,
    backgroundColor: Colors.lightPeach,
    borderRadius: Layout.borderRadius.md,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Layout.spacing.sm,
  },
  tipText: {
    fontSize: 14,
    color: Colors.gray[700],
    marginBottom: Layout.spacing.xs,
    lineHeight: 20,
  },
});
