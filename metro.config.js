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
  unstable_allowRequireContext: true, // From original user config
  enableBabelRuntime: true, // From original user config
  // maxRAM: 2048, // From original user config, ensure it's placed correctly if still needed
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
  extraNodeModules: {
    // ...config.resolver.extraNodeModules, // Preserve any defaults if they exist
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
    net: false, // Explicitly set to false as per original user config
    tls: false, // Explicitly set to false as per original user config
  },
  enableGlobalPackages: true, // From original user config
  unstable_enablePackageExports: false, // From original user config
  unstable_conditionNames: ['require', 'import', 'browser'], // From original user config
  unstable_enableSymlinks: false, // From original user config
};

// Custom resolveRequest from original user config - needs careful integration
// We need to ensure this custom resolver still has access to the original context.resolveRequest
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
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
    // let the normal resolution continue (check against the current config's extraNodeModules)
    if (
      config.resolver.extraNodeModules &&
      config.resolver.extraNodeModules[moduleName]
    ) {
      // If polyfilled, let the original resolver handle it (or the default if originalResolveRequest is undefined)
      if (originalResolveRequest) {
        return originalResolveRequest(context, moduleName, platform);
      }
      // Fallback if originalResolveRequest was somehow not set (should not happen with getDefaultConfig)
      return context.resolveRequest(context, moduleName, platform);
    }

    // For other problematic modules that are not polyfilled, return empty module
    return {
      type: 'empty',
    };
  }

  // Default resolver behavior for other modules
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Configure caching (from original user config)
config.cacheStores = []; // Or merge if getDefaultConfig sets some
config.resetCache = true;

// Disable file system cache (from original user config, if intended)
// config.fileMapCacheDirectory = undefined;

// Increase the max workers (from original user config)
config.maxWorkers = 2; // Or merge

// Ensure other settings like isCSSEnabled are preserved (already set in getDefaultConfig)

module.exports = config;
