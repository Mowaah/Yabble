import { EXPO_PUBLIC_ELEVENLABS_API_KEY, EXPO_PUBLIC_ELEVENLABS_API_URL } from '@env';

export const elevenlabsApi = {
  async getVoices() {
    const response = await fetch(`${EXPO_PUBLIC_ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': EXPO_PUBLIC_ELEVENLABS_API_KEY,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }
    
    return response.json();
  },

  async textToSpeech(text: string, voiceId: string) {
    const response = await fetch(`${EXPO_PUBLIC_ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': EXPO_PUBLIC_ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to convert text to speech');
    }
    
    return response.blob();
  },
};