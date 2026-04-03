import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Layout, StyleService } from '@ui-kitten/components';
import { useTranslation } from 'react-i18next';
import { COLORS } from 'shared/themes';
import { Text, TEXT_TAGS } from '../Text';

type OverlayIconProps = {
  children: ReactNode;
  text?: string;
  type?: 'bottom' | 'center';
  size?: 's' | 'm';
  onPress?: () => void;
  wrapperStyles?: StyleProp<ViewStyle>;
};

function OverlayIcon({
  children,
  text,
  type = 'center',
  size = 'm',
  wrapperStyles,
}: OverlayIconProps) {
  const { t } = useTranslation();

  const isBottom = type === 'bottom';

  return (
    <>
      <View style={styles.blurOverlay} />
      <Layout
        style={[
          styles.lockOverlay,
          isBottom ? styles.bottomPosition : styles.centerPosition,
        ]}
      >
        <View
          style={[
            styles.lockWrapper,
            size === 'm' ? styles.midWrapper : styles.smallWrapper,
            wrapperStyles,
          ]}
        >
          {children}
        </View>
        {!!text && (
          <Text category={TEXT_TAGS.h3} style={styles.text}>
            {t(text)}
          </Text>
        )}
      </Layout>
    </>
  );
}

const styles = StyleService.create({
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    opacity: 0.3,
  },
  text: {
    marginTop: 8,
    textAlign: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  centerPosition: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPosition: {
    bottom: 6,
    right: 6,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  lockWrapper: {
    backgroundColor: COLORS.SpbSky3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  midWrapper: {
    width: 50,
    height: 50,
    borderRadius: 50,
  },
  smallWrapper: {
    width: 25,
    height: 25,
    borderRadius: 25,
  },
});

export default OverlayIcon;
