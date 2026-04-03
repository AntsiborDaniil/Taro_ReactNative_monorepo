class SpInAppUpdates {
  constructor(_isProduction: boolean) {}

  async checkNeedsUpdate(): Promise<{ shouldUpdate: boolean; storeVersion?: string }> {
    return { shouldUpdate: false };
  }
}

export default SpInAppUpdates;
