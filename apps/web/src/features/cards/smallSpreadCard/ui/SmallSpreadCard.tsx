import React, { memo } from 'react';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import { UserContext } from 'entities/user';
import { PaidContent } from 'features/paidContent';
import { DeckStyle, TSpread } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { getImage, horizontalScale } from 'shared/lib';
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

function SmallSpreadCard({ spread, analyticAction }: SmallSpreadCardProps) {
  const { id, name } = spread ?? {};

  const navigation = useNativeNavigation();

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { subscriptionType } = useData({ Context: UserContext });

  const { showModal } = useData({ Context: ModalsContext });

  const isLocked = !spread?.availableSubscriptions.some(
    (subscriptionItem) => subscriptionItem === subscriptionType
  );

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
      width={horizontalScale(165)}
      height={horizontalScale(155)}
      isLocked={isLocked}
      onPress={async () => {
        if (analyticAction) {
          AppMetrica.reportEvent(analyticAction, {
            spread: name,
            isLocked,
          });
        }

        await handleVibrationClick?.();

        if (isLocked) {
          showModal?.(<PaidContent />);

          return;
        }

        const { shouldRedirectToSpreadReading } =
          (await selectSpread?.(spread)) || {};

        if (shouldRedirectToSpreadReading) {
          navigation.navigate(TabRoute.MainTab, {
            screen: NavigationRoute.SpreadReadings,
          });

          return;
        }

        navigation.navigate(TabRoute.MainTab, {
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
