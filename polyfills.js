/**
 * Polyfills for Node.js modules in React Native
 * This file should be imported before any other imports in your app
 */

// Import core polyfills
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Basic process polyfill
global.process = global.process || {
  env: {},
  nextTick: (cb) => setTimeout(cb, 0),
  browser: true,
  version: '',
  versions: {},
  platform: 'browser',
};

// Add minimal URL polyfill if needed
if (typeof global.URL === 'undefined') {
  // Simple URL implementation for RN
  global.URL = class URL {
    constructor(url, base) {
      // Basic implementation
      this.href = url;
      this.origin = '';
      this.protocol = 'https:';
      this.pathname = '/';
      this.search = '';
      this.hash = '';
    }
  };
}

// Stream polyfill (already added in metro.config.js)
try {
  global.Stream = require('stream-browserify');
} catch (e) {
  // Fallback if stream-browserify fails
  global.Stream = class Stream {};
}

// Timing polyfills
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = setTimeout;
}

if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = clearTimeout;
}

// Other global shims
global.__dirname = '/';
global.__filename = '';

// WebSocket implementation
if (typeof global.WebSocket === 'undefined') {
  try {
    // Try to use the native React Native WebSocket
    const WebSocket = require('react-native').WebSocket;
    global.WebSocket = WebSocket;
  } catch (e) {
    // Fallback empty implementation
    global.WebSocket = class WebSocket {
      constructor() {
        console.warn('WebSocket is not supported in this environment');
      }
    };
  }
}

// AsyncStorage polyfill - CRITICAL: Must be defined before any modules that use it
if (typeof global.AsyncStorage === 'undefined') {
  global.AsyncStorage = {
    getItem: async (key) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return Promise.resolve(window.localStorage.getItem(key));
        }
        return Promise.resolve(null);
      } catch (e) {
        return Promise.resolve(null);
      }
    },
    setItem: async (key, value) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        return Promise.resolve();
      } catch (e) {
        return Promise.resolve();
      }
    },
    removeItem: async (key) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return Promise.resolve();
      } catch (e) {
        return Promise.resolve();
      }
    },
    clear: async () => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.clear();
        }
        return Promise.resolve();
      } catch (e) {
        return Promise.resolve();
      }
    },
    getAllKeys: async () => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return Promise.resolve(Object.keys(window.localStorage));
        }
        return Promise.resolve([]);
      } catch (e) {
        return Promise.resolve([]);
      }
    },
    multiGet: async (keys) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return Promise.resolve(keys.map(key => [key, window.localStorage.getItem(key)]));
        }
        return Promise.resolve(keys.map(key => [key, null]));
      } catch (e) {
        return Promise.resolve(keys.map(key => [key, null]));
      }
    },
    multiSet: async (keyValuePairs) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          keyValuePairs.forEach(([key, value]) => {
            window.localStorage.setItem(key, value);
          });
        }
        return Promise.resolve();
      } catch (e) {
        return Promise.resolve();
      }
    },
    multiRemove: async (keys) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          keys.forEach(key => {
            window.localStorage.removeItem(key);
          });
        }
        return Promise.resolve();
      } catch (e) {
        return Promise.resolve();
      }
    },
  };
}