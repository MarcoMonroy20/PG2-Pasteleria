module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@/components': './components',
            '@/constants': './constants',
            '@/contexts': './contexts',
            '@/hooks': './hooks',
            '@/services': './services',
            '@/utils': './utils',
            '@/database': './database',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};