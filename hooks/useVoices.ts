import { useState, useEffect } from 'react';
import { elevenlabsApi, Voice } from '../lib/elevenlabs';

// Extended voice interface with gender
interface ExtendedVoice extends Voice {
  gender: 'male' | 'female';
}

// Helper function to determine gender based on voice characteristics
function determineGender(voice: Voice): 'male' | 'female' {
  const maleVoices = [
    'Josh', 'Adam', 'Sam', 'Arnold', 'Thomas', 'James', 'Michael', 
    'Daniel', 'David', 'John', 'Patrick', 'Charlie', 'Matthew',
    'Chris', 'Joseph', 'Tony', 'William', 'George', 'Harry',
    'Eric', 'Callum', 'Liam', 'Will', 'Brian', 'Bill', // Added these names
    'Marcus', 'Peter', 'Robert', 'Richard', 'Edward', 'Benjamin',
    'Andrew', 'Steven', 'Kevin', 'Gary', 'Ronald', 'Timothy',
    'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas',
    'Eric', 'Jonathan', 'Stephen', 'Justin', 'Scott', 'Brandon',
    'Frank', 'Gregory', 'Raymond', 'Samuel', 'Patrick', 'Alexander',
    'Jack', 'Dennis', 'Jerry', 'Tyler', 'Aaron', 'Jose', 'Henry',
    'Douglas', 'Adam', 'Peter', 'Nathan', 'Zachary', 'Walter'
  ];
  
  // Check if the voice name contains any male name
  const isMale = maleVoices.some(name => 
    voice.name.toLowerCase().includes(name.toLowerCase())
  );
  
  // Some specific ElevenLabs voices that are male
  const elevenLabsMaleVoices = [
    'Antoni', 'Clyde', 'Dave', 'Fin', 'Glinda', 'Marcus',
    'Thomas', 'Charlie', 'James', 'Jeremy', 'Michael',
    'Bill', 'Chris', 'Josh', 'Matthew', 'Patrick', 'Sam'
  ];
  const isElevenLabsMale = elevenLabsMaleVoices.some(name => 
    voice.voice_id.toLowerCase().includes(name.toLowerCase()) ||
    voice.name.toLowerCase().includes(name.toLowerCase())
  );
  
  return isMale || isElevenLabsMale ? 'male' : 'female';
}

export function useVoices() {
  const [voices, setVoices] = useState<ExtendedVoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVoices() {
      try {
        const data = await elevenlabsApi.getVoices();
        // Add gender to each voice
        const voicesWithGender: ExtendedVoice[] = data.map(voice => ({
          ...voice,
          gender: determineGender(voice)
        }));
        setVoices(voicesWithGender);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadVoices();
  }, []);

  return { voices, isLoading, error };
}