import { StyleSheet, View, ViewStyle } from 'react-native';
import { SpreadContext } from 'entities/Spread';
import { useTranslation } from 'react-i18next';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SpreadName } from 'shared/api';
import { DataProvider, useData } from 'shared/DataProvider';
import { Text, TEXT_TAGS } from 'shared/ui';
import { SchemeContext, TSchemeMapping } from '../model';
import { ChoicePerspective } from './ChoicePerspective';
import { ChoiceTwoPaths } from './ChoiceTwoPaths';
import { SelfDevelopmentMirror } from './SelfDevelopmentMirror';
import { SelfDevelopmentPerspective } from './SelfDevelopmentPerspective';
import { ThematicCareerFinance } from './ThematicCareerFinance';
import { ThematicLove } from './ThematicLove';
import { ThematicRelationship } from './ThematicRelationship';
import { UniversalCelticCross } from './UniversalCelticCross';
import { UniversalFlame } from './UniversalFlame';
import { UniversalHorseshoe } from './UniversalHorseshoe';
import { UniversalPyramid } from './UniversalPyramid';

type TSpreadSchemeProps = {
  style?: StyleProp<ViewStyle>;
  hasRotation?: boolean;
  isChoicePage?: boolean;
};

const SchemeMapping: TSchemeMapping = {
  // Тематические
  [SpreadName.Thematic_Relationship]: ThematicRelationship,
  [SpreadName.Thematic_Love]: ThematicLove,
  [SpreadName.Thematic_CareerFinance]: ThematicCareerFinance,
  // Универсальные
  [SpreadName.Universal_CelticCross]: UniversalCelticCross,
  [SpreadName.Universal_Pyramid]: UniversalPyramid,
  [SpreadName.Universal_Horseshoe]: UniversalHorseshoe,
  [SpreadName.Universal_Flame]: UniversalFlame,
  // Для выбора
  [SpreadName.Choice_Crossroad]: ChoicePerspective,
  [SpreadName.Choice_TwoPaths]: ChoiceTwoPaths,
  // Для самопознания
  [SpreadName.SelfDevelopment_Mirror]: SelfDevelopmentMirror,
  [SpreadName.SelfDevelopment_ShadowSide]: SelfDevelopmentPerspective,
};

function SpreadScheme({
  hasRotation,
  isChoicePage,
  style,
}: TSpreadSchemeProps) {
  const { t } = useTranslation('core');
  const { spread, handleLayoutCard } = useData({ Context: SpreadContext });

  // const insets = useSafeAreaInsets();

  if (!spread?.id) {
    return (
      <View style={styles.stub}>
        <Text category={TEXT_TAGS.p1} style={styles.stubText}>
          {t('stub.missingData.title')}
        </Text>
      </View>
    );
  }

  const Scheme = SchemeMapping[spread.id];

  if (!Scheme) {
    return (
      <View style={styles.stub}>
        <Text category={TEXT_TAGS.p1} style={styles.stubText}>
          {t('stub.missingData.title')}
        </Text>
      </View>
    );
  }

  return (
    <DataProvider
      Context={SchemeContext}
      value={{
        hasRotation,
        isChoicePage,
      }}
    >
      {/*{spread.cardsPosition.map((item) => (*/}
      {/*  <View*/}
      {/*    style={{*/}
      {/*      position: 'absolute',*/}
      {/*      width: 4,*/}
      {/*      height: 4,*/}
      {/*      backgroundColor: 'red',*/}
      {/*      left: item.x,*/}
      {/*      top: item.y,*/}
      {/*      zIndex: 1000,*/}
      {/*    }}*/}
      {/*  />*/}
      {/*))}*/}
      {/*<View*/}
      {/*  style={{*/}
      {/*    position: 'absolute',*/}
      {/*    width: 4,*/}
      {/*    height: 4,*/}
      {/*    backgroundColor: 'red',*/}
      {/*    left: 0,*/}
      {/*    top: 0,*/}
      {/*    zIndex: 1000,*/}
      {/*  }}*/}
      {/*/>*/}
      <Scheme style={style} onLayout={handleLayoutCard} />
    </DataProvider>
  );
}

const styles = StyleSheet.create({
  stub: {
    minHeight: 120,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  stubText: {
    textAlign: 'center',
  },
});

export default SpreadScheme;
