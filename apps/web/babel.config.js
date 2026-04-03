module.exports = function (api) {
  api.cache(false);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            app: './src/app',
            pages: './src/pages',
            features: './src/features',
            entities: './src/entities',
            widgets: './src/widgets',
            shared: './src/shared',
            locales: './src/locales',
            assets: './src/assets',
          },
        },
      ],
    ],
  };
};
