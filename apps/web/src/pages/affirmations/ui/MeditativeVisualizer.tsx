import { Pressable, StyleSheet, View } from 'react-native';
import {
  AffirmationsContext,
  getAffirmationItemsForCategory,
} from 'entities/affirmations';
import { useTranslation } from 'react-i18next';
import { useData } from 'shared/DataProvider';
import { DS_COLORS, dsRadius, dsWebTransition } from 'shared/themes/ds';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

type MeditativeVisualizerProps = {
  visualSize: number;
};

/**
 * Фокус-плашка «Журнал»: DS-поверхность ground700 с текстом аффирмации.
 * Прежний анимированный Skia-блоб на web не рендерится (заглушка, см. .claude/rules/web.md)
 * — убран целиком вместе с glow/тенями.
 */
function MeditativeVisualizer({ visualSize }: MeditativeVisualizerProps) {
  const SIZE = visualSize;

  const { selectedAffirmation, selectedAffirmationCategory } = useData({
    Context: AffirmationsContext,
  });

  const { t } = useTranslation();

  const texts = getAffirmationItemsForCategory(
    t,
    selectedAffirmationCategory
  );

  const selectedTexts = texts.find(
    (item) => item.id === selectedAffirmation?.texts.id
  );

  const affirmationFontSize = Math.round(Math.max(18, Math.min(34, SIZE * 0.055)));
  const affirmationLineHeight = Math.round(affirmationFontSize * 1.26);

  return (
    <Pressable
      key={SIZE}
      accessibilityRole="button"
      accessibilityLabel={t('affirmations:focusArea')}
      style={(state) => [
        styles.container,
        {
          width: SIZE,
          height: SIZE,
          borderRadius: dsRadius.window(SIZE),
        },
        (state as { hovered?: boolean }).hovered && styles.containerHovered,
        state.pressed && styles.containerPressed,
      ]}
    >
      <View style={styles.texts}>
        {selectedTexts?.text?.map((item, index) => (
          <Text
            category={TEXT_TAGS.h3}
            weight={item.colored ? TEXT_WEIGHT.semibold : TEXT_WEIGHT.medium}
            style={[
              styles.affirmationText,
              {
                fontSize: affirmationFontSize,
                lineHeight: affirmationLineHeight,
                color: item.colored ? DS_COLORS.accent400 : DS_COLORS.ink50,
              },
            ]}
            key={`${item.content}-${index}`}
          >
            {item.content}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    position: 'relative',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    overflow: 'hidden',
    ...dsWebTransition,
  },
  containerHovered: {
    backgroundColor: DS_COLORS.ground600,
  },
  containerPressed: {
    opacity: 0.96,
  },
  texts: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    alignItems: 'center',
    width: '84%',
    gap: 2,
  },
  affirmationText: {
    textAlign: 'center',
    letterSpacing: 0.25,
  },
});

export default MeditativeVisualizer;
