import { StyleSheet, View } from 'react-native';
import { DS_COLORS } from 'shared/themes/ds';

type FantasyAtmosphereProps = {
  compact?: boolean;
  wide?: boolean;
};

/**
 * DS §04/§10: без звёзд/аур/пульсаций — ровный фон ground900. Компонент и его API
 * (compact/wide) сохранены для обратной совместимости с ScreenLayout.
 */
export function FantasyAtmosphere(_props: FantasyAtmosphereProps) {
  return <View pointerEvents="none" style={styles.root} />;
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DS_COLORS.ground900,
    zIndex: 0,
  },
});
