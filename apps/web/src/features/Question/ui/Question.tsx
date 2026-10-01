import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SpreadContext } from 'entities/Spread';
import { useTranslation } from 'react-i18next';
import { useData } from 'shared/DataProvider';
import { QuestionIcon } from 'shared/icons';
import { DS_COLORS, DS_TYPE, dsText } from 'shared/themes/ds';
import { Input, Text, TEXT_TAGS, Tooltip } from 'shared/ui';

/** Единый внутренний отступ поля: текст, иконка и счётчик стоят на одних линиях. */
const FIELD_INSET = 18;
const ICON_SIZE = 28;
/** Иконка по центру первой строки текста. */
const ICON_TOP = FIELD_INSET + DS_TYPE.body.lineHeight / 2 - ICON_SIZE / 2;
const COUNTER_ZONE = 32;

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
            numberOfLines: 3,
            maxLength: 100,
            autoComplete: 'off',
            autoFocus: false,
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
          <QuestionIcon width={ICON_SIZE} height={ICON_SIZE} fill={DS_COLORS.ink100} />
        </Tooltip>
        <Text
          category={TEXT_TAGS.label}
          style={styles.maxSize}
          numberOfLines={1}
        >{`${question?.length ?? 0}/${100}`}</Text>
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
  input: {
    flex: 1,
    paddingTop: FIELD_INSET,
    paddingLeft: FIELD_INSET,
    paddingRight: FIELD_INSET + ICON_SIZE + 12,
    paddingBottom: FIELD_INSET + COUNTER_ZONE / 2,
  },
  maxSize: {
    ...dsText('micro', `${DS_COLORS.ink100}B3`),
    position: 'absolute',
    bottom: FIELD_INSET - 4,
    right: FIELD_INSET,
  },
  questionIconWrapper: {
    position: 'absolute',
    right: FIELD_INSET - 4,
    top: ICON_TOP,
  },
  error: {
    paddingTop: 8,
    color: DS_COLORS.alarm600,
  },
});

export default Question;
