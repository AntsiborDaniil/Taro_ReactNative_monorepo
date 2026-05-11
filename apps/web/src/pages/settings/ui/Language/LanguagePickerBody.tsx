import { TouchableOpacity, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleService, useStyleSheet } from '@ui-kitten/components';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { useData } from 'shared/DataProvider';
import { Checked } from 'shared/icons';
import { isTablet } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { AnalyticAction } from 'shared/types';
import { Text, TEXT_TAGS } from 'shared/ui';
import { LANGUAGES } from '../../lib';

export type LanguagePickerBodyVariant = 'screen' | 'modal';

type LanguagePickerBodyProps = {
  variant?: LanguagePickerBodyVariant;
  /** Вызвать после успешной смены языка (например закрыть модалку) */
  onAfterChange?: () => void;
};

function LanguagePickerBody({
  variant = 'screen',
  onAfterChange,
}: LanguagePickerBodyProps) {
  const { i18n, t } = useTranslation();
  const isModal = variant === 'modal';

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const styles = useStyleSheet(styleSheet);

  const handleChangeLanguage = async (lang: string) => {
    await handleVibrationClick?.();
    await AsyncStorage.setItem('language', lang);
    await i18n.changeLanguage(lang);
    AppMetrica.reportEvent(AnalyticAction.ClickChangeLanguage, {
      lang: LANGUAGES.find((l) => l.value === lang)?.title ?? lang,
    });
    onAfterChange?.();
  };

  return (
    <View
      style={[
        styles.wrapper,
        isModal ? styles.wrapperModal : styles.wrapperScreen,
      ]}
    >
      {LANGUAGES.map((language) => {
        const selected = language.value === i18n.language;
        return (
          <TouchableOpacity
            style={[
              styles.item,
              isModal && styles.itemModal,
              isModal && selected && styles.itemModalSelected,
            ]}
            activeOpacity={0.75}
            key={language.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={language.title}
            onPress={() => handleChangeLanguage(language.value)}
          >
            <View style={styles.iconWrapper}>
              {language.icon}
              <Text category={TEXT_TAGS.h4} style={isModal ? styles.titleModal : undefined}>
                {language.title}
              </Text>
            </View>
            {selected ? (
              <Checked width={isTablet ? 34 : 24} height={isTablet ? 34 : 24} />
            ) : (
              <View
                style={{
                  width: isTablet ? 34 : 24,
                  height: isTablet ? 34 : 24,
                }}
              />
            )}
          </TouchableOpacity>
        );
      })}
      {isModal ? (
        <Text category={TEXT_TAGS.p2} style={styles.modalFootnote}>
          {t('settings:language.modal.subtitle')}
        </Text>
      ) : null}
    </View>
  );
}

const styleSheet = StyleService.create({
  wrapper: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  wrapperScreen: {
    flex: 1,
    gap: 18,
    padding: 14,
  },
  wrapperModal: {
    gap: 12,
    paddingTop: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemModal: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(175, 161, 232, 0.28)',
    backgroundColor: COLORS.Background,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  itemModalSelected: {
    borderColor: COLORS.Primary,
    backgroundColor: 'rgba(246, 192, 27, 0.1)',
  },
  iconWrapper: {
    gap: 18,
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    minWidth: 0,
  },
  titleModal: {
    color: COLORS.Content,
  },
  modalFootnote: {
    marginTop: 8,
    color: COLORS.SpbSky1,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default LanguagePickerBody;
