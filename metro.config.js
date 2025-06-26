// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Enable CSS support.
  isCSSEnabled: true,
});

// Configure SVG transformer
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
};

// Add polyfills for browser globals to fix "window is not defined" error
// This is needed for React Native libraries during Node.js build process
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add global polyfills for Node.js environment
if (typeof global !== 'undefined') {
  // Polyfill window object for Node.js environment
  if (typeof global.window === 'undefined') {
    global.window = {};
  }
  
  // Polyfill document object for Node.js environment
  if (typeof global.document === 'undefined') {
    global.document = {};
  }
  
  // Polyfill navigator object for Node.js environment
  if (typeof global.navigator === 'undefined') {
    global.navigator = { userAgent: 'node' };
  }
}

module.exports = config;