import { AUDIO_CONSTANTS } from '../constants/AudioConstants';

export interface ProgressResult {
  stage: number;
  total: number;
  percentage: number;
}

export interface AudiobookData {
  status?: string;
  audio_url?: string;
  voice_id?: string;
  text_content?: string;
}

/**
 * Calculate audiobook progress based on completion stages
 * Stage 1: Text input (create screen)
 * Stage 2: Voice generation (voice screen)
 * Stage 3: Background audio selection (audio screen) → Status becomes 'completed'
 */
export function calculateAudiobookProgress(book: AudiobookData): ProgressResult {
  if (!book) {
    return { stage: 1, total: AUDIO_CONSTANTS.PROGRESS_STAGES.TOTAL, percentage: 33 };
  }

  // Parse text content to check for components
  let parsedContent: any = {};
  try {
    if (book.text_content) {
      parsedContent = JSON.parse(book.text_content);
    }
  } catch {
    // Invalid JSON, treat as no content
  }

  // Check each stage completion
  const hasText = !!(parsedContent.originalText && parsedContent.originalText.length > 10);
  const hasVoice = !!(book.audio_url && book.voice_id);
  const hasBackgroundSelection = parsedContent.hasOwnProperty('backgroundEffect');

  // Determine stage based on completed components
  if (!hasText) {
    return {
      stage: AUDIO_CONSTANTS.PROGRESS_STAGES.TEXT_ONLY,
      total: AUDIO_CONSTANTS.PROGRESS_STAGES.TOTAL,
      percentage: 33,
    };
  } else if (hasText && !hasVoice) {
    return {
      stage: AUDIO_CONSTANTS.PROGRESS_STAGES.TEXT_ONLY,
      total: AUDIO_CONSTANTS.PROGRESS_STAGES.TOTAL,
      percentage: 33,
    };
  } else if (hasText && hasVoice && !hasBackgroundSelection) {
    return {
      stage: AUDIO_CONSTANTS.PROGRESS_STAGES.TEXT_AND_VOICE,
      total: AUDIO_CONSTANTS.PROGRESS_STAGES.TOTAL,
      percentage: 67,
    };
  } else if (hasText && hasVoice && hasBackgroundSelection) {
    return {
      stage: AUDIO_CONSTANTS.PROGRESS_STAGES.COMPLETE,
      total: AUDIO_CONSTANTS.PROGRESS_STAGES.TOTAL,
      percentage: 100,
    };
  } else {
    // Fallback for edge cases
    return {
      stage: AUDIO_CONSTANTS.PROGRESS_STAGES.TEXT_ONLY,
      total: AUDIO_CONSTANTS.PROGRESS_STAGES.TOTAL,
      percentage: 33,
    };
  }
}

/**
 * Check if an audiobook should be auto-fixed from draft to completed status
 * Only fixes audiobooks that clearly went through the complete workflow
 */
export function shouldAutoFixStatus(book: AudiobookData): boolean {
  if (book.status !== 'draft') {
    return false;
  }

  const progress = calculateAudiobookProgress(book);
  return progress.stage === AUDIO_CONSTANTS.PROGRESS_STAGES.COMPLETE;
}

/**
 * Get the next screen URL for continuing a draft audiobook
 */
export function getDraftContinuationRoute(book: AudiobookData & { id: string }): string {
  const progress = calculateAudiobookProgress(book);

  switch (progress.stage) {
    case AUDIO_CONSTANTS.PROGRESS_STAGES.TEXT_ONLY:
      return `/voice?id=${book.id}&title=${encodeURIComponent(book.text_content || '')}&text=${encodeURIComponent(
        book.text_content || ''
      )}`;
    case AUDIO_CONSTANTS.PROGRESS_STAGES.TEXT_AND_VOICE:
      return `/audio?id=${book.id}`;
    default:
      // Should not happen for drafts, but fallback to library
      return '/library';
  }
}
