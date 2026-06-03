export default {
  expo: {
    name: 'Mindful — Таро онлайн',
    slug: 'tarot-web',
    version: '1.0.0',
    description:
      'Онлайн-таро: расклады, карта дня, толкования карт. Tarot readings, spreads, and daily card.',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    scheme: 'myapp',
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
      backgroundColor: '#171F2C',
      name: 'Mindful Tarot',
      shortName: 'Mindful',
      description:
        'Таро онлайн: расклады, карта дня, значения карт. Online tarot spreads and readings.',
      lang: 'ru',
      themeColor: '#171F2C',
    },
    plugins: [
      'expo-dev-client',
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
