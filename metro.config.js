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
  unstable_allowRequireContext: true,
  enableBabelRuntime: true,
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    // Terser configuration for better stability
    ecma: 8,
    keep_classnames: true,
    keep_fnames: true,
    module: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
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
  },
  enableGlobalPackages: true,
  unstable_enablePackageExports: true,
  unstable_conditionNames: ['require', 'import', 'browser'],
  unstable_enableSymlinks: false,
  unstable_disableHierarchicalLookup: true,
};

// Caching configuration
config.cacheStores = [];
config.resetCache = false;
config.cacheVersion = '1.0.0';

// Performance settings
config.maxWorkers = 4;
config.transformer.workerPath = require.resolve('metro/src/DeltaBundler/Worker');
config.watchFolders = [__dirname];

// Stable server configuration
config.server = {
  ...config.server,
  port: 8081,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add cache headers
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return middleware(req, res, next);
    };
  },
};

module.exports = config;