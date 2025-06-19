import { Audio } from 'expo-av';
import { AUDIO_CONSTANTS } from '../constants/AudioConstants';

interface AudioManager {
  backgroundMusic: Audio.Sound | null;
  voiceAudio: Audio.Sound | null;
  volume: number;
  backgroundVolume: number;
  isInitialized: boolean;
  currentVoiceUrl: string | null;
  isPlaying: boolean;
}

class AudioEffectsManager {
  private static instance: AudioEffectsManager;
  private manager: AudioManager = {
    backgroundMusic: null,
    voiceAudio: null,
    volume: AUDIO_CONSTANTS.DEFAULT_VOICE_VOLUME,
    backgroundVolume: AUDIO_CONSTANTS.DEFAULT_BACKGROUND_VOLUME,
    isInitialized: false,
    currentVoiceUrl: null,
    isPlaying: false,
  };

  private constructor() {
    this.initializeAudio();
  }

  private async initializeAudio(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.manager.isInitialized = true;
    } catch (error) {
      console.error('AudioEffectsManager: Error initializing audio mode:', error);
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.manager.isInitialized) {
      await this.initializeAudio();
    }
  }

  async loadBackgroundMusic(uri: string): Promise<void> {
    try {
      await this.ensureInitialized();

      // Safely unload any existing background music
      if (this.manager.backgroundMusic) {
        try {
          const status = await this.manager.backgroundMusic.getStatusAsync();
          if (status.isLoaded) {
            await this.manager.backgroundMusic.stopAsync();
          }
          await this.manager.backgroundMusic.unloadAsync();
        } catch (error) {
          console.warn('AudioEffectsManager: Warning unloading existing background music:', error);
        }
        this.manager.backgroundMusic = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          isLooping: true,
          volume: this.manager.backgroundVolume,
          shouldPlay: false,
        }
      );

      this.manager.backgroundMusic = sound;
    } catch (error) {
      console.error('AudioEffectsManager: Error loading background music:', error);
      throw error;
    }
  }

  async loadVoiceAudio(url: string): Promise<void> {
    try {
      await this.ensureInitialized();

      // If same URL is already loaded, don't reload
      if (this.manager.voiceAudio && this.manager.currentVoiceUrl === url) {
        return;
      }

      // Clean up existing voice audio
      if (this.manager.voiceAudio) {
        try {
          await this.manager.voiceAudio.unloadAsync();
        } catch (error) {
          console.warn('Error unloading existing voice audio:', error);
        }
        this.manager.voiceAudio = null;
        this.manager.currentVoiceUrl = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        {
          isLooping: false,
          volume: this.manager.volume,
          shouldPlay: false,
        }
      );

      this.manager.voiceAudio = sound;
      this.manager.currentVoiceUrl = url;
      this.manager.isPlaying = false;

      // Set up a single, clean event handler
      this.manager.voiceAudio.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          // Update playing state based on actual audio status
          this.manager.isPlaying = status.isPlaying || false;

          // When voice finishes, stop background music and reset state
          if (status.didJustFinish) {
            this.manager.isPlaying = false;
            this.stopBackgroundMusic().catch(console.error);
          }
        }
      });
    } catch (error) {
      console.error('Error loading voice audio:', error);
      throw error;
    }
  }

  async playBackgroundMusic(): Promise<void> {
    try {
      if (this.manager.backgroundMusic) {
        await this.manager.backgroundMusic.setVolumeAsync(this.manager.backgroundVolume);
        await this.manager.backgroundMusic.playAsync();
      }
    } catch (error) {
      console.error('AudioEffectsManager: Error playing background music:', error);
      throw error;
    }
  }

  async playVoiceAudio(): Promise<void> {
    try {
      if (this.manager.voiceAudio) {
        await this.manager.voiceAudio.setVolumeAsync(this.manager.volume);
        await this.manager.voiceAudio.playAsync();
        this.manager.isPlaying = true;
      }
    } catch (error) {
      console.error('AudioEffectsManager: Error playing voice audio:', error);
      throw error;
    }
  }

  async playMixedAudio(): Promise<void> {
    try {
      // Start background music first if available
      if (this.manager.backgroundMusic) {
        await this.playBackgroundMusic();
      }

      // Start voice audio
      if (this.manager.voiceAudio) {
        await this.playVoiceAudio();
      }
    } catch (error) {
      console.error('AudioEffectsManager: Error playing mixed audio:', error);
      throw error;
    }
  }

  async stopBackgroundMusic(): Promise<void> {
    try {
      if (this.manager.backgroundMusic) {
        const status = await this.manager.backgroundMusic.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await this.manager.backgroundMusic.stopAsync();
        }
      }
    } catch (error) {
      console.warn('AudioEffectsManager: Background music stop warning:', error);
    }
  }

  async stopVoiceAudio(): Promise<void> {
    try {
      if (this.manager.voiceAudio) {
        const status = await this.manager.voiceAudio.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await this.manager.voiceAudio.stopAsync();
        }
        this.manager.isPlaying = false;
      }
    } catch (error) {
      console.warn('AudioEffectsManager: Voice audio stop warning:', error);
    }
  }

  async stopAllAudio(): Promise<void> {
    try {
      this.manager.isPlaying = false;

      if (this.manager.voiceAudio) {
        await this.manager.voiceAudio.unloadAsync();
        this.manager.voiceAudio = null;
        this.manager.currentVoiceUrl = null;
      }
      if (this.manager.backgroundMusic) {
        await this.manager.backgroundMusic.unloadAsync();
        this.manager.backgroundMusic = null;
      }
    } catch (error) {
      console.error('AudioEffectsManager: Error stopping all audio:', error);
      throw error;
    }
  }

  async setVolume(volume: number): Promise<void> {
    try {
      this.manager.volume = volume;
      if (this.manager.voiceAudio) {
        await this.manager.voiceAudio.setVolumeAsync(volume);
      }
    } catch (error) {
      console.error('AudioEffectsManager: Error setting volume:', error);
      throw error;
    }
  }

  async setBackgroundVolume(volume: number): Promise<void> {
    try {
      this.manager.backgroundVolume = volume;
      if (this.manager.backgroundMusic) {
        await this.manager.backgroundMusic.setVolumeAsync(volume);
      }
    } catch (error) {
      console.error('AudioEffectsManager: Error setting background volume:', error);
      throw error;
    }
  }

  async seekVoice(positionMillis: number): Promise<void> {
    if (this.manager.voiceAudio) {
      try {
        const status = await this.manager.voiceAudio.getStatusAsync();
        if (status.isLoaded) {
          const wasPlaying = status.isPlaying;

          // Seek to the new position
          await this.manager.voiceAudio.setPositionAsync(positionMillis);

          // If audio was paused before seeking, make sure it stays paused
          if (!wasPlaying && !this.manager.isPlaying) {
            await this.manager.voiceAudio.pauseAsync();
          }
        }
      } catch (error) {
        console.error('AudioEffectsManager: Error seeking voice audio:', error);
      }
    }
  }

  async setRate(rate: number): Promise<void> {
    if (this.manager.voiceAudio) {
      try {
        await this.manager.voiceAudio.setRateAsync(rate, true);
      } catch (error) {
        console.error('AudioEffectsManager: Error setting playback rate:', error);
      }
    }
  }

  getVolume(): number {
    return this.manager.volume;
  }

  getBackgroundVolume(): number {
    return this.manager.backgroundVolume;
  }

  async cleanup(): Promise<void> {
    try {
      this.manager.isPlaying = false;
      if (this.manager.backgroundMusic) {
        await this.manager.backgroundMusic.unloadAsync();
        this.manager.backgroundMusic = null;
      }
      if (this.manager.voiceAudio) {
        await this.manager.voiceAudio.unloadAsync();
        this.manager.voiceAudio = null;
        this.manager.currentVoiceUrl = null;
      }
    } catch (error) {
      console.error('AudioEffectsManager: Error cleaning up audio:', error);
      throw error;
    }
  }

  async getPlaybackStatus(): Promise<{
    voiceIsPlaying: boolean;
    backgroundIsPlaying: boolean;
    voicePosition?: number;
    voiceDuration?: number;
    hasFinished?: boolean;
  }> {
    try {
      let voiceIsPlaying = this.manager.isPlaying;
      let backgroundIsPlaying = false;
      let voicePosition = 0;
      let voiceDuration = 0;
      let hasFinished = false;

      if (this.manager.voiceAudio) {
        const voiceStatus = await this.manager.voiceAudio.getStatusAsync();
        if (voiceStatus.isLoaded) {
          // Trust the actual audio status over our cached state
          voiceIsPlaying = voiceStatus.isPlaying || false;
          this.manager.isPlaying = voiceIsPlaying; // Update cached state
          voicePosition = voiceStatus.positionMillis || 0;
          voiceDuration = voiceStatus.durationMillis || 0;

          // Improved audio finish detection logic
          hasFinished =
            voiceStatus.didJustFinish ||
            (voiceDuration > 0 && voicePosition >= voiceDuration - AUDIO_CONSTANTS.END_THRESHOLD_MS);
        }
      }

      if (this.manager.backgroundMusic) {
        const backgroundStatus = await this.manager.backgroundMusic.getStatusAsync();
        if (backgroundStatus.isLoaded) {
          backgroundIsPlaying = backgroundStatus.isPlaying || false;
        }
      }

      return {
        voiceIsPlaying,
        backgroundIsPlaying,
        voicePosition,
        voiceDuration,
        hasFinished,
      };
    } catch (error) {
      console.error('AudioEffectsManager: Error getting playback status:', error);
      return {
        voiceIsPlaying: false,
        backgroundIsPlaying: false,
        voicePosition: 0,
        voiceDuration: 0,
        hasFinished: false,
      };
    }
  }

  async pauseAudio(): Promise<void> {
    try {
      this.manager.isPlaying = false;
      const promises = [];
      if (this.manager.voiceAudio) {
        promises.push(this.manager.voiceAudio.pauseAsync());
      }
      if (this.manager.backgroundMusic) {
        promises.push(this.manager.backgroundMusic.pauseAsync());
      }
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('AudioEffectsManager: Error pausing audio:', error);
    }
  }

  async resumeAudio(): Promise<void> {
    try {
      // Check if audio is actually loaded and paused before resuming
      if (this.manager.voiceAudio) {
        const voiceStatus = await this.manager.voiceAudio.getStatusAsync();
        if (voiceStatus.isLoaded && !voiceStatus.isPlaying) {
          await this.manager.voiceAudio.playAsync();
          this.manager.isPlaying = true;
        }
      }

      if (this.manager.backgroundMusic) {
        const bgStatus = await this.manager.backgroundMusic.getStatusAsync();
        if (bgStatus.isLoaded && !bgStatus.isPlaying) {
          await this.manager.backgroundMusic.playAsync();
        }
      }
    } catch (error) {
      console.error('AudioEffectsManager: Error resuming audio:', error);
      this.manager.isPlaying = false;
    }
  }

  getCurrentVoiceUrl(): string | null {
    return this.manager.currentVoiceUrl;
  }

  // Helper method to check if audio is currently playing
  isCurrentlyPlaying(): boolean {
    return this.manager.isPlaying;
  }

  static getInstance(): AudioEffectsManager {
    if (!AudioEffectsManager.instance) {
      AudioEffectsManager.instance = new AudioEffectsManager();
    }
    return AudioEffectsManager.instance;
  }
}

export const audioEffects = AudioEffectsManager.getInstance();
