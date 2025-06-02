// Custom type declarations

// Declaration for @env module (for environment variables)
declare module '@env' {
  export const EXPO_PUBLIC_ELEVENLABS_API_KEY: string;
  export const EXPO_PUBLIC_ELEVENLABS_API_URL: string;
  // Add other environment variables you use here as needed
}

// Declarations for SVG files (critical for your logo)
declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
