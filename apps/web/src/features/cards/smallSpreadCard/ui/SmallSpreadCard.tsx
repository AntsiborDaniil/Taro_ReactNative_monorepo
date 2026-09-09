import React, { memo, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import { UserContext } from 'entities/user';
import { useTranslation } from 'react-i18next';
import { SignInForSpreadsModal } from 'features/tarotAccess/ui';
import { DeckStyle, TSpread } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import {
  getImage,
  isGuestFreeSpreadId,
  isWebGuestSession,
  shouldPromptWebSignIn,
} from 'shared/lib';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import {
  AnalyticAction,
  ImagePosition,
  NavigationRoute,
  TabRoute,
} from 'shared/types';
import { TileCard } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';

type SmallSpreadCardProps = {
  spread: TSpread;
  analyticAction?: AnalyticAction;
};

/** Карточка карусели: ширина от вьюпорта, с потолком чтобы не вылезала за колонку. */
function useSmallSpreadCardSize() {
  const { width: winW } = useWindowDimensions();

  return useMemo(() => {
    const contentW = Math.min(winW, 1280);
    const padBudget = contentW < 430 ? 36 : 48;
    const avail = Math.max(240, contentW - padBudget);
    const width = Math.round(
      Math.min(168, Math.max(120, Math.min(avail * 0.42, avail - 40)))
    );
    const height = Math.round(width * (155 / 165));
    return { width, height };
  }, [winW]);
}

function SmallSpreadCard({ spread, analyticAction }: SmallSpreadCardProps) {
  const { id, name } = spread ?? {};
  const { t: tSpread } = useTranslation('spread');
  const { width: cardW, height: cardH } = useSmallSpreadCardSize();

  const navigation = useNativeNavigation();

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { isAuthenticated, authSessionLoading } = useData({
    Context: UserContext,
  });

  const { showModal } = useData({ Context: ModalsContext });
  const { setSelectedTab } = useData({ Context: TabsAndRoutesContext });

  const guestFree = isGuestFreeSpreadId(spread?.id);
  const isLocked =
    isWebGuestSession(isAuthenticated, authSessionLoading) && !guestFree;

  const { selectSpread } = useData({
    Context: SpreadContext,
  });

  return (
    <TileCard
      id={id}
      imageSource={getImage([
        'spreadsSmall',
        DeckStyle.FlatIllustration,
        `${id}`,
      ])}
      width={cardW}
      height={cardH}
      isLocked={isLocked}
      topRightBadge={guestFree ? tSpread('guestSpread.badge') : undefined}
      imageResizeMode="cover"
      onPress={async () => {
        if (analyticAction) {
          AppMetrica.reportEvent(analyticAction, {
            spread: name,
            isLocked,
          });
        }

        await handleVibrationClick?.();

        if (
          shouldPromptWebSignIn(isAuthenticated, authSessionLoading) &&
          !guestFree
        ) {
          showModal?.(<SignInForSpreadsModal />);
          return;
        }

        const { shouldRedirectToSpreadReading } =
          (await selectSpread?.(spread)) || {};

        setSelectedTab?.(TabRoute.SpreadsTab);

        if (shouldRedirectToSpreadReading) {
          navigation.navigate(TabRoute.SpreadsTab, {
            screen: NavigationRoute.SpreadReadings,
          });

          return;
        }

        navigation.navigate(TabRoute.SpreadsTab, {
          screen: NavigationRoute.SpreadDescriptionChoice,
        });
      }}
      imagePosition={ImagePosition.Background}
    >
      {name ?? ''}
    </TileCard>
  );
}

export default memo(SmallSpreadCard);
