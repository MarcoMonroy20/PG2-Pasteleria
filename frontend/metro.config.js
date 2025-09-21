// Metro configuration optimized for Android performance
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Android-specific optimizations
config.resolver = {
  ...config.resolver,
  // Optimize asset loading
  assetExts: [
    ...config.resolver.assetExts,
    'db',
    'sqlite',
    'sqlite3'
  ],
};

// Performance optimizations (simplified for compatibility)
config.transformer = {
  ...config.transformer,
  // Enable inline requires for better performance
  inlineRequires: true,
};

// Watch folders for better hot reloading
config.watchFolders = [
  `${__dirname}/../backend`,
];

module.exports = config;