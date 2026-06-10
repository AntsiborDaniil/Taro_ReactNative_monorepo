import {
  Platform,
  Pressable,
  StyleSheet,
  TextStyle,
  View,
  useWindowDimensions,
} from 'react-native';
import { CircularProgressBar } from '@ui-kitten/components';
import { MoodAndEnergyContext } from 'entities/moodAndEnergy';
import { UserContext } from 'entities/user';
import { SignInForSpreadsModal } from 'features/tarotAccess/ui';
import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { WEB_HOVER_TRANSITION, shouldPromptWebSignIn } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { NavigationRoute, TabRoute, PressableWebState } from 'shared/types';
import { Text, TEXT_TAGS } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { MotivationContext } from '../../../entities/tarotMotivation';
import { MotivationKey } from '../../../shared/api';

export type MoodProgressProps = {
  isWidget?: boolean;
  interactive?: boolean;
};

function MoodProgress({
  isWidget,
  interactive = true,
}: MoodProgressProps): ReactElement {
  const { width: winW } = useWindowDimensions();
  const isCompact = winW < (isWidget ? 460 : 760);
  const [isHovered, setIsHovered] = useState(false);

  const { todayProgress } = useData({
    Context: MoodAndEnergyContext,
  });

  const { isAuthenticated, authSessionLoading } = useData({
    Context: UserContext,
  });

  const { showModal } = useData({ Context: ModalsContext });

  const navigation = useNativeNavigation();

  const { handleSelectMotivationItem } = useData({
    Context: MotivationContext,
  });

  const { t } = useTranslation('moodAndEnergy');

  const handleOpenMotivationCard = async () => {
    if (!interactive) {
      return;
    }

    const needsWebAuth = shouldPromptWebSignIn(isAuthenticated, authSessionLoading);

    if (needsWebAuth) {
      showModal?.(
        <SignInForSpreadsModal i18nNamespace="moodAndEnergy" />
      );
      return;
    }

    if (isWidget) {
      navigation.navigate(TabRoute.MainTab, {
        screen: NavigationRoute.MoodAndEnergy,
      });

      return;
    }

    if (todayProgress) {
      await handleSelectMotivationItem?.({
        key: MotivationKey.MoodAndEnergy,
        parameters: todayProgress.values,
      });

      navigation.navigate(TabRoute.MainTab, {
        screen: NavigationRoute.MotivationCard,
      });
    }
  };

  return (
    <Pressable
      style={({ pressed, ...rest }: PressableWebState) => {
        const hovered = rest.hovered;
        return [
        styles.wrapper,
        !isWidget && styles.wrapperScreen,
        isWidget && styles.wrapperWidget,
        isCompact && styles.wrapperCompact,
        interactive &&
          hovered &&
          !isWidget &&
          Platform.OS === 'web' &&
          styles.wrapperScreenHover,
        interactive && pressed && styles.wrapperPressed,
        !interactive && styles.wrapperStatic,
      ];
      }}
      onHoverIn={() => {
        if (Platform.OS === 'web') {
          setIsHovered(true);
        }
      }}
      onHoverOut={() => {
        if (Platform.OS === 'web') {
          setIsHovered(false);
        }
      }}
      onPress={handleOpenMotivationCard}
    >
      <CircularProgressBar
        size={isWidget ? 'medium' : 'large'}
        style={styles.progress}
        textStyle={
          StyleSheet.flatten([
            styles.progressPercentLabel,
            !isWidget && styles.progressPercentLabelScreen,
          ]) as TextStyle
        }
        progress={(todayProgress?.percents ?? 0) / 100}
      />
      <View
        style={[
          styles.texts,
          isWidget && styles.textsWidget,
          !isWidget && styles.textsScreen,
        ]}
      >
        <Text
          category={isWidget ? TEXT_TAGS.label : TEXT_TAGS.h4}
          style={[
            styles.mainText,
            isWidget && styles.mainTextWidget,
            !isWidget && styles.mainTextScreen,
          ]}
        >
          {todayProgress?.percents === 100
            ? t('progress.howAreYou')
            : t('progress.assess')}
        </Text>
        {todayProgress?.percents !== 100 && (
          <Text
            category={TEXT_TAGS.label}
            style={[
              styles.subText,
              isWidget && styles.subTextWidget,
              !isWidget && styles.subTextScreen,
            ]}
          >
            {`${t('progress')} ${todayProgress?.filledValuesCount}/${todayProgress?.allValuesCount}`}
          </Text>
        )}
      </View>
      {!isWidget && (
        <View style={[styles.tarotPanel, isCompact && styles.tarotPanelCompact]}>
          <View
            style={[
              styles.tarotCardPreview,
              Platform.OS === 'web' && isHovered && styles.tarotCardPreviewHover,
            ]}
          >
            <View style={styles.tarotCardBack} />
            <View style={styles.tarotCardFront}>
              <Text style={styles.tarotCardGlyph}>✦</Text>
              <Text style={styles.tarotCardLabel}>TAROT</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.tarotAction,
              pressed && styles.tarotActionPressed,
              !interactive && styles.tarotActionDisabled,
            ]}
            onPress={handleOpenMotivationCard}
            disabled={!interactive}
          >
            <Text style={styles.tarotActionText}>
              {todayProgress?.percents === 100
                ? t('progress.howAreYou')
                : t('progress.assess')}
            </Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 22,
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 12,
    borderColor: 'rgba(132, 176, 230, 0.28)',
    borderWidth: 1,
    backgroundColor: 'rgba(16, 25, 37, 0.72)',
    flexDirection: 'row',
    gap: 18,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  wrapperScreen: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    marginHorizontal: 0,
    marginVertical: 12,
    paddingHorizontal: 22,
    paddingVertical: 20,
    gap: 20,
    borderRadius: 16,
    borderColor: 'rgba(132, 176, 230, 0.26)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 10px 24px rgba(0, 0, 0, 0.16)',
          ...WEB_HOVER_TRANSITION,
        } as object)
      : {}),
  },
  wrapperScreenHover:
    Platform.OS === 'web'
      ? ({
          borderColor: 'rgba(160, 198, 255, 0.5)',
          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.22)',
          backgroundColor: 'rgba(26, 34, 48, 0.92)',
        } as object)
      : {},
  wrapperPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  wrapperStatic: {
    opacity: 0.98,
    ...(
      Platform.OS === 'web'
        ? ({
            cursor: 'default',
          } as object)
        : {}
    ),
  },
  wrapperWidget: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    marginHorizontal: 0,
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 20,
  },
  wrapperCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 14,
  },
  tarotPanel: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginLeft: 'auto',
  },
  tarotPanelCompact: {
    width: '100%',
    marginLeft: 0,
    alignItems: 'flex-start',
  },
  tarotCardPreview: {
    width: 84,
    height: 108,
    position: 'relative',
    ...WEB_HOVER_TRANSITION,
  },
  tarotCardPreviewHover:
    Platform.OS === 'web'
      ? ({
          boxShadow: '0 12px 28px rgba(76, 53, 173, 0.42)',
        } as object)
      : {},
  tarotCardBack: {
    position: 'absolute',
    width: 74,
    height: 96,
    borderRadius: 10,
    right: 0,
    top: 6,
    borderWidth: 1,
    borderColor: 'rgba(126, 103, 240, 0.45)',
    backgroundColor: 'rgba(38, 31, 74, 0.8)',
  },
  tarotCardFront: {
    position: 'absolute',
    width: 74,
    height: 96,
    borderRadius: 10,
    left: 0,
    top: 0,
    borderWidth: 1,
    borderColor: 'rgba(198, 176, 255, 0.72)',
    backgroundColor: 'rgba(21, 20, 46, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow:
            '0 8px 20px rgba(76, 53, 173, 0.35), inset 0 0 18px rgba(166, 133, 255, 0.18)',
        } as object)
      : {}),
  },
  tarotCardGlyph: {
    color: '#C7AEFF',
    fontSize: 20,
    fontWeight: '700',
  },
  tarotCardLabel: {
    color: '#D8CCFF',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.1,
  },
  tarotAction: {
    minHeight: 36,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(179, 153, 255, 0.42)',
    backgroundColor: 'rgba(81, 60, 168, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarotActionPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  tarotActionDisabled: {
    opacity: 0.65,
  },
  tarotActionText: {
    color: '#E9E3FF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.25,
  },
  progress: {
    flexShrink: 0,
  },
  progressPercentLabel: {
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  progressPercentLabelScreen: {
    paddingHorizontal: 8,
    fontSize: 18,
  },
  texts: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  textsWidget: {
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  textsScreen: {
    gap: 6,
    justifyContent: 'center',
  },
  mainText: {
    lineHeight: 22,
  },
  mainTextWidget: {
    fontSize: 14,
    lineHeight: 18,
  },
  mainTextScreen: {
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  subText: {
    color: COLORS.SpbSky1,
    lineHeight: 22,
  },
  subTextWidget: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  subTextScreen: {
    fontSize: 16,
    lineHeight: 20,
    marginTop: 2,
  },
});

export default MoodProgress;
