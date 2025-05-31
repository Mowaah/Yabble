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
config.fileMapCacheDirectory = undefined;

// Increase the max workers and RAM
config.maxWorkers = 2;
config.transformer.maxRAM = 2048; // 2GB

// Add resolver configuration to handle circular dependencies
config.resolver = {
  ...config.resolver,
  enableGlobalPackages: true,
  unstable_enablePackageExports: true,
  unstable_conditionNames: ['require', 'import'],
};

// Configure the Metro transformer
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  enableBabelRuntime: true,
};

module.exports = config;