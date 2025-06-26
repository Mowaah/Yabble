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
  
  // Polyfill localStorage with complete implementation
  if (typeof global.window.localStorage === 'undefined') {
    const storage = new Map();
    global.window.localStorage = {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key),
      clear: () => storage.clear(),
      get length() {
        return storage.size;
      },
      key: (index) => {
        const keys = Array.from(storage.keys());
        return keys[index] || null;
      }
    };
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
}

module.exports = config;