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

const XI_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

if (!XI_API_KEY) {
  console.warn('ElevenLabs API key is not set. Please set EXPO_PUBLIC_ELEVENLABS_API_KEY in your .env file.');
}

async function textToSpeech(
  text: string,
  voiceId: string,
  settings: {
    stability?: number;
    speed?: number;
    pitch?: number;
  },
  onProgress: (percentage: number) => void
): Promise<{ audioBase64: string; alignment: any }> {
  const url = `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/with-timestamps`;

  // Simulate progress with a timer
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 5;
    if (progress > 95) {
      progress = 95;
    }
    onProgress(progress);
  }, 300);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': XI_API_KEY!,
        accept: 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: settings.stability ?? 0.7,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    });

    clearInterval(interval);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail?.message || 'Failed to generate audio');
    }

    onProgress(100);

    const responseData = await response.json();

    return { audioBase64: responseData.audio_base64, alignment: responseData.alignment };
  } catch (error) {
    clearInterval(interval);
    throw error;
  }
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

  textToSpeech,
};
