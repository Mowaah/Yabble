import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Uploads a file to a specified Supabase Storage bucket.
 * @param bucket The name of the storage bucket (e.g., 'avatars', 'cover-images').
 * @param localUri The local file URI of the file to upload.
 * @param userId The ID of the user uploading the file.
 * @returns The public URL of the uploaded file.
 */
export const uploadFile = async (bucket: string, localUri: string, userId: string): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileExtension = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${userId}/${new Date().getTime()}.${fileExtension}`;
    const contentType = `image/${fileExtension === 'png' ? 'png' : 'jpeg'}`;

    const { data, error } = await supabase.storage.from(bucket).upload(filePath, decode(base64), { contentType });

    if (error) {
      throw new StorageError(`Failed to upload to bucket "${bucket}": ${error.message}`);
    }

    if (!data) {
      throw new StorageError('Upload succeeded but no data was returned.');
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new StorageError('Failed to get public URL for the uploaded file.');
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error(`Error in uploadFile to bucket "${bucket}":`, error);
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError('An unexpected error occurred during file upload.');
  }
};
