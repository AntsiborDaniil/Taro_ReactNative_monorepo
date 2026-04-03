import React from 'react';
import { BlurView } from '@react-native-community/blur';
import { StyleService } from '@ui-kitten/components';
import { UserContext } from 'entities/user';
import { useData } from 'shared/DataProvider';
import { LockIcon, Ritual } from 'shared/icons';
import { COLORS } from 'shared/themes';
import { OverlayIcon } from 'shared/ui/OverlayIcon';

function PressToUnlock() {
  const { isPractitioner } = useData({ Context: UserContext });

  return (
    <>
      <BlurView
        style={styles.blur}
        blurType="light"
        blurAmount={5}
        reducedTransparencyFallbackColor="white"
      />
      <OverlayIcon
        text={isPractitioner ? 'core:generateMeaning' : 'core:pressToOpen'}
      >
        {isPractitioner ? (
          <Ritual width={36} height={36} fill={COLORS.Content} />
        ) : (
          <LockIcon width={36} height={36} fill={COLORS.Content} />
        )}
      </OverlayIcon>
    </>
  );
}

const styles = StyleService.create({
  blur: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});

export default PressToUnlock;
