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
  
  // Polyfill document object for Node.js environment with createElement method
  if (typeof global.document === 'undefined') {
    global.document = {
      createElement: (tagName) => ({
        tagName: tagName,
        style: {},
        setAttribute: () => {},
        getAttribute: () => null,
        appendChild: () => {},
        removeChild: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        innerHTML: '',
        textContent: '',
        children: [],
        parentNode: null,
        classList: {
          add: () => {},
          remove: () => {},
          contains: () => false,
          toggle: () => false,
        },
      }),
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      body: {
        appendChild: () => {},
        removeChild: () => {},
        style: {},
      },
      head: {
        appendChild: () => {},
        removeChild: () => {},
      },
    };
  }
  
  // Polyfill navigator object for Node.js environment
  if (typeof global.navigator === 'undefined') {
    global.navigator = { userAgent: 'node' };
  }

  // Mock AsyncStorage for Node.js environment with proper methods
  if (typeof global.AsyncStorage === 'undefined') {
    global.AsyncStorage = {
      getItem: async (key) => {
        return Promise.resolve(null);
      },
      setItem: async (key, value) => {
        return Promise.resolve();
      },
      removeItem: async (key) => {
        return Promise.resolve();
      },
      clear: async () => {
        return Promise.resolve();
      },
      getAllKeys: async () => {
        return Promise.resolve([]);
      },
      multiGet: async (keys) => {
        return Promise.resolve(keys.map(key => [key, null]));
      },
      multiSet: async (keyValuePairs) => {
        return Promise.resolve();
      },
      multiRemove: async (keys) => {
        return Promise.resolve();
      },
    };
  }
}

module.exports = config;