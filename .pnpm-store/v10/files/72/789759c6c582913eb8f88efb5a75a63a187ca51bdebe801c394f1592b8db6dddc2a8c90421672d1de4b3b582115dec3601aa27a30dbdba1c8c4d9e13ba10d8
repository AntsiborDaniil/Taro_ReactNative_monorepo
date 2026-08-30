"use strict";
/**
 * Expo config plugin for One Signal
 * @see https://documentation.onesignal.com/docs/react-native-sdk-setup#step-4-install-for-ios-using-cocoapods-for-ios-apps
 */
Object.defineProperty(exports, "__esModule", { value: true });
const withOneSignalAndroid_1 = require("./withOneSignalAndroid");
const withOneSignalIos_1 = require("./withOneSignalIos");
const helpers_1 = require("../support/helpers");
const withOneSignal = (config, props) => {
    // if props are undefined, throw error
    if (!props) {
        throw new Error('You are trying to use the OneSignal plugin without any props. Property "mode" is required. Please see https://github.com/OneSignal/onesignal-expo-plugin for more info.');
    }
    (0, helpers_1.validatePluginProps)(props);
    config = (0, withOneSignalIos_1.withOneSignalIos)(config, props);
    config = (0, withOneSignalAndroid_1.withOneSignalAndroid)(config, props);
    return config;
};
exports.default = withOneSignal;
