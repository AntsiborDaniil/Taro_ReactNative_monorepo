import { En, Ru } from 'shared/icons';
import { isTablet } from 'shared/lib';

export const LANGUAGES = [
  {
    title: 'English',
    value: 'en',
    icon: <En width={isTablet ? 34 : 24} height={isTablet ? 34 : 24} />,
  },
  {
    title: 'Русский',
    value: 'ru',
    icon: <Ru width={isTablet ? 34 : 24} height={isTablet ? 34 : 24} />,
  },
];
