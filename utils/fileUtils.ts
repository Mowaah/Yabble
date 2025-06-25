import * as FileSystem from 'expo-file-system';

export class FilePreparationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FilePreparationError';
  }
}

/**
 * Prepares an audio file by ensuring it is available locally in the app's cache directory.
 * It handles data URIs by writing them to a file, and downloads HTTP/S URLs.
 * Checks cache first to avoid redundant operations.
 *
 * @param audioUrl The URL of the audio (can be a data URI or HTTP/S URL).
 * @param title The title of the audiobook, used for naming the cached file.
 * @param operationName A string to identify the operation (e.g., 'sharing', 'download') for logging.
 * @returns A promise that resolves with the local file URI (string) if successful.
 * @throws {FilePreparationError} If the audio URL is missing, or if any file operation fails.
 */
export const prepareAudioFile = async (
  audioUrl: string | undefined | null,
  title: string,
  operationName: string
): Promise<string> => {
  if (!audioUrl) {
    console.error(`Audio URL missing for ${operationName} for title: ${title}`);
    throw new FilePreparationError(`Audio not available for ${operationName}.`);
  }

  const fileName = `${title.replace(/[^a-zA-Z0-9\s]/g, '_')}.mp3`;
  const localFileUri = FileSystem.cacheDirectory + fileName;

  const fileInfo = await FileSystem.getInfoAsync(localFileUri);
  if (fileInfo.exists) {
    console.log(`File already cached for ${operationName}: ${localFileUri}`);
    return localFileUri;
  }

  if (audioUrl.startsWith('data:')) {
    try {
      const base64Data = audioUrl.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid Data URI format: Missing Base64 data.');
      }
      await FileSystem.writeAsStringAsync(localFileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log(`File written from Data URI for ${operationName}: ${localFileUri}`);
      return localFileUri;
    } catch (e: any) {
      console.error(`Error writing Data URI for ${operationName} (${title}):`, e);
      throw new FilePreparationError(`Failed to prepare audio from Data URI: ${e.message}`);
    }
  } else {
    try {
      const downloadResult = await FileSystem.downloadAsync(audioUrl, localFileUri);
      if (downloadResult.status !== 200) {
        console.error(`Download failed for ${operationName} (${title}): Status ${downloadResult.status}`);
        throw new FilePreparationError(
          `Failed to download audio for ${operationName}. Status: ${downloadResult.status}`
        );
      }
      console.log(`File downloaded for ${operationName} (${title}): ${downloadResult.uri}`);
      return downloadResult.uri; // Use the URI from downloadResult
    } catch (e: any) {
      console.error(`Error downloading audio for ${operationName} (${title}):`, e);
      throw new FilePreparationError(`Failed to download audio: ${e.message}`);
    }
  }
};

/**
 * Checks if a file is a DOCX file
 * @param mimeType The MIME type of the file
 * @param fileName The name of the file
 * @returns boolean
 */
export const isDOCXFile = (mimeType?: string, fileName?: string): boolean => {
  const docxMimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];

  if (mimeType && docxMimeTypes.includes(mimeType)) {
    return true;
  }

  if (fileName && (fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc'))) {
    return true;
  }

  return false;
};

/**
 * Checks if a file is a PDF file
 * @param mimeType The MIME type of the file
 * @param fileName The name of the file
 * @returns boolean
 */
export const isPDFFile = (mimeType?: string, fileName?: string): boolean => {
  if (mimeType === 'application/pdf') {
    return true;
  }

  if (fileName && fileName.toLowerCase().endsWith('.pdf')) {
    return true;
  }

  return false;
};

/**
 * Checks if a file is a plain text file
 * @param mimeType The MIME type of the file
 * @param fileName The name of the file
 * @returns boolean
 */
export const isTextFile = (mimeType?: string, fileName?: string): boolean => {
  if (mimeType === 'text/plain') {
    return true;
  }

  if (fileName && fileName.toLowerCase().endsWith('.txt')) {
    return true;
  }

  return false;
};

/**
 * Gets a user-friendly file type description
 * @param mimeType The MIME type of the file
 * @param fileName The name of the file
 * @returns string
 */
export const getFileTypeDescription = (mimeType?: string, fileName?: string): string => {
  if (isDOCXFile(mimeType, fileName)) {
    return 'Word Document';
  }

  if (isPDFFile(mimeType, fileName)) {
    return 'PDF Document';
  }

  if (isTextFile(mimeType, fileName)) {
    return 'Text File';
  }

  return 'Document';
};
