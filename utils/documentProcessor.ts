import { isDOCXFile, isPDFFile } from './fileUtils';
import mammoth from 'mammoth';
import { Buffer } from 'buffer';

export class DocumentProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentProcessingError';
  }
}

/**
 * Extracts text from DOCX files using mammoth
 * @param fileUri The local file URI of the DOCX file
 * @returns Promise<string> The extracted text content
 */
const extractTextFromDOCX = async (fileUri: string): Promise<string> => {
  try {
    // For React Native, we need to read the file as an ArrayBuffer
    const response = await fetch(fileUri);
    const arrayBuffer = await response.arrayBuffer();

    const result = await mammoth.extractRawText({ arrayBuffer });

    if (!result.value || result.value.trim().length === 0) {
      throw new DocumentProcessingError(
        'The DOCX file appears to be empty or contains no readable text'
      );
    }

    return result.value.trim();
  } catch (error: any) {
    console.error('DOCX text extraction error:', error);
    throw new DocumentProcessingError(
      `Failed to extract text from DOCX: ${error.message || 'Unknown error'}`
    );
  }
};

/**
 * Extracts text from a PDF file using ConvertAPI
 * @param fileUri The local file URI of the PDF file
 * @returns Promise<string> The extracted text content
 */
const extractTextFromPDF = async (fileUri: string): Promise<string> => {
  // IMPORTANT: This function requires a ConvertAPI secret.
  // Ensure you have EXPO_PUBLIC_CONVERT_API_SECRET in your .env file.
  const convertApiSecret = process.env.EXPO_PUBLIC_CONVERT_API_SECRET;

  if (!convertApiSecret) {
    throw new DocumentProcessingError(
      'ConvertAPI secret is not configured. Please add EXPO_PUBLIC_CONVERT_API_SECRET to your environment variables.'
    );
  }

  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: 'document.pdf',
    type: 'application/pdf',
  } as any);

  try {
    const response = await fetch(
      `https://v2.convertapi.com/convert/pdf/to/txt`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${convertApiSecret}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('ConvertAPI error response:', errorBody);
      throw new Error(
        `Failed to convert PDF. Status: ${
          response.status
        }. Response: ${errorBody.slice(0, 100)}`
      );
    }

    const result = await response.json();

    if (
      !result.Files ||
      result.Files.length === 0 ||
      !result.Files[0].FileData
    ) {
      throw new DocumentProcessingError(
        'The PDF file could not be converted or returned no content.'
      );
    }

    // The text content is returned as a Base64 encoded string in the FileData property
    const base64Text = result.Files[0].FileData;
    const textContent = Buffer.from(base64Text, 'base64').toString('utf8');

    if (!textContent || textContent.trim().length === 0) {
      throw new DocumentProcessingError(
        'The PDF file appears to be empty or contains no readable text after conversion'
      );
    }

    return textContent.trim();
  } catch (error: any) {
    console.error('PDF text extraction error (ConvertAPI):', error);
    throw new DocumentProcessingError(
      `Failed to extract text from PDF: ${error.message || 'Unknown error'}`
    );
  }
};

/**
 * Extracts text from plain text files
 * @param fileUri The local file URI of the text file
 * @returns Promise<string> The text content
 */
const extractTextFromPlainText = async (fileUri: string): Promise<string> => {
  try {
    const response = await fetch(fileUri);
    const text = await response.text();

    if (!text || text.trim().length === 0) {
      throw new DocumentProcessingError('The text file appears to be empty');
    }

    return text.trim();
  } catch (error: any) {
    console.error('Plain text extraction error:', error);
    throw new DocumentProcessingError(
      `Failed to read text file: ${error.message || 'Unknown error'}`
    );
  }
};

/**
 * Processes a document file and extracts text content
 * Supports DOCX, DOC, and plain text files
 * @param fileUri The local file URI
 * @param mimeType The MIME type of the file
 * @param fileName The name of the file
 * @returns Promise<string> The extracted text content
 * @throws {DocumentProcessingError} If processing fails
 */
export const processDocument = async (
  fileUri: string,
  mimeType?: string,
  fileName?: string
): Promise<string> => {
  try {
    // Determine file type and process accordingly
    if (isDOCXFile(mimeType, fileName)) {
      console.log('Processing DOCX file:', fileName);
      return await extractTextFromDOCX(fileUri);
    }

    if (isPDFFile(mimeType, fileName)) {
      console.log('Processing PDF file:', fileName);
      return await extractTextFromPDF(fileUri);
    }

    // Default to plain text processing
    console.log('Processing as plain text file:', fileName);
    return await extractTextFromPlainText(fileUri);
  } catch (error: any) {
    console.error('Document processing error:', error);

    if (error instanceof DocumentProcessingError) {
      throw error;
    }

    throw new DocumentProcessingError(
      `Failed to process document: ${error.message || 'Unknown error'}`
    );
  }
};

/**
 * Validates that the extracted text is suitable for text-to-speech
 * @param text The extracted text
 * @param minLength Minimum length required (default: 10 characters)
 * @param maxLength Maximum length allowed (default: 100,000 characters)
 * @returns boolean
 */
export const validateTextForTTS = (
  text: string,
  minLength: number = 10,
  maxLength: number = 100000
): { isValid: boolean; message?: string } => {
  if (!text || typeof text !== 'string') {
    return { isValid: false, message: 'No text content found' };
  }

  const trimmedText = text.trim();

  if (trimmedText.length < minLength) {
    return {
      isValid: false,
      message: `Text is too short (minimum ${minLength} characters required)`,
    };
  }

  if (trimmedText.length > maxLength) {
    return {
      isValid: false,
      message: `Text is too long (maximum ${maxLength} characters allowed)`,
    };
  }

  // Check if text contains mostly readable characters
  const readableChars = trimmedText.match(/[a-zA-Z0-9\s.,!?;:'"()\-]/g);
  const readableRatio = readableChars
    ? readableChars.length / trimmedText.length
    : 0;

  if (readableRatio < 0.7) {
    return {
      isValid: false,
      message: 'Text contains too many unreadable characters',
    };
  }

  return { isValid: true };
};
