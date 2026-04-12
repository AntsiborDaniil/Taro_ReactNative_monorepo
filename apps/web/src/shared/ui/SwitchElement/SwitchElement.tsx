import { ReactElement, ReactNode } from 'react';
import { StyleProp, StyleSheet, TextStyle, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Switch, SwitchProps } from 'react-native-paper';
import { COLORS } from 'shared/themes';
import { Text, TEXT_TAGS } from '../Text';

export type SwitchElementProps = SwitchProps & {
  name: string;
  icon?: ReactNode;
  /** Подпись рядом со свитчем (например компактнее на экране настроек). */
  labelStyle?: StyleProp<TextStyle>;
};

function SwitchElement({
  name,
  icon,
  labelStyle,
  ...props
}: SwitchElementProps): ReactElement {
  const { t } = useTranslation();

  return (
    <View style={[styles.element, props.style]}>
      <View style={styles.textWrapper}>
        {!!icon && <View style={styles.icon}>{icon}</View>}
        <Text category={TEXT_TAGS.h4} style={labelStyle}>
          {t(name)}
        </Text>
      </View>
      <Switch
        {...props}
        style={{}}
        color={COLORS.Secondary}
        thumbColor="#F5F5F5"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  textWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 28,
  },
  icon: {
    width: 30,
  },
  element: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default SwitchElement;
