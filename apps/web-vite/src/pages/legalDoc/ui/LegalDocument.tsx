import type { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  fillLegalPlaceholders,
  getLegalDocumentById,
  getLegalDocuments,
  LEGAL_UPDATED_AT,
  type LegalBlock,
} from '@legacy-legal';
import { Header, Text } from '@shared/ui';
import styles from './LegalDocument.module.css';

function Block({ block }: { block: LegalBlock }): ReactElement {
  if (block.type === 'p') {
    return (
      <Text role="body" tone="ink100" className={styles.paragraph}>
        {fillLegalPlaceholders(block.text)}
      </Text>
    );
  }
  if (block.type === 'note') {
    return (
      <div className={styles.note}>
        <Text role="body">{fillLegalPlaceholders(block.text)}</Text>
      </div>
    );
  }
  if (block.type === 'list') {
    return (
      <div className={styles.list}>
        {block.items.map((item) => (
          <div key={item} className={styles.listItem}>
            <span className={styles.bullet} />
            <Text role="body" tone="ink100">
              {fillLegalPlaceholders(item)}
            </Text>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={styles.fields}>
      {block.fields.map((field) => (
        <div key={field.label}>
          <Text role="micro" tone="ink100">
            {field.label}
          </Text>
          <Text role="body">{fillLegalPlaceholders(field.value)}</Text>
        </div>
      ))}
    </div>
  );
}

/**
 * Документ на языке интерфейса. Статические /legal/*.html остаются на русском
 * (юридически значимая редакция для оплаты).
 */
export default function LegalDocumentPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const { docId } = useParams<{ docId: string }>();
  const document = docId ? getLegalDocumentById(docId, i18n.language) : undefined;

  if (!document) {
    return (
      <div className={styles.page}>
        <div className={styles.column}>
          <Header title={t('settings:legal.title')} />
        </div>
      </div>
    );
  }

  const otherDocuments = getLegalDocuments(i18n.language).filter((item) => item.id !== document.id);

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={document.title} />
        <div className={styles.hero}>
          <Text role="title" as="h2">
            {document.title}
          </Text>
          <Text role="body" tone="ink100">
            {document.short}
          </Text>
          <span className={styles.badge}>
            <Text role="label" as="span">
              {t('settings:legal.updated', { date: LEGAL_UPDATED_AT })}
            </Text>
          </span>
        </div>

        {i18n.language !== 'ru' ? (
          <Text role="micro" tone="ink100" className={styles.languageNote}>
            {t('settings:legal.languageNote')}
          </Text>
        ) : null}

        {document.sections.map((section) => (
          <div key={section.title} className={styles.section}>
            <Text role="title" as="h3">
              {section.title}
            </Text>
            {section.blocks.map((block, index) => (
              <Block key={index} block={block} />
            ))}
          </div>
        ))}

        <div className={styles.otherBlock}>
          <Text role="label" as="span" className={styles.otherTitle}>
            {t('settings:legal.otherDocs')}
          </Text>
          <div className={styles.chips}>
            {otherDocuments.map((item) => (
              <Link key={item.id} to={`/documents/${item.id}`} className={styles.chip}>
                {item.title}
              </Link>
            ))}
            <Link to="/documents" className={`${styles.chip} ${styles.chipPrimary}`}>
              {t('settings:legal.title')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
