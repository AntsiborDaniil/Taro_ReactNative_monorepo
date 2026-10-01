import {
  Platform,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
  useWindowDimensions,
} from 'react-native';
import { Circle, Svg } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { MoodAndEnergyContext } from 'entities/moodAndEnergy';
import { UserContext } from 'entities/user';
import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { TarotDeck } from 'shared/icons';
import {
  WEB_HOVER_TRANSITION,
  shouldPromptWebSignIn,
  toastWebAuthRequired,
} from 'shared/lib';
import { DS_COLORS, dsRadius, dsWebTransition } from 'shared/themes/ds';
import { NavigationRoute, TabRoute, PressableWebState } from 'shared/types';
import { Button, Text, TEXT_TAGS } from 'shared/ui';
import { MotivationContext } from '../../../entities/tarotMotivation';
import { MotivationKey } from '../../../shared/api';

/**
 * UI Kitten CircularProgressBar красит трек/индикатор только через eva `status`
 * (фиксированный набор тем-цветов), произвольные DS-токены (ground600/calm500)
 * так не задать без правки общей темы — кольцо рисуем сами через react-native-svg.
 */
function DsCircularProgress({
  size,
  trackWidth,
  progress,
}: {
  size: number;
  trackWidth: number;
  progress: number;
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - trackWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={DS_COLORS.ground600}
          strokeWidth={trackWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={DS_COLORS.calm500}
          strokeWidth={trackWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference * (1 - clamped)}
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.dsProgressTextWrap}>
          <RNText style={[styles.dsProgressText, { fontSize: Math.round(size * 0.23) }]}>
            {`${Math.round(clamped * 100)}%`}
          </RNText>
        </View>
      </View>
    </View>
  );
}

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

  const { todayProgress } = useData({
    Context: MoodAndEnergyContext,
  });

  const { isAuthenticated, authSessionLoading, refreshAuthSession } = useData({
    Context: UserContext,
  });

  const navigation = useNativeNavigation();

  const { handleSelectMotivationItem } = useData({
    Context: MotivationContext,
  });

  const { t } = useTranslation('moodAndEnergy');

  const filledCount = todayProgress?.filledValuesCount ?? 0;
  const totalCount = todayProgress?.allValuesCount ?? 3;
  const isComplete = (todayProgress?.percents ?? 0) === 100;

  const handleOpenMotivationCard = async () => {
    if (!interactive) {
      return;
    }

    const needsWebAuth = shouldPromptWebSignIn(isAuthenticated, authSessionLoading);

    if (needsWebAuth) {
      void refreshAuthSession?.();
      toastWebAuthRequired();
      return;
    }

    if (isWidget) {
      navigation.navigate(TabRoute.MainTab, {
        screen: NavigationRoute.MoodAndEnergy,
      });

      return;
    }

    if (!isComplete) {
      Toast.show({
        type: 'info',
        text1: t('card.needMore', {
          filled: filledCount,
          total: totalCount,
        }),
      });
      return;
    }

    if (todayProgress) {
      const ok = await handleSelectMotivationItem?.({
        key: MotivationKey.MoodAndEnergy,
        parameters: todayProgress.values,
      });

      if (!ok) {
        return;
      }

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
          interactive && hovered && Platform.OS === 'web' && styles.wrapperHover,
          interactive && pressed && styles.wrapperPressed,
          !interactive && styles.wrapperStatic,
        ];
      }}
      onPress={handleOpenMotivationCard}
    >
      <DsCircularProgress
        size={isWidget ? 60 : 68}
        trackWidth={isWidget ? 5 : 6}
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
          {isWidget
            ? isComplete
              ? t('progress.howAreYou')
              : t('progress.assess')
            : t('card.title')}
        </Text>
        {isWidget ? (
          !isComplete && (
            <Text
              category={TEXT_TAGS.label}
              style={[styles.subText, styles.subTextWidget]}
            >
              {`${t('progress')} ${filledCount}/${totalCount}`}
            </Text>
          )
        ) : (
          <Text
            category={TEXT_TAGS.label}
            style={[styles.subText, styles.subTextScreen]}
          >
            {isComplete
              ? t('card.ready')
              : t('card.needMore', {
                  filled: filledCount,
                  total: totalCount,
                })}
          </Text>
        )}
      </View>
      {!isWidget && (
        <View style={[styles.tarotPanel, isCompact && styles.tarotPanelCompact]}>
          <View style={styles.tarotIconWrap}>
            <TarotDeck width={32} height={32} />
          </View>

          <Button
            disabled={!interactive || !isComplete}
            style={styles.tarotAction}
            onPress={handleOpenMotivationCard}
          >
            {t('progress.createCard')}
          </Button>
          <Text category={TEXT_TAGS.label} style={styles.tarotActionHint}>
            {t('card.cost')}
          </Text>
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
    borderRadius: dsRadius.plate(64),
    borderColor: DS_COLORS.ground600,
    borderWidth: 1,
    backgroundColor: DS_COLORS.ground700,
    flexDirection: 'row',
    gap: 18,
    marginHorizontal: 16,
    marginVertical: 10,
    ...dsWebTransition,
  },
  wrapperScreen: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    marginHorizontal: 0,
    marginVertical: 0,
    paddingHorizontal: 22,
    paddingVertical: 20,
    gap: 20,
    borderRadius: 18,
  },
  wrapperHover: Platform.OS === 'web'
    ? ({ borderColor: DS_COLORS.accent400 } as object)
    : {},
  wrapperPressed: Platform.select({
    web: { transform: [{ translateY: 1 }] } as object,
    default: { opacity: 0.94 },
  }),
  wrapperStatic: {
    opacity: 0.98,
    ...(Platform.OS === 'web' ? ({ cursor: 'default' } as object) : {}),
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
    gap: 10,
    marginLeft: 'auto',
  },
  tarotPanelCompact: {
    width: '100%',
    marginLeft: 0,
    alignItems: 'flex-start',
  },
  tarotIconWrap: {
    width: 56,
    height: 56,
    borderRadius: dsRadius.window(56),
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarotAction: {
    minHeight: 40,
  },
  tarotActionHint: {
    color: DS_COLORS.ink100,
  },
  progress: {
    flexShrink: 0,
  },
  dsProgressTextWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dsProgressText: {
    color: DS_COLORS.ink50,
    fontFamily: 'Onest-Bold',
    textAlign: 'center',
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
    color: DS_COLORS.ink50,
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
    color: DS_COLORS.ink100,
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
