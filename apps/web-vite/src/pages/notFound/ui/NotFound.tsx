import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getImage } from '@shared/lib/getImage';
import { Button, StatusScreen } from '@shared/ui';

/**
 * 404 — перенос визуала «пустого состояния» DS (см. pages/errorBoundary),
 * картинка core/notFound. Роутер отдаёт эту страницу для любого неизвестного
 * пути (см. app/router.tsx `{ path: '*' }`).
 */
export default function NotFoundPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <StatusScreen
      image={getImage(['core', 'notFound'])}
      title={t('core:notFound.title')}
      description={t('core:notFound.description')}
      action={
        <Button variant="action" fullWidth onClick={() => navigate('/')}>
          {t('core:notFound.home')}
        </Button>
      }
    />
  );
}
