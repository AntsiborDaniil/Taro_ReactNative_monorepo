import 'react-native-get-random-values';
import { injectCriticalWebStyles } from './src/shared/lib/web/injectCriticalWebStyles';
import { setupWebDocumentMeta } from './src/shared/lib/web/seo';
import { injectYandexMetrika } from './src/shared/lib/web/yandexMetrika';

injectCriticalWebStyles();
setupWebDocumentMeta();
injectYandexMetrika();

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
