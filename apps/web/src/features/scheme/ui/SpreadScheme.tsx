import { StyleSheet, View, ViewStyle } from 'react-native';
import { SpreadContext } from 'entities/Spread';
import { useTranslation } from 'react-i18next';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
import { SpreadName, SpreadsCategory } from 'shared/api';
import { DataProvider, useData } from 'shared/DataProvider';
import { Text, TEXT_TAGS } from 'shared/ui';
import { SchemeContext, TSchemeMapping, useSchemeLayoutMetrics } from '../model';
import { ChoicePerspective } from './ChoicePerspective';
import { ChoiceTwoPaths } from './ChoiceTwoPaths';
import SchemeFitContainer from './SchemeFitContainer/SchemeFitContainer';
import { SelfDevelopmentMirror } from './SelfDevelopmentMirror';
import { SelfDevelopmentPerspective } from './SelfDevelopmentPerspective';
import { ThematicCareerFinance } from './ThematicCareerFinance';
import { ThematicLove } from './ThematicLove';
import { ThematicRelationship } from './ThematicRelationship';
import { UniversalCelticCross } from './UniversalCelticCross';
import { UniversalHorseshoe } from './UniversalHorseshoe';
import { UniversalPyramid } from './UniversalPyramid';

type TSpreadSchemeProps = {
  style?: StyleProp<ViewStyle>;
  hasRotation?: boolean;
  isChoicePage?: boolean;
};

const SchemeMapping: TSchemeMapping = {
  [SpreadName.Thematic_Relationship]: ThematicRelationship,
  [SpreadName.Thematic_Love]: ThematicLove,
  [SpreadName.Thematic_CareerFinance]: ThematicCareerFinance,
  [SpreadName.Universal_CelticCross]: UniversalCelticCross,
  [SpreadName.Universal_Pyramid]: UniversalPyramid,
  [SpreadName.Universal_Horseshoe]: UniversalHorseshoe,
  [SpreadName.Choice_Crossroad]: ChoicePerspective,
  [SpreadName.Choice_TwoPaths]: ChoiceTwoPaths,
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
  const { cardSize, gapScale } = useSchemeLayoutMetrics();

  if (!spread?.id) {
    return null;
  }

  const Scheme = SchemeMapping[spread.id];

  if (!Scheme) {
    if (
      spread.category === SpreadsCategory.Simple ||
      spread.cardsCount <= 1 ||
      !spread.cardsPosition?.length
    ) {
      return null;
    }

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
        cardSize,
        gapScale,
      }}
    >
      <SchemeFitContainer>
        <Scheme style={style} onLayout={handleLayoutCard} />
      </SchemeFitContainer>
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
