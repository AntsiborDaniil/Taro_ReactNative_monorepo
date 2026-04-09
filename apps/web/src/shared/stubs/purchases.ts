export const LOG_LEVEL = {
  VERBOSE: 'VERBOSE',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SILENT: 'SILENT',
} as const;

export type CustomerInfo = {
  activeSubscriptions: string[];
  entitlements: { active: Record<string, unknown> };
};

const Purchases = {
  setLogLevel: (_level: unknown) => {},
  configure: (_config: unknown) => {},
  getOfferings: async () => ({ current: null }),
  purchasePackage: async (_pkg: unknown) => ({}),
  getCustomerInfo: async (): Promise<CustomerInfo> => ({
    activeSubscriptions: [],
    entitlements: { active: {} },
  }),
  addCustomerInfoUpdateListener: (_listener: unknown) => {},
  removeCustomerInfoUpdateListener: (_listener: unknown) => {},
};

export default Purchases;
