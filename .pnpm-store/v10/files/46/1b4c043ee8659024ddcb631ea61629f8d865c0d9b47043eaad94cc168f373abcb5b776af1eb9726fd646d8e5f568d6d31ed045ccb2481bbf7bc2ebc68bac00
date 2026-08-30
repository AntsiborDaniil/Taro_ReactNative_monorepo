import InAppUpdatesBase from './InAppUpdatesBase';
import type { CheckOptions, IosStartUpdateOptions, IosNeedsUpdateResponse } from './types';
export default class InAppUpdates extends InAppUpdatesBase {
    checkNeedsUpdate(checkOptions?: CheckOptions): Promise<IosNeedsUpdateResponse>;
    startUpdate(updateOptions: IosStartUpdateOptions): Promise<void>;
    installUpdate: () => void;
    addStatusUpdateListener: () => void;
    removeStatusUpdateListener: () => void;
    addIntentSelectionListener: () => void;
    removeIntentSelectionListener: () => void;
}
