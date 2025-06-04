import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export class MediaError extends Error {
  isPermissionError?: boolean;
  constructor(message: string, isPermissionError?: boolean) {
    super(message);
    this.name = 'MediaError';
    this.isPermissionError = isPermissionError;
  }
}

/**
 * Saves a local audio file URI to the device's media library (primarily for Android).
 * @param localFileUri The local file URI (e.g., from prepareAudioFile).
 * @param title The title of the audiobook (used if an album is created).
 * @throws {MediaError} If permissions are denied or saving fails.
 */
export const saveAudioToDevice = async (
  localFileUri: string,
  title: string
): Promise<void> => {
  if (Platform.OS !== 'android') {
    console.warn('saveAudioToDevice is primarily intended for Android.');
    // For other platforms, this function might do nothing or adapt.
    // For now, let's just return if not Android as iOS uses sharing for saving.
    return;
  }

  const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync(
    true
  );
  if (status !== 'granted') {
    const message = canAskAgain
      ? 'Storage permission is required to save the audiobook.'
      : 'Storage permission is needed. Please enable it in your app settings to save audiobooks.';
    throw new MediaError(message, true);
  }

  try {
    await MediaLibrary.createAssetAsync(localFileUri);
    console.log(`Asset created successfully for ${title} at ${localFileUri}`);
  } catch (e: any) {
    console.error(`Error saving audio to device for ${title}:`, e);
    throw new MediaError(
      `Failed to save "${title}" to your device's media library: ${e.message}`
    );
  }
};

/**
 * Shares a local audio file URI using the native sharing mechanism.
 * @param localFileUri The local file URI (e.g., from prepareAudioFile).
 * @param title The title for the shared content.
 * @param message Optional message to accompany the share.
 * @throws {MediaError} If sharing is unavailable or the sharing action fails.
 */
export const shareAudioFile = async (
  localFileUri: string,
  title: string,
  message?: string
): Promise<void> => {
  if (!(await Sharing.isAvailableAsync())) {
    throw new MediaError('Sharing is not available on this device.');
  }

  try {
    const shareOptions: Sharing.SharingOptions = {
      mimeType: 'audio/mpeg',
      dialogTitle: `Share: ${title}`,
      UTI: 'public.mp3', // Helps iOS identify MP3s
    };
    // Note: The actual message parameter for Share.shareAsync is not universally supported for file sharing.
    // The primary mechanism is sharing the file (localFileUri).
    // For compatibility, we can add the message to the dialogTitle or rely on user input in the share sheet.
    // The react-native Share API (not expo-sharing) has a `message` field, but expo-sharing is better for files.

    await Sharing.shareAsync(localFileUri, shareOptions);
    console.log(`Sharing initiated for ${title} from ${localFileUri}`);
  } catch (e: any) {
    console.error(`Error initiating share for ${title}:`, e);
    // Error might be due to user cancellation on some platforms, or actual error.
    throw new MediaError(
      `Failed to initiate sharing for "${title}": ${e.message}`
    );
  }
};
