export const LogLevel = {
  None: 0,
  Fatal: 1,
  Error: 2,
  Warn: 3,
  Info: 4,
  Debug: 5,
  Verbose: 6,
} as const;

const OneSignal = {
  initialize: (_appId: string) => {},
  Debug: {
    setLogLevel: (_level: unknown) => {},
  },
  Notifications: {
    requestPermission: async (_fallback?: boolean): Promise<boolean> => false,
  },
};

export { OneSignal };
export default OneSignal;
