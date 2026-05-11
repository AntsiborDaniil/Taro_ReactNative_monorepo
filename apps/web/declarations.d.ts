declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module '*.ttf' {
  const src: number;
  export default src;
}

declare module 'expo-navigation-bar';
declare module 'expo-screen-orientation';
declare module 'expo-haptics';
declare module 'expo-notifications';
declare module 'expo-secure-store';
declare module '@react-native-clipboard/clipboard' {
  const Clipboard: { setString: (s: string) => void; getString: () => Promise<string> };
  export default Clipboard;
}
declare module '@react-native-community/blur';
declare module '@react-native-community/slider';
declare module 'react-native-purchases' {
  export type CustomerInfo = {
    entitlements: { active: Record<string, unknown> };
  };
  export type PurchasesPackage = {
    identifier: string;
    product: {
      identifier: string;
      priceString: string;
      pricePerWeek: number;
    };
  };
  export type PurchasesOfferings = {
    current?: { availablePackages: PurchasesPackage[] } | null;
  };
  const Purchases: {
    restorePurchases: () => Promise<CustomerInfo>;
    purchasePackage: (p: PurchasesPackage) => Promise<{ customerInfo: CustomerInfo }>;
    getOfferings: () => Promise<PurchasesOfferings>;
  };
  export default Purchases;
}
declare module 'react-native-date-picker';
declare module 'react-native-device-detection';
declare module 'react-native-in-app-review';
declare module 'react-native-video';
declare module 'react-native-walkthrough-tooltip';
