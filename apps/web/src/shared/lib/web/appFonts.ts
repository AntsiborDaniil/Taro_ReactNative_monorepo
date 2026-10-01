import { Platform } from 'react-native';

/**
 * DS-гарнитуры (design-system.html §06): Geologica — дисплей, Onest — текст/UI.
 * Статические TTF с кириллицей из Google Fonts CSS2 API (OFL, см. assets/fonts/OFL-*.txt).
 * Имена — как в `shared/themes/ds` → `DS_FONT_FAMILY`; один файл = один вес, без fontWeight
 * в стилях (иначе браузер синтезирует жирность поверх реального начертания).
 */
const dsFontSources = {
  'Geologica-ExtraBold': require('../../../../assets/fonts/Geologica-ExtraBold.ttf'),
  'Geologica-Black': require('../../../../assets/fonts/Geologica-Black.ttf'),
  'Onest-Medium': require('../../../../assets/fonts/Onest-Medium.ttf'),
  'Onest-SemiBold': require('../../../../assets/fonts/Onest-SemiBold.ttf'),
  'Onest-Bold': require('../../../../assets/fonts/Onest-Bold.ttf'),
  'Onest-ExtraBold': require('../../../../assets/fonts/Onest-ExtraBold.ttf'),
};

/** На web грузим только используемые начертания — быстрее первый запуск. */
export const appFontSources =
  Platform.OS === 'web'
    ? {
        'Montserrat-Regular': require('../../../../assets/fonts/Montserrat-Regular.ttf'),
        'Montserrat-Medium': require('../../../../assets/fonts/Montserrat-Medium.ttf'),
        'Montserrat-SemiBold': require('../../../../assets/fonts/Montserrat-SemiBold.ttf'),
        'Montserrat-Bold': require('../../../../assets/fonts/Montserrat-Bold.ttf'),
        ...dsFontSources,
      }
    : {
        'Montserrat-Black': require('../../../../assets/fonts/Montserrat-Black.ttf'),
        'Montserrat-BlackItalic': require('../../../../assets/fonts/Montserrat-BlackItalic.ttf'),
        'Montserrat-Bold': require('../../../../assets/fonts/Montserrat-Bold.ttf'),
        'Montserrat-BoldItalic': require('../../../../assets/fonts/Montserrat-BoldItalic.ttf'),
        'Montserrat-ExtraBold': require('../../../../assets/fonts/Montserrat-ExtraBold.ttf'),
        'Montserrat-ExtraBoldItalic': require('../../../../assets/fonts/Montserrat-ExtraBoldItalic.ttf'),
        'Montserrat-ExtraLight': require('../../../../assets/fonts/Montserrat-ExtraLight.ttf'),
        'Montserrat-ExtraLightItalic': require('../../../../assets/fonts/Montserrat-ExtraLightItalic.ttf'),
        'Montserrat-Italic': require('../../../../assets/fonts/Montserrat-Italic.ttf'),
        'Montserrat-Light': require('../../../../assets/fonts/Montserrat-Light.ttf'),
        'Montserrat-LightItalic': require('../../../../assets/fonts/Montserrat-LightItalic.ttf'),
        'Montserrat-Medium': require('../../../../assets/fonts/Montserrat-Medium.ttf'),
        'Montserrat-MediumItalic': require('../../../../assets/fonts/Montserrat-MediumItalic.ttf'),
        'Montserrat-Regular': require('../../../../assets/fonts/Montserrat-Regular.ttf'),
        'Montserrat-SemiBold': require('../../../../assets/fonts/Montserrat-SemiBold.ttf'),
        'Montserrat-SemiBoldItalic': require('../../../../assets/fonts/Montserrat-SemiBoldItalic.ttf'),
        'Montserrat-Thin': require('../../../../assets/fonts/Montserrat-Thin.ttf'),
        'Montserrat-ThinItalic': require('../../../../assets/fonts/Montserrat-ThinItalic.ttf'),
        ...dsFontSources,
      };
