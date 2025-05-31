import Constants from 'expo-constants';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = Constants.expoConfig?.extra?.elevenLabsApiKey;

if (!ELEVENLABS_API_KEY) {
  throw new Error('Missing ElevenLabs API key. Please check your app.config.js');
}

export interface Voice {
  voice_id: string;
  name: string;
  preview_url: string;
}

export const elevenlabsApi = {
  async getVoices(): Promise<Voice[]> {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }

    const data = await response.json();
    return data.voices;
  },

  async textToSpeech(text: string, voiceId: string, options = {}) {
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          ...options,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to convert text to speech');
    }

    return response.blob();
  },
};