import { StatusUpdateEvent, CheckOptions, InstallationResult, AndroidStatusEventListener, AndroidIntentResultListener, AndroidStartUpdateOptions, AndroidNeedsUpdateResponse } from './types';
import InAppUpdatesBase from './InAppUpdatesBase';
export default class InAppUpdates extends InAppUpdatesBase {
    constructor();
    protected onIncomingNativeResult: (event: InstallationResult) => void;
    protected onIncomingNativeStatusUpdate: (event: StatusUpdateEvent) => void;
    addStatusUpdateListener: (callback: AndroidStatusEventListener) => void;
    removeStatusUpdateListener: (callback: AndroidStatusEventListener) => void;
    addIntentSelectionListener: (callback: AndroidIntentResultListener) => void;
    removeIntentSelectionListener: (callback: AndroidIntentResultListener) => void;
    /**
     * Checks if there are any updates available.
     */
    checkNeedsUpdate: (checkOptions?: CheckOptions) => Promise<AndroidNeedsUpdateResponse>;
    /**
     *
     * Shows pop-up asking user if they want to update, giving them the option to download said update.
     */
    startUpdate: (updateOptions: AndroidStartUpdateOptions) => Promise<void>;
    installUpdate: () => void;
}
