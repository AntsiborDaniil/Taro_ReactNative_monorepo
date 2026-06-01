import 'react-native-get-random-values';
import { injectCriticalWebStyles } from './src/shared/lib/web/injectCriticalWebStyles';

injectCriticalWebStyles();

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
