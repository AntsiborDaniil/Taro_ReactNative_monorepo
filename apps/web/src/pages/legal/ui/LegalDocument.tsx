import { Fragment } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTabRailLayout } from 'app/navigation/tabs/TabRailLayoutContext';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import {
  fillLegalPlaceholders,
  getLegalDocumentByRoute,
  LEGAL_DOCUMENTS,
  LEGAL_UPDATED_AT,
  type LegalBlock,
} from 'shared/config/legal';
import { useNativeNavigation } from 'shared/hooks';
import { WEB_HOVER_TRANSITION } from 'shared/lib';
import { COLORS, getColorOpacity } from 'shared/themes';
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
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNativeNavigation();
  const { sceneContentWidth } = useTabRailLayout();

  const document = getLegalDocumentByRoute(route.name);
  const contentMax = Math.min(720, Math.max(300, sceneContentWidth - 32));

  if (!document) {
    return (
      <ScreenLayout>
        <Header title={t('settings:legal.title')} hideSpreadQuota />
      </ScreenLayout>
    );
  }

  const otherDocuments = LEGAL_DOCUMENTS.filter(
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
              category={TEXT_TAGS.h4}
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
    borderColor: getColorOpacity(COLORS.Primary, 18),
    backgroundColor: COLORS.Background2,
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 8,
  },
  heroTitle: {
    color: COLORS.Content,
  },
  heroShort: {
    color: getColorOpacity(COLORS.Content, 64),
    lineHeight: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(132, 176, 230, 0.26)',
    backgroundColor: 'rgba(132, 176, 230, 0.1)',
    marginTop: 2,
  },
  badgeText: {
    color: 'rgba(216, 228, 247, 0.9)',
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(132, 176, 230, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 10,
  },
  sectionTitle: {
    color: COLORS.Content,
    letterSpacing: 0.2,
  },
  paragraph: {
    color: getColorOpacity(COLORS.Content, 76),
    lineHeight: 22,
  },
  note: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Primary, 30),
    backgroundColor: getColorOpacity(COLORS.Primary, 9),
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  noteText: {
    color: getColorOpacity(COLORS.Content, 88),
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
    backgroundColor: getColorOpacity(COLORS.Primary, 70),
    marginTop: 8,
    flexShrink: 0,
  },
  listText: {
    flex: 1,
    minWidth: 0,
    color: getColorOpacity(COLORS.Content, 74),
    lineHeight: 21,
  },
  fields: {
    gap: 10,
  },
  fieldRow: {
    gap: 2,
  },
  fieldLabel: {
    color: getColorOpacity(COLORS.Content, 48),
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
    color: getColorOpacity(COLORS.Content, 48),
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(132, 176, 230, 0.24)',
    backgroundColor: 'rgba(132, 176, 230, 0.08)',
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' as const, ...WEB_HOVER_TRANSITION } as object)
      : {}),
  },
  chipActive: {
    borderColor: getColorOpacity(COLORS.Primary, 44),
    backgroundColor: getColorOpacity(COLORS.Primary, 14),
  },
  chipText: {
    color: 'rgba(216, 228, 247, 0.86)',
  },
  chipPrimary: {
    borderColor: getColorOpacity(COLORS.Primary, 40),
    backgroundColor: getColorOpacity(COLORS.Primary, 10),
  },
  chipPrimaryText: {
    color: COLORS.Primary,
  },
});

export default LegalDocument;
