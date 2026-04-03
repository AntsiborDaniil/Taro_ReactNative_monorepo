import { useMemo } from 'react';
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
    const texts = [];

    if (interpretation) {
      texts.push(
        <TouchableOpacity
          onPress={onPressInterpretation}
          style={styles.textContainer}
          activeOpacity={1}
        >
          <Text category={TEXT_TAGS.h3} style={styles.textTitle}>
            {t('spread:summaryTitle')}
          </Text>
          <Text style={styles.commonText} key="advice">
            {interpretation}
          </Text>
          {hasBlur && <PressToUnlock />}
        </TouchableOpacity>
      );
    }

    if (card.advice) {
      texts.push(
        <View style={styles.textContainer}>
          <Text category={TEXT_TAGS.h3} style={styles.textTitle}>
            {t('spread:card.advice.title')}
          </Text>
          <Text style={styles.commonText} key="advice">
            {t(card.advice)}
          </Text>
        </View>
      );
    }

    if (card.description) {
      texts.push(
        <View style={styles.textContainer}>
          <Text category={TEXT_TAGS.h3} style={styles.textTitle}>
            {t('spread:card.description.title')}
          </Text>
          <Text style={styles.commonText} key="description">
            {t(card.description)}
          </Text>
        </View>
      );
    }

    return texts.reduce((acc: any[], cur, currentIndex) => {
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
        <>
          <View style={styles.adviceContainer}>
            <Text category={TEXT_TAGS.h3} style={styles.adviceText}>
              {t('spread:card.meaning.title')}
            </Text>
            <Text style={styles.adviceTextCommon} key="meaning">
              {t(card.meaning)}
            </Text>
          </View>
          <SeparatorIcon fill={COLORS.Content} width={40} height={40} />
        </>
      )}
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
    alignItems: 'center',
  },
  adviceContainer: {
    backgroundColor: COLORS.Primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  adviceText: {
    color: COLORS.Background,
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
    alignItems: 'center',
  },
  textTitle: {
    color: COLORS.Primary,
  },
});

export default TarotMeanings;
