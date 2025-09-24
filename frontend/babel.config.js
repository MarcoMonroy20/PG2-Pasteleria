// Babel configuration highly optimized for Android performance
module.exports = function(api) {
  api.cache(true);
  const isProduction = process.env.NODE_ENV === 'production';
  const platform = process.env.EXPO_PUBLIC_PLATFORM || 'default';

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
            '@hooks': './hooks',
            '@contexts': './contexts',
          },
        },
      ],

      // Android-specific optimizations
      ...(platform === 'android' ? [
        // Optimize imports for Android
        [
          'babel-plugin-transform-imports',
          {
            'react-native': {
              transform: (importName) => `react-native/Libraries/Components/${importName}`,
              preventFullImport: true,
            },
          },
        ],
      ] : []),

      // Remove console logs in production
      ...(isProduction ? [
        [
          'transform-remove-console',
          {
            exclude: ['error', 'warn'],
          },
        ],
      ] : []),

      // Optimize class properties for better Android performance
      ...(isProduction ? [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-private-methods',
      ] : []),

      // Code splitting for better bundle size on Android
      ...(isProduction ? [
        [
          'babel-plugin-transform-react-remove-prop-types',
          {
            mode: 'remove',
            removeImport: true,
          },
        ],
      ] : []),

      // Dead code elimination for Android
      ...(isProduction ? [
        'babel-plugin-minify-dead-code-elimination',
      ] : []),

      // React Native Reanimated plugin must be last
      'react-native-reanimated/plugin',
    ],
  };
};
