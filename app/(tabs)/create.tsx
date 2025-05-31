import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { FileUp, Mic, Link as LinkIcon, Text as TextIcon } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useCreateAudiobook } from '../../hooks/useCreateAudiobook';

enum InputMethod {
  TEXT = 'text',
  FILE = 'file',
  URL = 'url',
}

export default function CreateScreen() {
  const router = useRouter();
  const { create, isLoading, error: createError } = useCreateAudiobook();
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
        type: ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        return;
      }
      
      const file = result.assets[0];
      setSelectedFile(file.name);
      setInputMethod(InputMethod.FILE);

      // Read file content
      const response = await fetch(file.uri);
      const text = await response.text();
      setText(text);
    } catch (error) {
      Alert.alert('Error', 'Could not read file');
    }
  };
  
  const handleUrlInput = () => {
    setInputMethod(InputMethod.URL);
  };
  
  const handleNext = async () => {
    try {
      // Validate inputs
      if (inputMethod === InputMethod.TEXT && !text) {
        Alert.alert('Error', 'Please enter some text');
        return;
      }
      
      if (inputMethod === InputMethod.URL && !url) {
        Alert.alert('Error', 'Please enter a valid URL');
        return;
      }
      
      if (!title) {
        Alert.alert('Error', 'Please enter a title for your audiobook');
        return;
      }

      // Create the audiobook in Supabase
      const audiobook = await create({
        title,
        textContent: text,
      });

      // Navigate to voice selection with the new audiobook ID
      router.push({
        pathname: '/voice',
        params: {
          id: audiobook.id,
          title: encodeURIComponent(title),
          text: encodeURIComponent(text),
        },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
              style={styles.textInput}
            />
          </View>
        );
      
      case InputMethod.FILE:
        return (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Selected File</Text>
            <View style={styles.fileContainer}>
              <Text style={styles.fileName}>{selectedFile || 'No file selected'}</Text>
              <Button
                title="Change"
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
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Create New Audiobook</Text>
        <Text style={styles.subtitle}>Choose a method to input your text</Text>
      </View>
      
      <View style={styles.methodsContainer}>
        <Card 
          style={[
            styles.methodCard,
            inputMethod === InputMethod.TEXT && styles.selectedMethodCard
          ]}
          onPress={handleTextInput}
        >
          <View style={styles.methodIcon}>
            <TextIcon size={24} color={Colors.black} />
          </View>
          <Text style={styles.methodTitle}>Enter Text</Text>
          <Text style={styles.methodDesc}>Type or paste text directly</Text>
        </Card>
        
        <Card 
          style={[
            styles.methodCard,
            inputMethod === InputMethod.FILE && styles.selectedMethodCard
          ]}
          onPress={handleFileInput}
        >
          <View style={styles.methodIcon}>
            <FileUp size={24} color={Colors.black} />
          </View>
          <Text style={styles.methodTitle}>Upload File</Text>
          <Text style={styles.methodDesc}>PDF, DOCX, or TXT files</Text>
        </Card>
        
        <Card 
          style={[
            styles.methodCard,
            inputMethod === InputMethod.URL && styles.selectedMethodCard
          ]}
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
          />
        </>
      )}
      
      <View style={styles.tipContainer}>
        <Text style={styles.tipTitle}>Tips for best results:</Text>
        <Text style={styles.tipText}>• Use proper punctuation for natural pauses</Text>
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
    paddingBottom: Layout.spacing.xxl,
  },
  header: {
    marginBottom: Layout.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
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
    width: '30%',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
  },
  selectedMethodCard: {
    borderWidth: 2,
    borderColor: Colors.black,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.lightPeach,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
    textAlign: 'center',
  },
  methodDesc: {
    fontSize: 12,
    color: Colors.gray[500],
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: Layout.spacing.md,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: Layout.spacing.xs,
    color: Colors.black,
  },
  textInput: {
    height: 200,
  },
  fileContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: Colors.black,
    marginRight: Layout.spacing.sm,
  },
  titleContainer: {
    marginBottom: Layout.spacing.lg,
  },
  nextButton: {
    marginBottom: Layout.spacing.xl,
  },
  tipContainer: {
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
    color: Colors.black,
    marginBottom: 4,
  },
});