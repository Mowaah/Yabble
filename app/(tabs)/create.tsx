import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  FileUp,
  Mic,
  Link as LinkIcon,
  Text as TextIcon,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useCreateAudiobook } from '../../hooks/useCreateAudiobook';
import { useAuth } from '../../contexts/AuthContext';

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

  const handleTextInput = () => {
    setInputMethod(InputMethod.TEXT);
  };

  const handleFileInput = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/plain',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (
        result.canceled === true ||
        !result.assets ||
        result.assets.length === 0
      ) {
        return;
      }

      const asset = result.assets[0];
      setSelectedFile(asset.name);
      setInputMethod(InputMethod.FILE);

      const response = await fetch(asset.uri);
      const fileText = await response.text();
      setText(fileText);
    } catch (error) {
      console.error('File input error:', error);
      Alert.alert(
        'Error',
        'Could not read file. Please ensure it is a valid type and try again.'
      );
    }
  };

  const handleUrlInput = () => {
    setInputMethod(InputMethod.URL);
  };

  const handleNext = async () => {
    if (isAuthLoading) {
      Alert.alert('Authenticating', 'Please wait, checking your session.');
      return;
    }

    if (!authSession?.user?.id) {
      Alert.alert(
        'Authentication Error',
        'User not authenticated. Please sign in again.'
      );
      return;
    }

    if (!inputMethod) {
      Alert.alert(
        'Input Required',
        'Please select an input method (Text, File, or URL).'
      );
      return;
    }

    try {
      if (inputMethod === InputMethod.TEXT && !text.trim()) {
        Alert.alert('Input Error', 'Please enter some text for the audiobook.');
        return;
      }
      if (inputMethod === InputMethod.URL && !url.trim()) {
        Alert.alert('Input Error', 'Please enter a valid URL.');
        return;
      }
      if (inputMethod === InputMethod.FILE && !text.trim()) {
        Alert.alert(
          'File Error',
          'The selected file appears to be empty or could not be read.'
        );
        return;
      }
      if (!title.trim()) {
        Alert.alert('Input Error', 'Please enter a title for your audiobook.');
        return;
      }

      const audiobook = await create({
        title,
        textContent: JSON.stringify({
          originalText: text,
          backgroundEffect: null,
        }),
      });

      if (!audiobook) {
        Alert.alert(
          'Creation Failed',
          createError || 'Failed to create audiobook. Please try again later.'
        );
        return;
      }

      router.push({
        pathname: '/voice',
        params: {
          id: audiobook.id,
          title: encodeURIComponent(title),
          text: encodeURIComponent(text),
        },
      });
    } catch (error: any) {
      console.error('Create audiobook error in handleNext:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    }
  };

  const renderInputMethod = () => {
    switch (inputMethod) {
      case InputMethod.TEXT:
        return (
          <View style={styles.inputContainer}>
            <Input
              label="Text to convert"
              placeholder="Enter or paste your text here..."
              value={text}
              onChangeText={setText}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              inputStyle={{ minHeight: 120 }}
            />
          </View>
        );

      case InputMethod.FILE:
        return (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Selected File</Text>
            <View style={styles.fileContainer}>
              <Text
                style={styles.fileName}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {selectedFile || 'No file selected'}
              </Text>
              <Button
                title="Change File"
                size="sm"
                variant="outline"
                onPress={handleFileInput}
              />
            </View>
          </View>
        );

      case InputMethod.URL:
        return (
          <View style={styles.inputContainer}>
            <Input
              label="URL to extract text from"
              placeholder="https://example.com/article"
              value={url}
              onChangeText={setUrl}
              keyboardType="url"
              leftIcon={<LinkIcon size={18} color={Colors.gray[400]} />}
            />
          </View>
        );

      default:
        return null;
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
        <Text style={styles.title}>Create New Audiobook</Text>
        <Text style={styles.subtitle}>Choose a method to input your text</Text>
      </View>

      <View style={styles.methodsContainer}>
        <Card
          style={StyleSheet.flatten([
            styles.methodCard,
            inputMethod === InputMethod.TEXT && styles.selectedMethodCard,
          ])}
          onPress={handleTextInput}
        >
          <View style={styles.methodIcon}>
            <TextIcon size={24} color={Colors.black} />
          </View>
          <Text style={styles.methodTitle}>Enter Text</Text>
          <Text style={styles.methodDesc}>Type or paste text directly</Text>
        </Card>

        <Card
          style={StyleSheet.flatten([
            styles.methodCard,
            inputMethod === InputMethod.FILE && styles.selectedMethodCard,
          ])}
          onPress={handleFileInput}
        >
          <View style={styles.methodIcon}>
            <FileUp size={24} color={Colors.black} />
          </View>
          <Text style={styles.methodTitle}>Upload File</Text>
          <Text style={styles.methodDesc}>PDF, DOCX, or TXT files</Text>
        </Card>

        <Card
          style={StyleSheet.flatten([
            styles.methodCard,
            inputMethod === InputMethod.URL && styles.selectedMethodCard,
          ])}
          onPress={handleUrlInput}
        >
          <View style={styles.methodIcon}>
            <LinkIcon size={24} color={Colors.black} />
          </View>
          <Text style={styles.methodTitle}>From URL</Text>
          <Text style={styles.methodDesc}>Extract text from a website</Text>
        </Card>
      </View>

      {inputMethod && (
        <>
          {renderInputMethod()}

          <View style={styles.titleContainer}>
            <Input
              label="Audiobook Title"
              placeholder="Enter a title for your audiobook"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <Button
            title="Next: Choose Voice"
            onPress={handleNext}
            fullWidth
            style={styles.nextButton}
            icon={<Mic size={18} color={Colors.white} />}
            loading={isCreating}
          />
        </>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Layout.spacing.sm,
    fontSize: 16,
    color: Colors.gray[600],
  },
  header: {
    marginBottom: Layout.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  methodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.lg,
  },
  methodCard: {
    flex: 1,
    marginHorizontal: Layout.spacing.xs,
    padding: Layout.spacing.md,
    alignItems: 'center',
  },
  selectedMethodCard: {
    borderColor: Colors.black,
    borderWidth: 2,
  },
  methodIcon: {
    marginBottom: Layout.spacing.sm,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Layout.spacing.xs,
    textAlign: 'center',
  },
  methodDesc: {
    fontSize: 12,
    color: Colors.gray[500],
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: Layout.spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[700],
    marginBottom: Layout.spacing.xs,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  fileName: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
    marginRight: Layout.spacing.sm,
  },
  titleContainer: {
    marginBottom: Layout.spacing.lg,
  },
  nextButton: {
    marginTop: Layout.spacing.md,
  },
  tipContainer: {
    marginTop: Layout.spacing.xl,
    padding: Layout.spacing.md,
    backgroundColor: Colors.gray[100],
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
