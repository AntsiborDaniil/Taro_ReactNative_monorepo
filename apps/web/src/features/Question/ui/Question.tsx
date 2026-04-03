import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SpreadContext } from 'entities/Spread';
import { useTranslation } from 'react-i18next';
import { useData } from 'shared/DataProvider';
import { QuestionIcon } from 'shared/icons';
import { COLORS } from 'shared/themes';
import { Input, Text, TEXT_TAGS, Tooltip } from 'shared/ui';

function Question() {
  const { question, setQuestion, errors } = useData({ Context: SpreadContext });

  const { t } = useTranslation();

  return (
    <View>
      <View style={styles.questionWrapper}>
        <Input
          baseInputProps={{
            value: question,
            onChangeText: setQuestion,
            style: styles.input,
            multiline: true,
            numberOfLines: 4,
            maxLength: 100,
            autoComplete: 'off',
            textAlignVertical: 'top',
            placeholder: t('spread:question.placeholder'),
          }}
        />
        <Tooltip
          parentWrapperStyle={styles.questionIconWrapper}
          content={
            <Text category={TEXT_TAGS.label}>
              {t('spread:question.tooltip')}
            </Text>
          }
        >
          <QuestionIcon width={34} height={34} fill={COLORS.SpbSky1} />
        </Tooltip>
        <Text
          category={TEXT_TAGS.label}
          style={styles.maxSize}
          numberOfLines={1}
        >{`${question?.length}/${100}`}</Text>
      </View>

      {errors?.question && (
        <Text category={TEXT_TAGS.label} style={styles.error}>
          {t('spread:question.error')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  questionWrapper: { gap: 12, position: 'relative' },
  input: { flex: 1, height: 80, paddingRight: 70 },
  maxSize: {
    position: 'absolute',
    bottom: 8,
    right: 12,
  },
  questionIconWrapper: {
    position: 'absolute',
    right: 12,
    top: 6,
  },
  error: {
    paddingTop: 8,
    color: COLORS.Fury,
  },
});

export default Question;
