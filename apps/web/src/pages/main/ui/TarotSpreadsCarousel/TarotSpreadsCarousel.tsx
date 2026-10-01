import { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { setNavReturnToMain } from 'app/navigation/navReturnStore';
import { useTranslation } from 'react-i18next';
import { TSpread } from 'shared/api';
import { useNativeNavigation } from 'shared/hooks';
import { useData } from 'shared/DataProvider';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { AnalyticAction, NavigationRoute, TabRoute, type PressableWebState } from 'shared/types';
import { Carousel } from 'shared/ui';
import {
  DS_COLORS,
  DS_LAYOUT,
  DS_SIZES,
  DS_SPACE,
  dsFocusRing,
  dsText,
  dsWebTransition,
  dsWebTransitionReduced,
  getDsViewport,
} from 'shared/themes/ds';
import { useReducedMotion } from 'react-native-reanimated';
import { useKeyboardFocusVisible } from 'pages/main/lib/useKeyboardFocusVisible';
import { Chevron } from '../icons';
import MainSpreadCard from './MainSpreadCard';

type TarotSpreadsCarouselProps = {
  title: ReactNode;
  spaceBetween?: number;
  spreads?: TSpread[];
  analyticAction?: AnalyticAction;
};

function AllSpreadsLink({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { focusVisible, onFocus, onBlur } = useKeyboardFocusVisible();

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={t('main:allSpreads')}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      style={({ hovered }: PressableWebState) => [
        styles.allLink,
        reducedMotion ? dsWebTransitionReduced : dsWebTransition,
        focusVisible && dsFocusRing,
        hovered ? styles.allLinkHovered : null,
      ]}
    >
      {({ hovered }: PressableWebState) => (
        <>
          <Text
            numberOfLines={1}
            style={[
              dsText('body', DS_COLORS.accent400),
              hovered ? styles.allLinkTextHovered : null,
            ]}
          >
            {t('main:allSpreads')}
          </Text>
          <Chevron size={16} color={DS_COLORS.accent400} />
        </>
      )}
    </Pressable>
  );
}

/** Пустое состояние DS §11: пунктирная оправа + заголовок + действие. */
function EmptySpreadsState({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <View style={styles.emptyState}>
      <Text style={dsText('body', DS_COLORS.ink100)}>{t('main:popularSpreads')}</Text>
      <AllSpreadsLink onPress={onPress} />
    </View>
  );
}

function TarotSpreadsCarousel({
  title,
  spaceBetween,
  spreads,
  analyticAction,
}: TarotSpreadsCarouselProps) {
  const navigation = useNativeNavigation();
  const { setSelectedTab } = useData({ Context: TabsAndRoutesContext });
  const { width } = useWindowDimensions();
  const viewport = getDsViewport(width);
  const gutter = DS_LAYOUT.gutter;
  const gap = spaceBetween ?? DS_SPACE.m;
  const isMobile = viewport === 'mobile';

  const handleNavigateToSpreads = () => {
    setSelectedTab?.(TabRoute.SpreadsTab);
    setNavReturnToMain();
    navigation.navigate(TabRoute.SpreadsTab, {
      screen: NavigationRoute.Spreads,
    });
  };

  const header =
    typeof title === 'string' ? (
      <Text accessibilityRole="header" numberOfLines={2} style={[styles.headerTitle, dsText('title', DS_COLORS.ink50)]}>
        {title}
      </Text>
    ) : (
      <View style={styles.headerTitle}>{title}</View>
    );

  return (
    <View style={styles.container}>
      {isMobile ? (
        <View style={styles.headerStack}>
          {header}
          <AllSpreadsLink onPress={handleNavigateToSpreads} />
        </View>
      ) : (
        <View style={styles.headerRow}>
          {header}
          <AllSpreadsLink onPress={handleNavigateToSpreads} />
        </View>
      )}

      {spreads?.length ? (
        <View style={isMobile ? { marginHorizontal: -gutter } : undefined}>
          <Carousel<TSpread>
            data={spreads}
            spaceBetween={gap}
            edgePadding={isMobile ? gutter : 0}
            renderItem={({ item }) => (
              <MainSpreadCard analyticAction={analyticAction} spread={item} />
            )}
          />
        </View>
      ) : (
        <EmptySpreadsState onPress={handleNavigateToSpreads} />
      )}
    </View>
  );
}

export default TarotSpreadsCarousel;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: DS_SPACE.m,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DS_SPACE.s,
  },
  headerStack: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: DS_SPACE.xs,
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
  },
  allLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS_SPACE.xs,
    flexShrink: 0,
    minHeight: DS_SIZES.minTouch,
    paddingHorizontal: DS_SPACE.xs,
    borderRadius: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
  },
  allLinkHovered: {
    backgroundColor: DS_COLORS.ground700,
  },
  allLinkTextHovered: {
    textDecorationLine: 'underline',
    textDecorationColor: DS_COLORS.accent400,
    ...(Platform.OS === 'web' ? ({ textUnderlineOffset: 3 } as object) : null),
  },
  emptyState: {
    width: '100%',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: DS_COLORS.ground600,
    borderRadius: 18,
    padding: DS_SPACE.xl,
    alignItems: 'center',
    gap: DS_SPACE.m,
  },
});
