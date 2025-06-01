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
