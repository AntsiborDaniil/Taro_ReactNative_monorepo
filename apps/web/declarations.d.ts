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

/** Metro stubs — types so `tsc` and IDE resolve imports like on device */
declare module '@appmetrica/react-native-analytics' {
  const AppMetrica: {
    reportEvent: (...args: unknown[]) => void;
    reportError: (...args: unknown[]) => void;
    activate: (...args: unknown[]) => void;
  };
  export default AppMetrica;
}
declare module 'expo-navigation-bar' {
  export function setBackgroundColorAsync(_color: string): Promise<void>;
  export function setButtonStyleAsync(_style: string): Promise<void>;
}
declare module 'expo-screen-orientation' {
  export const OrientationLock: { PORTRAIT_UP: string };
  export function lockAsync(_mode: string): Promise<void>;
}
declare module 'expo-haptics' {
  export function impactAsync(_style?: unknown): Promise<void>;
  export const ImpactFeedbackStyle: Record<string, string>;
}
declare module '@react-native-clipboard/clipboard' {
  const Clipboard: { setString: (s: string) => void };
  export default Clipboard;
}
declare module '@react-native-community/blur' {
  import type { ComponentType } from 'react';
  export const BlurView: ComponentType<Record<string, unknown>>;
}
declare module 'react-native-purchases' {
  export type CustomerInfo = {
    activeSubscriptions: string[];
    entitlements: {
      active: Record<
        string,
        {
          productIdentifier?: string;
          isActive?: boolean;
          expirationDate?: string;
          willRenew?: boolean;
        }
      >;
    };
  };
  export type PurchasesOfferings = {
    current?: {
      availablePackages?: Array<{
        identifier: string;
        product: {
          identifier: string;
          priceString: string;
          pricePerWeek: number;
        };
      }>;
    } | null;
  };
  const Purchases: {
    setLogLevel: (level: unknown) => void;
    configure: (config: unknown) => void;
    getOfferings: () => Promise<PurchasesOfferings>;
    purchasePackage: (
      pkg: unknown
    ) => Promise<{ customerInfo: CustomerInfo }>;
    restorePurchases: () => Promise<CustomerInfo>;
    getCustomerInfo: () => Promise<CustomerInfo>;
    addCustomerInfoUpdateListener: (listener: unknown) => void;
    removeCustomerInfoUpdateListener: (listener: unknown) => void;
  };
  export default Purchases;
}
declare module 'expo-notifications' {
  export const getPermissionsAsync: () => Promise<{ status: string }>;
  export function scheduleNotificationAsync(
    content: Record<string, unknown>
  ): Promise<string>;
}
declare module 'expo-secure-store' {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
  export function deleteItemAsync(key: string): Promise<void>;
}
declare module 'react-native-device-detection' {
  export const isTablet: boolean;
}
declare module '@react-native-community/slider' {
  import type { ComponentType } from 'react';
  const Slider: ComponentType<Record<string, unknown>>;
  export default Slider;
}
declare module 'react-native-walkthrough-tooltip' {
  import type { ComponentType, ReactNode } from 'react';
  export type TooltipProps = {
    children?: ReactNode;
    content?: ReactNode;
    isVisible?: boolean;
    contentStyle?: object;
    parentWrapperStyle?: object;
    arrowSize?: { width: number; height: number };
    onClose?: () => void;
    [key: string]: unknown;
  };
  const Tooltip: ComponentType<TooltipProps>;
  export default Tooltip;
}
declare module 'react-native-in-app-review' {
  const InAppReview: {
    isAvailable: () => boolean;
    RequestInAppReview: () => Promise<boolean>;
  };
  export default InAppReview;
}
declare module 'victory-native/src/types' {
  export type VictoryLabelProps = Record<string, unknown>;
  /** Stub: real package uses complex conditional types; `any` keeps tsc happy on web */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type InputFields<T = any> = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type NumericalFields<T = any> = any;
}
declare module 'react-native-date-picker' {
  import type { ComponentType } from 'react';
  const DatePicker: ComponentType<Record<string, unknown>>;
  export default DatePicker;
}
declare module 'react-native-video' {
  import type { ComponentType } from 'react';
  const Video: ComponentType<Record<string, unknown>>;
  export default Video;
}
