import i18next from 'i18next';
import type { AppLanguage } from './namespaces';

const META_DESCRIPTION_ID = 'app-meta-description';
const OG_TITLE_ID = 'app-og-title';
const OG_DESCRIPTION_ID = 'app-og-description';
const OG_LOCALE_ID = 'app-og-locale';
const TWITTER_TITLE_ID = 'app-twitter-title';
const TWITTER_DESCRIPTION_ID = 'app-twitter-description';

function setMetaContent(id: string, content: string): void {
  if (typeof document === 'undefined') return;
  const node = document.getElementById(id);
  if (node && 'content' in node) {
    (node as HTMLMetaElement).content = content;
  }
}

/** `<html lang>` и document/meta title под текущий язык интерфейса. */
export async function syncDocumentMeta(lng: AppLanguage): Promise<void> {
  if (typeof document === 'undefined') return;

  const htmlLang = lng === 'en' ? 'en' : 'ru';
  document.documentElement.lang = htmlLang;

  const title = i18next.t('core:seo.documentTitle', { lng });
  const description = i18next.t('core:seo.metaDescription', { lng });
  document.title = title;

  setMetaContent(META_DESCRIPTION_ID, description);
  setMetaContent(OG_TITLE_ID, title);
  setMetaContent(OG_DESCRIPTION_ID, description);
  setMetaContent(OG_LOCALE_ID, lng === 'en' ? 'en_US' : 'ru_RU');
  setMetaContent(TWITTER_TITLE_ID, title);
  setMetaContent(TWITTER_DESCRIPTION_ID, description);
}
