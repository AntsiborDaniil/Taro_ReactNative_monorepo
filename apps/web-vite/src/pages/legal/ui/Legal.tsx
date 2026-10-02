import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  fillLegalPlaceholders,
  getLegalDocuments,
  hasEntityField,
  LEGAL_ENTITY,
  LEGAL_UPDATED_AT,
} from '@legacy-legal';
import { ChevronRightIcon, Header, Text } from '@shared/ui';
import styles from './Legal.module.css';

/**
 * Перенос apps/web/src/pages/legal/ui/Legal.tsx (только логика/данные —
 * @legacy-legal, RN-разметка заменена на DS-карточки). Колонка max 720.
 * Список документов зависит от языка интерфейса (ru/en).
 */
export default function LegalPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const documents = getLegalDocuments(i18n.language);
  const email = LEGAL_ENTITY.email?.trim();
  const supportBot = LEGAL_ENTITY.supportBot?.trim();

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t('settings:legal.title')} />
        <div className={styles.hero}>
          <Text role="label" as="span" className={styles.eyebrow}>
            {t('settings:legal.eyebrow')}
          </Text>
          <Text role="title" as="h2">
            {LEGAL_ENTITY.brand}
          </Text>
          <Text role="body" tone="ink100">
            {t('settings:legal.hero.body')}
          </Text>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>
              <Text role="label" as="span">
                {t('settings:legal.updated', { date: LEGAL_UPDATED_AT })}
              </Text>
            </span>
            <span className={`${styles.badge} ${styles.badgeAge}`}>
              <Text role="label" as="span" tone="accent">
                {t('settings:legal.badge.age')}
              </Text>
            </span>
          </div>
        </div>

        <div className={styles.list}>
          {documents.map((document, index) => (
            <Link key={document.id} to={`/documents/${document.id}`} className={styles.docRow}>
              <span className={styles.docIndex}>
                <Text role="label" as="span">
                  {String(index + 1)}
                </Text>
              </span>
              <span className={styles.docTextCol}>
                <Text role="body" as="span">
                  {document.title}
                </Text>
                <Text role="micro" as="span" tone="ink100">
                  {document.short}
                </Text>
              </span>
              <ChevronRightIcon width={18} height={18} />
            </Link>
          ))}
        </div>

        <Text role="micro" tone="ink100" className={styles.disclaimer}>
          {t('settings:legal.disclaimer')}
        </Text>
        {i18n.language !== 'ru' ? (
          <Text role="micro" tone="ink100" className={styles.disclaimer}>
            {t('settings:legal.languageNote')}
          </Text>
        ) : null}

        <div className={styles.contactCard}>
          <Text role="title" as="h3">
            {t('settings:legal.contacts.title')}
          </Text>
          <Text role="body" tone="ink100">
            {t('settings:legal.contacts.body')}
          </Text>
          <div className={styles.contactActions}>
            {email ? (
              <a className={styles.contactButton} href={`mailto:${email}`}>
                {t('settings:legal.contacts.email')}
              </a>
            ) : null}
            {supportBot ? (
              <a className={styles.contactButton} href={supportBot} target="_blank" rel="noreferrer">
                {t('settings:legal.contacts.telegram')}
              </a>
            ) : null}
          </div>
          {hasEntityField('legalName') ? (
            <Text role="micro" tone="ink100">
              {fillLegalPlaceholders(t('settings:legal.contacts.entityLine'))}
            </Text>
          ) : null}
        </div>
      </div>
    </div>
  );
}
