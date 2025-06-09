import { Audio } from 'expo-av';

interface AudioManager {
  backgroundMusic: Audio.Sound | null;
  voiceAudio: Audio.Sound | null;
  volume: number;
  backgroundVolume: number;
  isInitialized: boolean;
}

class AudioEffectsManager {
  private static instance: AudioEffectsManager;
  private manager: AudioManager = {
    backgroundMusic: null,
    voiceAudio: null,
    volume: 0.5,
    backgroundVolume: 0.3, // Lower volume for background
    isInitialized: false,
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
      console.error(
        'AudioEffectsManager: Error initializing audio mode:',
        error
      );
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
          console.warn(
            'AudioEffectsManager: Warning unloading existing background music:',
            error
          );
        }
        this.manager.backgroundMusic = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          isLooping: true, // Ensure background music loops
          volume: this.manager.backgroundVolume,
          shouldPlay: false,
        }
      );

      this.manager.backgroundMusic = sound;
    } catch (error) {
      console.error(
        'AudioEffectsManager: Error loading background music:',
        error
      );
      throw error;
    }
  }

  async loadVoiceAudio(uri: string): Promise<void> {
    try {
      await this.ensureInitialized();

      // Safely unload any existing voice audio
      if (this.manager.voiceAudio) {
        try {
          const status = await this.manager.voiceAudio.getStatusAsync();
          if (status.isLoaded) {
            await this.manager.voiceAudio.stopAsync();
          }
          await this.manager.voiceAudio.unloadAsync();
        } catch (error) {
          console.warn(
            'AudioEffectsManager: Warning unloading existing voice audio:',
            error
          );
        }
        this.manager.voiceAudio = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          isLooping: false, // Voice audio should not loop
          volume: this.manager.volume,
          shouldPlay: false,
        }
      );

      this.manager.voiceAudio = sound;
    } catch (error) {
      console.error('AudioEffectsManager: Error loading voice audio:', error);
      throw error;
    }
  }

  async playBackgroundMusic(): Promise<void> {
    try {
      if (this.manager.backgroundMusic) {
        await this.manager.backgroundMusic.playAsync();
      }
    } catch (error) {
      console.error(
        'AudioEffectsManager: Error playing background music:',
        error
      );
      throw error;
    }
  }

  async playVoiceAudio(): Promise<void> {
    try {
      if (this.manager.voiceAudio) {
        // Set up completion handler for voice-only playback
        this.manager.voiceAudio.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            this.stopBackgroundMusic();
          }
        });

        await this.manager.voiceAudio.playAsync();
      }
    } catch (error) {
      console.error('AudioEffectsManager: Error playing voice audio:', error);
      throw error;
    }
  }

  async playMixedAudio(): Promise<void> {
    try {
      // Start background music first if available (it will loop)
      if (this.manager.backgroundMusic) {
        await this.manager.backgroundMusic.playAsync();
      }

      // Start voice audio and make it the master for duration
      if (this.manager.voiceAudio) {
        // Set up voice audio completion handler to stop background music
        this.manager.voiceAudio.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            // When voice audio finishes, stop background music immediately
            this.stopBackgroundMusic();
          }
        });

        // Start voice audio slightly after to ensure background is playing
        setTimeout(async () => {
          if (this.manager.voiceAudio) {
            await this.manager.voiceAudio.playAsync();
          }
        }, 100);
      } else if (this.manager.backgroundMusic) {
        // If only background music, don't loop indefinitely in preview
        this.manager.backgroundMusic.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            // For preview mode, stop after one loop if no voice
            this.stopBackgroundMusic();
          }
        });
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
        if (status.isLoaded) {
          await this.manager.backgroundMusic.stopAsync();
        }
      }
    } catch (error) {
      // Silently handle errors for sounds that are not loaded or in inconsistent state
      console.warn(
        'AudioEffectsManager: Background music stop warning:',
        error
      );
    }
  }

  async stopVoiceAudio(): Promise<void> {
    try {
      if (this.manager.voiceAudio) {
        const status = await this.manager.voiceAudio.getStatusAsync();
        if (status.isLoaded) {
          await this.manager.voiceAudio.stopAsync();
        }
      }
    } catch (error) {
      // Silently handle errors for sounds that are not loaded or in inconsistent state
      console.warn('AudioEffectsManager: Voice audio stop warning:', error);
    }
  }

  async stopAllAudio(): Promise<void> {
    // Use Promise.allSettled to continue even if one fails
    const results = await Promise.allSettled([
      this.stopBackgroundMusic(),
      this.stopVoiceAudio(),
    ]);

    // Only log if there are actual errors (not just warnings)
    const errors = results.filter((result) => result.status === 'rejected');
    if (errors.length > 0) {
      console.warn(
        'AudioEffectsManager: Some audio stop operations had warnings'
      );
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
      console.error(
        'AudioEffectsManager: Error setting background volume:',
        error
      );
      throw error;
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
      if (this.manager.backgroundMusic) {
        await this.manager.backgroundMusic.unloadAsync();
        this.manager.backgroundMusic = null;
      }
      if (this.manager.voiceAudio) {
        await this.manager.voiceAudio.unloadAsync();
        this.manager.voiceAudio = null;
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
  }> {
    try {
      let voiceIsPlaying = false;
      let backgroundIsPlaying = false;
      let voicePosition = 0;
      let voiceDuration = 0;

      if (this.manager.voiceAudio) {
        const voiceStatus = await this.manager.voiceAudio.getStatusAsync();
        if (voiceStatus.isLoaded) {
          voiceIsPlaying = voiceStatus.isPlaying || false;
          voicePosition = voiceStatus.positionMillis || 0;
          voiceDuration = voiceStatus.durationMillis || 0;
        }
      }

      if (this.manager.backgroundMusic) {
        const backgroundStatus =
          await this.manager.backgroundMusic.getStatusAsync();
        if (backgroundStatus.isLoaded) {
          backgroundIsPlaying = backgroundStatus.isPlaying || false;
        }
      }

      return {
        voiceIsPlaying,
        backgroundIsPlaying,
        voicePosition,
        voiceDuration,
      };
    } catch (error) {
      console.error(
        'AudioEffectsManager: Error getting playback status:',
        error
      );
      return {
        voiceIsPlaying: false,
        backgroundIsPlaying: false,
        voicePosition: 0,
        voiceDuration: 0,
      };
    }
  }

  static getInstance(): AudioEffectsManager {
    if (!AudioEffectsManager.instance) {
      AudioEffectsManager.instance = new AudioEffectsManager();
    }
    return AudioEffectsManager.instance;
  }
}

export const audioEffects = AudioEffectsManager.getInstance();
