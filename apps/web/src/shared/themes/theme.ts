import { dark } from '@eva-design/eva';
import { getKittenColors } from './colors';

export const myTheme = {
  ...dark,
  ...getKittenColors(),

  'text-font-family': 'Montserrat-Regular', // Основной шрифт (обычный текст)
  'text-font-family-bold': 'Montserrat-Bold', // Жирный шрифт (заголовки, акценты)
  'text-font-family-italic': 'Montserrat-Italic', // Курсив
  // Дополнительные стили для разных категорий
  'text-font-family-h1': 'Montserrat-ExtraBold', // Для заголовков h1
  'text-font-family-h2': 'Montserrat-Bold', // Для заголовков h2
  'text-font-family-p1': 'Montserrat-Regular', // Для основного текста
  'text-font-family-p2': 'Montserrat-Light', // Для вторичного текста
  'text-font-family-label': 'Montserrat-Medium', // Для меток
  'text-font-family-caption': 'Montserrat-Thin', // Для подписей
};

export const customMapper: any = {
  components: {
    Select: {
      meta: {
        scope: 'all',
        appearances: {
          default: {},
        },
        variantGroups: {
          status: ['basic'],
          size: ['small', 'medium', 'large'],
        },
        states: [],
        parameters: {
          backgroundColor: {
            type: 'color',
            value: 'white',
          },
        },
      },
      appearances: {
        default: {
          mapping: {
            labelFontWeight: '400',
          },
          variantGroups: {
            status: {
              basic: {
                backgroundColor: 'white',
                borderColor: 'white',
              },
            },
            size: {
              small: {
                paddingVertical: 3,
                textFontWeight: '400',
              },
              medium: {
                paddingVertical: 7,
                textFontWeight: '400',
              },
              large: {
                paddingVertical: 11,
                textFontWeight: '400',
              },
            },
          },
        },
      },
    },
    SelectOption: {
      meta: {
        scope: 'all',
        appearances: {
          default: {},
        },
        parameters: {
          backgroundColor: {
            type: 'color',
            value: 'white',
          },
        },
      },
      appearances: {
        default: {
          mapping: {
            textFontWeight: '400',
          },
        },
      },
    },
  },
};
