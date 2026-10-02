import { Fragment } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTabRailLayout } from 'app/navigation/tabs/TabRailLayoutContext';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import {
  fillLegalPlaceholders,
  getLegalDocumentByRoute,
  getLegalDocuments,
  LEGAL_UPDATED_AT,
  type LegalBlock,
} from 'shared/config/legal';
import { useNativeNavigation } from 'shared/hooks';
import { WEB_HOVER_TRANSITION } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { DS_COLORS } from 'shared/themes/ds';
import { NavigationRoute, type PressableWebState } from 'shared/types';
import { ScreenLayout, Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

function Block({ block }: { block: LegalBlock }) {
  if (block.type === 'p') {
    return (
      <Text category={TEXT_TAGS.p2} style={styles.paragraph}>
        {fillLegalPlaceholders(block.text)}
      </Text>
    );
  }

  if (block.type === 'note') {
    return (
      <View style={styles.note}>
        <Text category={TEXT_TAGS.p2} style={styles.noteText}>
          {fillLegalPlaceholders(block.text)}
        </Text>
      </View>
    );
  }

  if (block.type === 'list') {
    return (
      <View style={styles.list}>
        {block.items.map((item) => (
          <View key={item} style={styles.listItem}>
            <View style={styles.bullet} />
            <Text category={TEXT_TAGS.p2} style={styles.listText}>
              {fillLegalPlaceholders(item)}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.fields}>
      {block.fields.map((field) => (
        <View key={field.label} style={styles.fieldRow}>
          <Text category={TEXT_TAGS.label} style={styles.fieldLabel}>
            {field.label}
          </Text>
          <Text
            category={TEXT_TAGS.p2}
            weight={TEXT_WEIGHT.medium}
            style={styles.fieldValue}
          >
            {fillLegalPlaceholders(field.value)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function LegalDocument() {
  const { t, i18n } = useTranslation();
  const route = useRoute();
  const navigation = useNativeNavigation();
  const { sceneContentWidth } = useTabRailLayout();

  const document = getLegalDocumentByRoute(route.name, i18n.language);
  const contentMax = Math.min(720, Math.max(300, sceneContentWidth - 32));

  if (!document) {
    return (
      <ScreenLayout>
        <Header title={t('settings:legal.title')} hideSpreadQuota />
      </ScreenLayout>
    );
  }

  const otherDocuments = getLegalDocuments(i18n.language).filter(
    (item) => item.id !== document.id
  );

  return (
    <ScreenLayout>
      <Header title={document.title} hideSpreadQuota />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollInner}
      >
        <View style={[styles.column, { maxWidth: contentMax }]}>
          <View style={styles.hero}>
            <Text
              category={TEXT_TAGS.h3}
              weight={TEXT_WEIGHT.semibold}
              style={styles.heroTitle}
            >
              {document.title}
            </Text>
            <Text category={TEXT_TAGS.p2} style={styles.heroShort}>
              {document.short}
            </Text>
            <View style={styles.badge}>
              <Text category={TEXT_TAGS.label} style={styles.badgeText}>
                {t('settings:legal.updated', { date: LEGAL_UPDATED_AT })}
              </Text>
            </View>
          </View>

          {i18n.language !== 'ru' && (
            <Text category={TEXT_TAGS.label} style={styles.languageNote}>
              {t('settings:legal.languageNote')}
            </Text>
          )}

          {document.sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text
                category={TEXT_TAGS.h5}
                weight={TEXT_WEIGHT.semibold}
                style={styles.sectionTitle}
              >
                {section.title}
              </Text>
              {section.blocks.map((block, index) => (
                <Fragment key={index}>
                  <Block block={block} />
                </Fragment>
              ))}
            </View>
          ))}

          <View style={styles.otherBlock}>
            <Text category={TEXT_TAGS.label} style={styles.otherTitle}>
              {t('settings:legal.otherDocs')}
            </Text>
            <View style={styles.chips}>
              {otherDocuments.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => navigation.navigate(item.route as never)}
                  style={(state: PressableWebState) => [
                    styles.chip,
                    (state.hovered || state.pressed) && styles.chipActive,
                  ]}
                >
                  <Text category={TEXT_TAGS.label} style={styles.chipText}>
                    {item.title}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate(NavigationRoute.Legal as never)
                }
                style={(state: PressableWebState) => [
                  styles.chip,
                  styles.chipPrimary,
                  (state.hovered || state.pressed) && styles.chipActive,
                ]}
              >
                <Text category={TEXT_TAGS.label} style={styles.chipPrimaryText}>
                  {t('settings:legal.title')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollInner: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 56,
  },
  column: {
    width: '100%',
    gap: 14,
  },
  hero: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 8,
  },
  heroTitle: {
    color: COLORS.Content,
  },
  heroShort: {
    color: DS_COLORS.ink100,
    lineHeight: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    marginTop: 2,
  },
  badgeText: {
    color: DS_COLORS.ink100,
  },
  languageNote: {
    color: DS_COLORS.ink100,
    lineHeight: 17,
    paddingHorizontal: 4,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 10,
  },
  sectionTitle: {
    color: COLORS.Content,
    letterSpacing: 0.2,
  },
  paragraph: {
    color: DS_COLORS.ink100,
    lineHeight: 24,
  },
  note: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DS_COLORS.accent400,
    backgroundColor: DS_COLORS.ground700,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  noteText: {
    color: DS_COLORS.ink50,
    lineHeight: 21,
  },
  list: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: DS_COLORS.accent400,
    marginTop: 8,
    flexShrink: 0,
  },
  listText: {
    flex: 1,
    minWidth: 0,
    color: DS_COLORS.ink100,
    lineHeight: 21,
  },
  fields: {
    gap: 10,
  },
  fieldRow: {
    gap: 2,
  },
  fieldLabel: {
    color: DS_COLORS.ink100,
    letterSpacing: 0.3,
  },
  fieldValue: {
    color: COLORS.Content,
    lineHeight: 21,
  },
  otherBlock: {
    gap: 8,
    paddingHorizontal: 2,
    marginTop: 4,
  },
  otherTitle: {
    color: DS_COLORS.accent400,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  /** Тихая кнопка: фон ground700, кант ground600. */
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' as const, ...WEB_HOVER_TRANSITION } as object)
      : {}),
  },
  chipActive: {
    borderColor: DS_COLORS.accent400,
    backgroundColor: DS_COLORS.pressDim,
  },
  chipText: {
    color: DS_COLORS.ink100,
  },
  chipPrimary: {
    borderColor: DS_COLORS.accent400,
    backgroundColor: DS_COLORS.ground700,
  },
  chipPrimaryText: {
    color: COLORS.Primary,
  },
});

export default LegalDocument;
