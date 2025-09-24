// Metro configuration highly optimized for Android performance
const { getDefaultConfig } = require('expo/metro-config');
const { Platform } = require('react-native');

const config = getDefaultConfig(__dirname);

// Android-specific optimizations
config.resolver = {
  ...config.resolver,
  // Optimize asset loading for Android
  assetExts: [
    ...config.resolver.assetExts,
    'db',
    'sqlite',
    'sqlite3',
    'png',
    'jpg',
    'jpeg',
    'gif',
    'webp'
  ],
  // Optimize module resolution
  alias: {
    'react-native-sqlite-storage': 'expo-sqlite',
  },
};

// Performance optimizations for Android
config.transformer = {
  ...config.transformer,
  // Enable inline requires for better performance
  inlineRequires: true,
  // Optimize images for Android
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
  // Minify for production builds
  minifierConfig: {
    keep_classnames: false,
    keep_fnames: false,
    mangle: {
      toplevel: true,
    },
  },
};

// Cache configuration optimized for Android development
config.cacheStores = [
  {
    type: 'file',
    root: `${__dirname}/.metro-cache`,
    // Increase cache size for better performance
    maxSize: 1024 * 1024 * 512, // 512MB
  },
];

// Watch folders for better hot reloading
config.watchFolders = [
  `${__dirname}/../backend`,
  `${__dirname}/../shared`,
];

// Android-specific server configuration
config.server = {
  ...config.server,
  // Optimize port for Android emulator
  port: Platform.OS === 'android' ? 8081 : 8081,
  // Enable enhanced middleware for Android
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add custom headers for Android debugging
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');
      return middleware(req, res, next);
    };
  },
};

// Symbolicator for better error reporting on Android
config.symbolicator = {
  customizeFrame: (frame) => {
    // Add Android-specific frame customization
    if (frame.file?.includes('node_modules')) {
      frame.collapse = true;
    }
    return frame;
  },
};

module.exports = config;