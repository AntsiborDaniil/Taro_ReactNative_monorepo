import { ReactElement, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { PressToUnlock } from 'entities/Spread';
import { useTranslation } from 'react-i18next';
import { TSelectedTarotCard } from 'shared/api';
import { SeparatorIcon } from 'shared/icons';
import { moderateScale } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { Text, TEXT_TAGS } from 'shared/ui';

type TarotTextsProps = {
  card: TSelectedTarotCard;
  interpretation?: string | null;
  hasBlur?: boolean;
  onPressInterpretation?: () => void;
};

function TarotMeanings({
  card,
  interpretation,
  hasBlur,
  onPressInterpretation,
}: TarotTextsProps) {
  const { t } = useTranslation();

  const content = useMemo(() => {
    const texts: ReactElement[] = [];

    if (interpretation) {
      texts.push(
        <TouchableOpacity
          key="summary"
          onPress={onPressInterpretation}
          style={styles.textContainer}
          activeOpacity={1}
        >
          <Text category={TEXT_TAGS.h3} style={styles.textTitle}>
            {t('spread:summaryTitle')}
          </Text>
          <Text style={styles.commonText}>
            {interpretation}
          </Text>
          {hasBlur && <PressToUnlock />}
        </TouchableOpacity>
      );
    }

    if (card.advice) {
      texts.push(
        <View key="advice" style={styles.textContainer}>
          <Text category={TEXT_TAGS.h3} style={styles.textTitle}>
            {t('spread:card.advice.title')}
          </Text>
          <Text style={styles.commonText}>
            {t(card.advice)}
          </Text>
        </View>
      );
    }

    if (card.description) {
      texts.push(
        <View key="description" style={styles.textContainer}>
          <Text category={TEXT_TAGS.h3} style={styles.textTitle}>
            {t('spread:card.description.title')}
          </Text>
          <Text style={styles.commonText}>
            {t(card.description)}
          </Text>
        </View>
      );
    }

    return texts.reduce((acc: ReactElement[], cur, currentIndex) => {
      if (!acc.length) {
        return [cur];
      }

      return [
        ...acc,
        <SeparatorIcon
          key={`separator-${currentIndex}`}
          fill={COLORS.Content}
          width={40}
          height={40}
        />,
        cur,
      ];
    }, []);
  }, [card.advice, card.description, interpretation, t]);

  return (
    <View style={styles.content}>
      {card.advice && (
        <View key="meaning-block">
          <View style={styles.adviceContainer}>
            <Text category={TEXT_TAGS.h3} style={styles.adviceText}>
              {t('spread:card.meaning.title')}
            </Text>
            <Text style={styles.adviceTextCommon}>
              {t(card.meaning)}
            </Text>
          </View>
          <SeparatorIcon fill={COLORS.Content} width={40} height={40} />
        </View>
      )}
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
    alignItems: 'stretch',
    width: '100%',
  },
  adviceContainer: {
    backgroundColor: COLORS.Primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'stretch',
    gap: 8,
    width: '100%',
  },
  adviceText: {
    color: COLORS.Background,
    textAlign: 'center',
  },
  adviceTextCommon: {
    color: COLORS.Background,
    lineHeight: moderateScale(24),
    textAlign: 'left',
  },
  commonText: {
    lineHeight: moderateScale(24),
    textAlign: 'left',
  },
  textContainer: {
    overflow: 'hidden',
    borderRadius: 16,
    gap: 16,
    alignItems: 'stretch',
    width: '100%',
  },
  textTitle: {
    color: COLORS.Primary,
    textAlign: 'center',
  },
});

export default TarotMeanings;
