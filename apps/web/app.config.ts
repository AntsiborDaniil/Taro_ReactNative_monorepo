export default {
  expo: {
    name: 'Mindful Web',
    slug: 'tarot-web',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'myapp',
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-font',
      'expo-localization',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#171F2C',
          image: './assets/splash-screen-icon.png',
          dark: {
            image: './assets/splash-screen-icon.png',
            backgroundColor: '#171F2C',
          },
          imageWidth: 250,
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'a85dde46-e9e3-4895-941d-155c4fda07a3',
      },
    },
  },
};
