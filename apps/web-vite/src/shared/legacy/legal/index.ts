import documentsRu from './documents.ru.json';
import entity from './entity.json';

/** Блоки/разделы/документы с `requires` показываются, только когда реквизиты заполнены. */
type Gated = { requires?: string[] };

export type LegalBlock = Gated &
  (
    | { type: 'p'; text: string }
    | { type: 'note'; text: string }
    | { type: 'list'; items: string[] }
    | { type: 'fields'; fields: Array<{ label: string; value: string }> }
  );

export type LegalSection = Gated & {
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocument = Gated & {
  id: string;
  /** Имя экрана в стеке библиотеки (NavigationRoute). */
  route: string;
  /** Адрес статической страницы: /legal/<slug>.html */
  slug: string;
  title: string;
  short: string;
  sections: LegalSection[];
};

export type LegalEntity = typeof entity;

/** Реквизиты продавца. Пустые поля нужно заполнить в entity.json. */
export const LEGAL_ENTITY: LegalEntity = entity;

export const LEGAL_UPDATED_AT = LEGAL_ENTITY.updatedAt;

export function hasEntityField(field: string): boolean {
  return !!String(
    (LEGAL_ENTITY as Record<string, string>)[field] ?? ''
  ).trim();
}

function isAvailable(item: Gated): boolean {
  return (item.requires ?? []).every(hasEntityField);
}

/** Документы без незаполненных реквизитов: скрытые блоки вернутся после заполнения entity.json. */
export const LEGAL_DOCUMENTS: LegalDocument[] = (
  documentsRu.documents as unknown as LegalDocument[]
)
  .filter(isAvailable)
  .map((document) => ({
    ...document,
    sections: document.sections.filter(isAvailable).map((section) => ({
      ...section,
      blocks: section.blocks.filter(isAvailable),
    })),
  }))
  .map((document) => ({
    ...document,
    sections: document.sections.filter((section) => section.blocks.length > 0),
  }));

/** Поля, без которых документы юридически неполные. */
export const REQUIRED_ENTITY_FIELDS = [
  'legalStatus',
  'legalName',
  'inn',
  'email',
] as const;

export function getMissingEntityFields(): string[] {
  return REQUIRED_ENTITY_FIELDS.filter((field) => !hasEntityField(field));
}

/** Подставляет реквизиты вместо {{inn}}, {{email}} и т. п. */
export function fillLegalPlaceholders(text: string): string {
  return text.replace(/{{(\w+)}}/g, (_match, key: string) => {
    const value = (LEGAL_ENTITY as Record<string, string>)[key];
    return value?.trim() ? value : '';
  });
}

if (import.meta.env.DEV) {
  const missing = getMissingEntityFields();
  if (missing.length) {
    console.warn(
      `[legal] Не заполнены реквизиты (${missing.join(', ')}) — ` +
        'src/shared/config/legal/entity.json. Блоки с реквизитами скрыты.'
    );
  }
}

export function getLegalDocumentByRoute(
  route: string
): LegalDocument | undefined {
  return LEGAL_DOCUMENTS.find((document) => document.route === route);
}

export function getLegalDocumentById(id: string): LegalDocument | undefined {
  return LEGAL_DOCUMENTS.find((document) => document.id === id);
}

/** Публичный адрес статической копии документа (см. scripts/generate-legal-html.mjs). */
export function getLegalDocumentUrl(id: string): string | undefined {
  const document = getLegalDocumentById(id);
  if (!document) {
    return undefined;
  }
  return `${LEGAL_ENTITY.site.replace(/\/$/, '')}/legal/${document.slug}.html`;
}
