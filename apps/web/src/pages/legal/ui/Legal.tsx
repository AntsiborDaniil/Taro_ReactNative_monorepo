import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTabRailLayout } from 'app/navigation/tabs/TabRailLayoutContext';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import {
  fillLegalPlaceholders,
  getLegalDocuments,
  hasEntityField,
  LEGAL_ENTITY,
  LEGAL_UPDATED_AT,
} from 'shared/config/legal';
import { useNativeNavigation } from 'shared/hooks';
import { ChevronRightIcon } from 'shared/icons';
import { WEB_HOVER_TRANSITION } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { DS_COLORS } from 'shared/themes/ds';
import type { PressableWebState } from 'shared/types';
import { ScreenLayout, Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

function Legal() {
  const { t, i18n } = useTranslation();
  const navigation = useNativeNavigation();
  const { sceneContentWidth } = useTabRailLayout();
  const documents = getLegalDocuments(i18n.language);

  const contentMax = Math.min(720, Math.max(300, sceneContentWidth - 32));

  const email = LEGAL_ENTITY.email?.trim();
  const supportBot = LEGAL_ENTITY.supportBot?.trim();

  const openLink = (url: string) => {
    void Linking.openURL(url);
  };

  return (
    <ScreenLayout>
      <Header title={t('settings:legal.title')} hideSpreadQuota />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollInner}
      >
        <View style={[styles.column, { maxWidth: contentMax }]}>
          <View style={styles.hero}>
            <Text
              category={TEXT_TAGS.label}
              weight={TEXT_WEIGHT.semibold}
              style={styles.heroEyebrow}
            >
              {t('settings:legal.eyebrow')}
            </Text>
            <Text
              category={TEXT_TAGS.h3}
              weight={TEXT_WEIGHT.semibold}
              style={styles.heroTitle}
            >
              {LEGAL_ENTITY.brand}
            </Text>
            <Text category={TEXT_TAGS.p2} style={styles.heroBody}>
              {t('settings:legal.hero.body')}
            </Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text category={TEXT_TAGS.label} style={styles.badgeText}>
                  {t('settings:legal.updated', { date: LEGAL_UPDATED_AT })}
                </Text>
              </View>
              <View style={[styles.badge, styles.badgeAge]}>
                <Text category={TEXT_TAGS.label} style={styles.badgeAgeText}>
                  {t('settings:legal.badge.age')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.list}>
            {documents.map((document, index) => (
              <Pressable
                key={document.id}
                accessibilityRole="button"
                accessibilityLabel={document.title}
                onPress={() => navigation.navigate(document.route as never)}
                style={(state: PressableWebState) => [
                  styles.docRow,
                  (state.hovered || state.pressed) && styles.docRowActive,
                ]}
              >
                <View style={styles.docIndex}>
                  <Text
                    category={TEXT_TAGS.label}
                    weight={TEXT_WEIGHT.bold}
                    style={styles.docIndexText}
                  >
                    {String(index + 1)}
                  </Text>
                </View>
                <View style={styles.docTextCol}>
                  <Text
                    category={TEXT_TAGS.h5}
                    weight={TEXT_WEIGHT.semibold}
                    style={styles.docTitle}
                  >
                    {document.title}
                  </Text>
                  <Text category={TEXT_TAGS.label} style={styles.docShort}>
                    {document.short}
                  </Text>
                </View>
                <ChevronRightIcon width={18} height={18} opacity={0.6} />
              </Pressable>
            ))}
          </View>

          <Text category={TEXT_TAGS.label} style={styles.disclaimer}>
            {t('settings:legal.disclaimer')}
          </Text>

          {i18n.language !== 'ru' && (
            <Text category={TEXT_TAGS.label} style={styles.disclaimer}>
              {t('settings:legal.languageNote')}
            </Text>
          )}

          <View style={styles.contactCard}>
            <Text
              category={TEXT_TAGS.h5}
              weight={TEXT_WEIGHT.semibold}
              style={styles.contactTitle}
            >
              {t('settings:legal.contacts.title')}
            </Text>
            <Text category={TEXT_TAGS.p2} style={styles.contactBody}>
              {t('settings:legal.contacts.body')}
            </Text>
            <View style={styles.contactActions}>
              {!!email && (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => openLink(`mailto:${email}`)}
                  style={(state: PressableWebState) => [
                    styles.contactButton,
                    (state.hovered || state.pressed) && styles.contactButtonActive,
                  ]}
                >
                  <Text
                    category={TEXT_TAGS.label}
                    weight={TEXT_WEIGHT.semibold}
                    style={styles.contactButtonText}
                  >
                    {t('settings:legal.contacts.email')}
                  </Text>
                </Pressable>
              )}
              {!!supportBot && (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => openLink(supportBot)}
                  style={(state: PressableWebState) => [
                    styles.contactButton,
                    (state.hovered || state.pressed) && styles.contactButtonActive,
                  ]}
                >
                  <Text
                    category={TEXT_TAGS.label}
                    weight={TEXT_WEIGHT.semibold}
                    style={styles.contactButtonText}
                  >
                    {t('settings:legal.contacts.telegram')}
                  </Text>
                </Pressable>
              )}
            </View>
            {hasEntityField('legalName') && (
              <Text category={TEXT_TAGS.label} style={styles.contactMeta}>
                {fillLegalPlaceholders(t('settings:legal.contacts.entityLine'))}
              </Text>
            )}
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
    paddingBottom: 48,
  },
  column: {
    width: '100%',
    gap: 16,
  },
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 8,
  },
  heroEyebrow: {
    color: DS_COLORS.accent400,
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: COLORS.Content,
  },
  heroBody: {
    color: DS_COLORS.ink100,
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
  },
  badgeText: {
    color: DS_COLORS.ink100,
  },
  badgeAge: {
    borderColor: DS_COLORS.accent400,
    backgroundColor: DS_COLORS.ground700,
  },
  badgeAgeText: {
    color: COLORS.Primary,
  },
  list: {
    gap: 10,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' as const, ...WEB_HOVER_TRANSITION } as object)
      : {}),
  },
  docRowActive: {
    borderColor: DS_COLORS.accent400,
    backgroundColor: DS_COLORS.pressDim,
  },
  docIndex: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    flexShrink: 0,
  },
  docIndexText: {
    color: COLORS.Primary,
    fontSize: 13,
    lineHeight: 16,
  },
  docTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  docTitle: {
    color: COLORS.Content,
  },
  docShort: {
    color: DS_COLORS.ink100,
    lineHeight: 17,
  },
  disclaimer: {
    color: DS_COLORS.ink100,
    lineHeight: 17,
    paddingHorizontal: 4,
  },
  contactCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 8,
  },
  contactTitle: {
    color: COLORS.Content,
  },
  contactBody: {
    color: DS_COLORS.ink100,
    lineHeight: 19,
  },
  contactActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  /** Тихая кнопка: фон ground700, кант ground600. */
  contactButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' as const, ...WEB_HOVER_TRANSITION } as object)
      : {}),
  },
  contactButtonActive: {
    borderColor: DS_COLORS.accent400,
    backgroundColor: DS_COLORS.pressDim,
  },
  contactButtonText: {
    color: COLORS.Primary,
  },
  contactMeta: {
    color: DS_COLORS.ink100,
    marginTop: 4,
  },
});

export default Legal;
