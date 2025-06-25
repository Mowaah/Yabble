import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Image as ImageIcon, Save, CheckCircle2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Colors from '../../../constants/Colors';
import Layout from '../../../constants/Layout';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { getAudiobook, updateAudiobook } from '../../../lib/database';
import { uploadFile } from '../../../lib/storage';
import { useAuth } from '../../../contexts/AuthContext';

export default function EditAudiobookScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const [book, setBook] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchBook = async () => {
        setIsLoading(true);
        const { data, error } = await getAudiobook(id as string);
        if (error) {
          Alert.alert('Error', 'Could not fetch audiobook details.');
          router.back();
        } else if (data) {
          setBook(data);
          setTitle(data.title);
          setCoverImage(data.cover_image_url);
        }
        setIsLoading(false);
      };
      fetchBook();
    }
  }, [id]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewImage(result.assets[0]);
      setCoverImage(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    if (!book || !session?.user) return;

    setIsUpdating(true);
    let newCoverUrl = book.cover_image_url;

    try {
      if (newImage) {
        newCoverUrl = await uploadFile('cover-images', newImage.uri, `${session.user.id}/${Date.now()}.jpg`);
      }

      const { error } = await updateAudiobook(book.id, {
        title: title,
        cover_image: newCoverUrl,
      });

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Audiobook updated successfully.');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update audiobook.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.loadingIndicator} size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Audiobook</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Title</Text>
        <Input
          placeholder="e.g., The Great Gatsby"
          value={title}
          onChangeText={setTitle}
          containerStyle={styles.inputContainer}
        />

        <Text style={styles.label}>Cover Image</Text>
        <Pressable style={styles.imagePicker} onPress={handlePickImage}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <ImageIcon size={48} color={Colors.gray[400]} />
              <Text style={styles.imagePlaceholderText}>Tap to add a cover image</Text>
            </View>
          )}
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Save Changes"
          onPress={handleUpdate}
          loading={isUpdating}
          disabled={isUpdating}
          icon={<Save size={18} color={Colors.white} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softBackground,
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
    fontWeight: '700',
    color: Colors.primary,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Layout.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: Layout.spacing.sm,
  },
  inputContainer: {
    marginBottom: Layout.spacing.lg,
  },
  imagePicker: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    padding: Layout.spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
});
