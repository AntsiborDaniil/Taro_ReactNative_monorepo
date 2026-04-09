import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { GetIcon, QuitIcon } from 'shared/icons';
import { getImage } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { HabitType, NavigationRoute, TabRoute } from 'shared/types';
import { Button, ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';

function HabitChoose() {
  const { t } = useTranslation();

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const navigation = useNativeNavigation();

  return (
    <ScreenLayout>
      <Header showBackButton title="" />
      <ScrollView style={styles.wrapper} contentContainerStyle={styles.buttons}>
        <Image
          style={styles.image}
          resizeMode="contain"
          source={getImage(['core', 'paidGirl'])}
        />
        <Button
          style={styles.button}
          onPress={async () => {
            await handleVibrationClick?.();

            navigation.navigate(TabRoute.MainTab, {
              screen: NavigationRoute.HabitCreate,
              params: {
                habitType: HabitType.BuildPositive,
              },
            });
          }}
        >
          <Text style={styles.text} category={TEXT_TAGS.h4}>
            {t('habits:button.chooseBad')}
          </Text>
          <View style={styles.iconWrapper}>
            <GetIcon style={styles.icon} />
          </View>
        </Button>
        <Button
          style={styles.button}
          onPress={async () => {
            await handleVibrationClick?.();

            navigation.navigate(TabRoute.MainTab, {
              screen: NavigationRoute.HabitCreate,
              params: {
                habitType: HabitType.QuitNegative,
              },
            });
          }}
        >
          <Text style={styles.text} category={TEXT_TAGS.h4}>
            {t('habits:button.chooseGood')}
          </Text>
          <View style={styles.iconWrapper}>
            <QuitIcon style={styles.icon} />
          </View>
        </Button>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 48,
  },
  buttons: {
    gap: 16,
    marginTop: 300,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: COLORS.Background,
    borderColor: COLORS.Primary,
    borderWidth: 2,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
    justifyContent: 'space-between',
  },
  text: {
    textAlign: 'left',
  },
  image: {
    position: 'absolute',
    height: 400,
    width: '100%',
    top: -330,
  },
  icon: {
    width: 60,
    height: 60,
  },
  iconWrapper: {
    paddingLeft: 12,
    borderLeftColor: COLORS.Content,
    borderLeftWidth: 2,
  },
});

export default HabitChoose;
