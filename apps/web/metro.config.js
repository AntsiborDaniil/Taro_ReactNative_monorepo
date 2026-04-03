const { getDefaultConfig } = require('expo/metro-config');
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');
const path = require('path');

// Packages that don't work in the browser → replaced with stubs via resolveRequest
// (resolveRequest has priority over extraNodeModules and node_modules lookup)
const STUB_MODULES = {
  'expo-secure-store': 'expo-secure-store.ts',
  'expo-haptics': 'expo-haptics.ts',
  'expo-navigation-bar': 'expo-navigation-bar.ts',
  'expo-screen-orientation': 'expo-screen-orientation.ts',
  'expo-notifications': 'noop.ts',
  'expo-dev-client': 'noop.ts',
  '@appmetrica/react-native-analytics': 'appmetrica.ts',
  'react-native-purchases': 'purchases.ts',
  'react-native-purchases-ui': 'purchases-ui.ts',
  'react-native-onesignal': 'onesignal.ts',
  'onesignal-expo-plugin': 'noop.ts',
  'react-native-in-app-review': 'noop.ts',
  'sp-react-native-in-app-updates': 'in-app-updates.ts',
  'react-native-video': 'react-native-video.tsx',
  '@react-native-community/blur': 'blur.tsx',
  '@react-native-community/slider': 'slider.tsx',
  '@react-native-clipboard/clipboard': 'noop.ts',
  'react-native-date-picker': 'date-picker.tsx',
  'rn-emoji-keyboard': 'emoji-keyboard.tsx',
  'react-native-device-detection': 'noop.ts',
  'react-native-walkthrough-tooltip': 'walkthrough-tooltip.tsx',
  // Skia and victory-native must be overridden via resolveRequest
  // because extraNodeModules does NOT override already-installed packages
  '@shopify/react-native-skia': 'skia.ts',
  'victory-native': 'victory.tsx',
};

const stubsDir = path.resolve(__dirname, 'src/shared/stubs');

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

    // resolveRequest takes priority over installed node_modules,
    // unlike extraNodeModules which is only a fallback
    config.resolver.resolveRequest = function webStubsResolver(
      context,
      moduleImport,
      platform
    ) {
      // Stub native-only packages — match exact name AND subpaths (e.g. 'victory-native/src/types')
      const stubKey = Object.keys(STUB_MODULES).find(
        (key) => moduleImport === key || moduleImport.startsWith(key + '/')
      );
      if (stubKey) {
        const filePath = path.join(stubsDir, STUB_MODULES[stubKey]);
        console.log(`[web-stubs] ${moduleImport} → stubs/${STUB_MODULES[stubKey]}`);
        return { type: 'sourceFile', filePath };
      }

      // Use the browser build of axios
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
