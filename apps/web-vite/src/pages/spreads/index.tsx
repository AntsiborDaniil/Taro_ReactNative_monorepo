import { useEffect, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { SPREAD_SECTIONS, SpreadsCategory } from '@entities/spread';
import { Header, EmptyState } from '@shared/ui';
import { SpreadCatalogCard } from './ui/SpreadCatalogCard';
import styles from './Spreads.module.css';

/**
 * Перенос apps/web/src/pages/spreads/ui/Spreads.tsx — сетка тайлов через CSS
 * grid repeat(auto-fill, minmax(148px, 1fr)) вместо JS-расчёта числа колонок
 * (useSpreadsLayout мерил контейнер и считал columns/tileWidth вручную): grid
 * сам дозаполняет колонку без «слепого» остатка на любой ширине.
 */
export default function SpreadsPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hash } = useLocation();

  // /spreads#free — к разделу бесплатных карт (из модалки «Расклад на сегодня уже сделан»),
  // /spreads#together — к разделу «Вместе» (пара и подарок другу).
  // rAF: AppShell сбрасывает скролл наверх в своём эффекте, который идёт после нашего.
  useEffect(() => {
    if (hash !== '#free' && hash !== '#together') return undefined;
    const anchor = hash.slice(1);
    const id = requestAnimationFrame(() => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [hash]);

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header root title={t('core:page.spreadsGroups')} />
        {!SPREAD_SECTIONS.length ? (
          <EmptyState
            title={t('spread:catalog.empty.title')}
            action={
              <button type="button" className={styles.emptyAction} onClick={() => navigate('/')}>
                {t('spread:catalog.empty.action')}
              </button>
            }
          />
        ) : (
          SPREAD_SECTIONS.map((section) => (
            <section
              key={section.title}
              id={
                section.id === SpreadsCategory.Period
                  ? 'free'
                  : section.id === SpreadsCategory.Together
                    ? 'together'
                    : undefined
              }
              className={styles.section}
            >
              <h2 className={styles.sectionTitle}>{t(section.title)}</h2>
              <div className={styles.grid}>
                {section.data.map((item) => (
                  <SpreadCatalogCard key={item.id} spread={item} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
