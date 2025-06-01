// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Enable CSS support
  isCSSEnabled: true,
});

// Configure caching
config.cacheStores = [];
config.resetCache = true;

// Disable file system cache
// config.fileMapCacheDirectory = undefined;

// Increase the max workers and RAM
config.maxWorkers = 2;
config.transformer.maxRAM = 2048; // 2GB

// Add resolver configuration to handle circular dependencies
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    stream: require.resolve('stream-browserify'),
    crypto: require.resolve('react-native-crypto'),
    events: require.resolve('events/'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    url: require.resolve('url/'),
    zlib: require.resolve('browserify-zlib'),
    path: require.resolve('path-browserify'),
    buffer: require.resolve('buffer/'),
    util: require.resolve('util/'),
    assert: require.resolve('assert/'),
    querystring: require.resolve('querystring-es3'),
    net: false,
    tls: false,
  },
  enableGlobalPackages: true,
  unstable_enablePackageExports: false,
  unstable_conditionNames: ['require', 'import', 'browser'],
  unstable_enableSymlinks: false,

  // Custom resolver to handle problematic Node.js modules
  resolveRequest: (context, moduleName, platform) => {
    // Intercept problematic Node.js modules for React Native
    if (
      moduleName === 'ws' ||
      moduleName === 'stream' ||
      moduleName === 'crypto' ||
      moduleName === 'buffer' ||
      moduleName === 'util' ||
      moduleName === 'events' ||
      moduleName === 'fs' ||
      moduleName === 'path' ||
      moduleName === 'os' ||
      moduleName.startsWith('node:')
    ) {
      // For modules that have already been polyfilled in extraNodeModules,
      // let the normal resolution continue
      if (config.resolver.extraNodeModules[moduleName]) {
        return context.resolveRequest(context, moduleName, platform);
      }

      // For other problematic modules, return empty module
      return {
        type: 'empty',
      };
    }

    // Default resolver
    return context.resolveRequest(context, moduleName, platform);
  },
};

// Configure the Metro transformer
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  enableBabelRuntime: true,
};

module.exports = config;
