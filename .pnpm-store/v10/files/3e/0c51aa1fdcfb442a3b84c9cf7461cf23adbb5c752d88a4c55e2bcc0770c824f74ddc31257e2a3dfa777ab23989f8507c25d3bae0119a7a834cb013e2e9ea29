import type { NativeEventEmitter } from 'react-native';
import EventListenerCollection from './EventListenerCollection';
export default class InAppUpdatesBase {
    protected name: string;
    protected statusUpdateListeners: EventListenerCollection;
    protected resultListeners: EventListenerCollection;
    protected eventEmitter?: NativeEventEmitter;
    protected prototype: any;
    protected isDebug: boolean;
    constructor(isDebug?: boolean);
    throwError: (err: string | Error, scope: string) => never;
    toString: () => string;
    debugLog: (message: string) => void;
}
