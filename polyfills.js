/**
 * Polyfills for Node.js modules in React Native
 * This file should be imported before any other imports in your app
 */

// Import core polyfills
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Basic process polyfill
if (typeof global.process === 'undefined') {
  global.process = {
    env: {},
    nextTick: (cb) => setTimeout(cb, 0),
    browser: true,
    version: '',
    versions: {},
    platform: 'browser',
  };
}

// Add minimal URL polyfill if needed
if (typeof global.URL === 'undefined') {
  global.URL = class URL {
    constructor(url, base) {
      this.href = url;
      this.origin = '';
      this.protocol = 'https:';
      this.pathname = '/';
      this.search = '';
      this.hash = '';
    }
  };
}

// Stream polyfill
if (typeof global.Stream === 'undefined') {
  try {
    global.Stream = require('stream-browserify');
  } catch (e) {
    global.Stream = class Stream {};
  }
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
    const WebSocket = require('react-native').WebSocket;
    global.WebSocket = WebSocket;
  } catch (e) {
    global.WebSocket = class WebSocket {
      constructor() {
        console.warn('WebSocket is not supported in this environment');
      }
    };
  }
}