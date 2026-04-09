const { getDefaultConfig } = require('expo/metro-config');
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');
const path = require('path');

module.exports = wrapWithReanimatedMetroConfig(
  (() => {
    const config = getDefaultConfig(__dirname);

    const { transformer, resolver } = config;

    // SVG transformer (same as native)
    config.transformer = {
      ...transformer,
      babelTransformerPath: require.resolve(
        'react-native-svg-transformer/expo'
      ),
    };

    config.resolver = {
      ...resolver,
      assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
      sourceExts: [...resolver.sourceExts, 'svg'],
    };

    // Map native-only packages to web stubs
    config.resolver.extraNodeModules = {
      ...config.resolver.extraNodeModules,
      'expo-secure-store': path.resolve(
        __dirname,
        'src/shared/stubs/expo-secure-store.ts'
      ),
      'expo-haptics': path.resolve(
        __dirname,
        'src/shared/stubs/expo-haptics.ts'
      ),
      'expo-navigation-bar': path.resolve(
        __dirname,
        'src/shared/stubs/expo-navigation-bar.ts'
      ),
      'expo-screen-orientation': path.resolve(
        __dirname,
        'src/shared/stubs/expo-screen-orientation.ts'
      ),
      'expo-notifications': path.resolve(
        __dirname,
        'src/shared/stubs/noop.ts'
      ),
      '@appmetrica/react-native-analytics': path.resolve(
        __dirname,
        'src/shared/stubs/appmetrica.ts'
      ),
      'react-native-purchases': path.resolve(
        __dirname,
        'src/shared/stubs/purchases.ts'
      ),
      'react-native-purchases-ui': path.resolve(
        __dirname,
        'src/shared/stubs/purchases-ui.ts'
      ),
      'react-native-onesignal': path.resolve(
        __dirname,
        'src/shared/stubs/onesignal.ts'
      ),
      'onesignal-expo-plugin': path.resolve(
        __dirname,
        'src/shared/stubs/noop.ts'
      ),
      'react-native-in-app-review': path.resolve(
        __dirname,
        'src/shared/stubs/noop.ts'
      ),
      'sp-react-native-in-app-updates': path.resolve(
        __dirname,
        'src/shared/stubs/in-app-updates.ts'
      ),
      'react-native-video': path.resolve(
        __dirname,
        'src/shared/stubs/react-native-video.tsx'
      ),
      '@react-native-community/blur': path.resolve(
        __dirname,
        'src/shared/stubs/blur.tsx'
      ),
      '@react-native-clipboard/clipboard': path.resolve(
        __dirname,
        'src/shared/stubs/noop.ts'
      ),
      '@react-native-community/slider': path.resolve(
        __dirname,
        'src/shared/stubs/noop.ts'
      ),
      'react-native-date-picker': path.resolve(
        __dirname,
        'src/shared/stubs/noop.ts'
      ),
      'react-native-device-detection': path.resolve(
        __dirname,
        'src/shared/stubs/noop.ts'
      ),
      'expo-dev-client': path.resolve(
        __dirname,
        'src/shared/stubs/noop.ts'
      ),
      'react-native-walkthrough-tooltip': path.resolve(
        __dirname,
        'src/shared/stubs/walkthrough-tooltip.tsx'
      ),
      '@shopify/react-native-skia': path.resolve(
        __dirname,
        'src/shared/stubs/skia.ts'
      ),
      'victory-native': path.resolve(
        __dirname,
        'src/shared/stubs/victory.tsx'
      ),
    };

    // axios browser build (same as native)
    config.resolver.resolveRequest = function packageExportsResolver(
      context,
      moduleImport,
      platform
    ) {
      if (moduleImport === 'axios' || moduleImport.startsWith('axios/')) {
        return context.resolveRequest(
          { ...context, unstable_conditionNames: ['browser'] },
          moduleImport,
          platform
        );
      }

      return context.resolveRequest(context, moduleImport, platform);
    };

    return config;
  })()
);
