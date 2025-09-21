// Babel configuration optimized for Android performance
module.exports = function(api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Module resolver for clean imports
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './',
            '@components': './components',
            '@utils': './utils',
            '@services': './services',
            '@constants': './constants',
            '@assets': './assets',
          },
        },
      ],

      // Remove console logs in production
      ...(process.env.NODE_ENV === 'production' ? [
        [
          'transform-remove-console',
          {
            exclude: ['error', 'warn'],
          },
        ],
      ] : []),

      // React Native Reanimated plugin must be last
      'react-native-reanimated/plugin',
    ],
  };
};
