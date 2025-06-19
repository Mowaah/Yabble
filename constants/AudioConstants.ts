export const AUDIO_CONSTANTS = {
  // Audio timing
  STATUS_CHECK_INTERVAL_PLAYER: 500, // ms - More frequent for main player
  STATUS_CHECK_INTERVAL_CARD: 1000, // ms - Less frequent for library cards
  INITIAL_STATUS_CHECK_DELAY: 1500, // ms - Initial delay before first status check

  // Audio end detection
  END_THRESHOLD_MS: 100, // ms - Consider audio finished if within 100ms of end
  RESTART_THRESHOLD_MS: 1000, // ms - Consider position "at end" for restart logic

  // Navigation delays
  NAVIGATION_DELAY: 500, // ms - Delay before navigation after audio completion

  // Volume settings
  DEFAULT_VOICE_VOLUME: 0.5,
  DEFAULT_BACKGROUND_VOLUME: 0.3,

  // Progress stages
  PROGRESS_STAGES: {
    TEXT_ONLY: 1,
    TEXT_AND_VOICE: 2,
    COMPLETE: 3,
    TOTAL: 3,
  } as const,

  // Auto-fix settings
  AUTO_FIX_DELAY: 3000, // ms - Delay before running auto-fix
  REFRESH_DEBOUNCE: 100, // ms - Debounce library refresh
} as const;

export const AUDIO_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  PLAYING: 'playing',
  PAUSED: 'paused',
  FINISHED: 'finished',
  ERROR: 'error',
} as const;

export type AudioState = (typeof AUDIO_STATES)[keyof typeof AUDIO_STATES];
