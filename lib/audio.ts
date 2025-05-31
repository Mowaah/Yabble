import { Audio } from 'expo-av';

interface AudioManager {
  backgroundMusic: Audio.Sound | null;
  volume: number;
}

class AudioEffectsManager {
  private static instance: AudioEffectsManager;
  private manager: AudioManager = {
    backgroundMusic: null,
    volume: 0.5,
  };

  private constructor() {}

  static getInstance(): AudioEffectsManager {
    if (!AudioEffectsManager.instance) {
      AudioEffectsManager.instance = new AudioEffectsManager();
    }
    return AudioEffectsManager.instance;
  }

  async loadBackgroundMusic(uri: string): Promise<void> {
    try {
      // Unload any existing background music
      if (this.manager.backgroundMusic) {
        await this.manager.backgroundMusic.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { 
          isLooping: true,
          volume: this.manager.volume,
          shouldPlay: false
        }
      );

      this.manager.backgroundMusic = sound;
    } catch (error) {
      console.error('Error loading background music:', error);
      throw error;
    }
  }

  async playBackgroundMusic(): Promise<void> {
    try {
      if (this.manager.backgroundMusic) {
        await this.manager.backgroundMusic.playAsync();
      }
    } catch (error) {
      console.error('Error playing background music:', error);
      throw error;
    }
  }

  async stopBackgroundMusic(): Promise<void> {
    try {
      if (this.manager.backgroundMusic) {
        await this.manager.backgroundMusic.stopAsync();
      }
    } catch (error) {
      console.error('Error stopping background music:', error);
      throw error;
    }
  }

  async setVolume(volume: number): Promise<void> {
    try {
      this.manager.volume = volume;
      if (this.manager.backgroundMusic) {
        await this.manager.backgroundMusic.setVolumeAsync(volume);
      }
    } catch (error) {
      console.error('Error setting volume:', error);
      throw error;
    }
  }

  getVolume(): number {
    return this.manager.volume;
  }

  async cleanup(): Promise<void> {
    try {
      if (this.manager.backgroundMusic) {
        await this.manager.backgroundMusic.unloadAsync();
        this.manager.backgroundMusic = null;
      }
    } catch (error) {
      console.error('Error cleaning up audio:', error);
      throw error;
    }
  }
}

export const audioEffects = AudioEffectsManager.getInstance();