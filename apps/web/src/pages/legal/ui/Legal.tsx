import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTabRailLayout } from 'app/navigation/tabs/TabRailLayoutContext';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import {
  fillLegalPlaceholders,
  hasEntityField,
  LEGAL_DOCUMENTS,
  LEGAL_ENTITY,
  LEGAL_UPDATED_AT,
} from 'shared/config/legal';
import { useNativeNavigation } from 'shared/hooks';
import { ChevronRightIcon } from 'shared/icons';
import { WEB_HOVER_TRANSITION } from 'shared/lib';
import { COLORS, getColorOpacity } from 'shared/themes';
import type { PressableWebState } from 'shared/types';
import { ScreenLayout, Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

function Legal() {
  const { t, i18n } = useTranslation();
  const navigation = useNativeNavigation();
  const { sceneContentWidth } = useTabRailLayout();

  const contentMax = Math.min(680, Math.max(300, sceneContentWidth - 32));

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
            <View style={styles.heroGlow} pointerEvents="none" />
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
            {LEGAL_DOCUMENTS.map((document, index) => (
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
                {fillLegalPlaceholders(
                  '{{legalStatus}} {{legalName}} · ИНН {{inn}}'
                )}
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
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Primary, 20),
    backgroundColor: COLORS.Background2,
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 8,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow:
            '0 14px 36px rgba(8, 12, 20, 0.38), inset 0 1px 0 rgba(246, 192, 27, 0.07)',
        } as object)
      : {}),
  },
  heroGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 999,
    right: -70,
    top: -110,
    backgroundColor: getColorOpacity(COLORS.Primary, 14),
    ...(Platform.OS === 'web' ? ({ filter: 'blur(18px)' } as object) : {}),
  },
  heroEyebrow: {
    color: getColorOpacity(COLORS.Primary, 82),
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: COLORS.Content,
  },
  heroBody: {
    color: getColorOpacity(COLORS.Content, 66),
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
    borderColor: 'rgba(132, 176, 230, 0.26)',
    backgroundColor: 'rgba(132, 176, 230, 0.1)',
  },
  badgeText: {
    color: 'rgba(216, 228, 247, 0.9)',
  },
  badgeAge: {
    borderColor: getColorOpacity(COLORS.Primary, 38),
    backgroundColor: getColorOpacity(COLORS.Primary, 12),
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
    borderColor: 'rgba(246, 192, 27, 0.14)',
    backgroundColor: COLORS.Background2,
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' as const, ...WEB_HOVER_TRANSITION } as object)
      : {}),
  },
  docRowActive: {
    borderColor: getColorOpacity(COLORS.Primary, 34),
    backgroundColor: 'rgba(100, 152, 202, 0.12)',
  },
  docIndex: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Primary, 40),
    backgroundColor: getColorOpacity(COLORS.Primary, 12),
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
    color: getColorOpacity(COLORS.Content, 58),
    lineHeight: 17,
  },
  disclaimer: {
    color: getColorOpacity(COLORS.Content, 50),
    lineHeight: 17,
    paddingHorizontal: 4,
  },
  contactCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(132, 176, 230, 0.22)',
    backgroundColor: 'rgba(16, 25, 37, 0.72)',
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 8,
  },
  contactTitle: {
    color: COLORS.Content,
  },
  contactBody: {
    color: getColorOpacity(COLORS.Content, 62),
    lineHeight: 19,
  },
  contactActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  contactButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Primary, 38),
    backgroundColor: getColorOpacity(COLORS.Primary, 10),
    ...(Platform.OS === 'web'
      ? ({ cursor: 'pointer' as const, ...WEB_HOVER_TRANSITION } as object)
      : {}),
  },
  contactButtonActive: {
    borderColor: getColorOpacity(COLORS.Primary, 60),
    backgroundColor: getColorOpacity(COLORS.Primary, 18),
  },
  contactButtonText: {
    color: COLORS.Primary,
  },
  contactMeta: {
    color: getColorOpacity(COLORS.Content, 44),
    marginTop: 4,
  },
});

export default Legal;
