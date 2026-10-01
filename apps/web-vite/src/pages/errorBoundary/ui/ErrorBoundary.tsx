import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useRouteError } from 'react-router-dom';
import { getImage } from '@shared/lib/getImage';
import { Button, StatusScreen } from '@shared/ui';

/**
 * Перенос визуала apps/web/src/pages/errorBoundary/ui/TarotErrorBoundary.tsx
 * на react-router errorElement (см. app/router.tsx) — картинка core/
 * errorBoundary, одна кнопка «На главную» (перезагружает приложение, а не
 * просто навигация, т.к. ошибка может быть в самом дереве роутера).
 */
export default function ErrorBoundaryPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const error = useRouteError();

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error('[router error]', error);
  }

  const handleGoHome = () => {
    navigate('/');
    window.location.reload();
  };

  return (
    <StatusScreen
      image={getImage(['core', 'errorBoundary'])}
      title={t('core:errorBoundary.title')}
      description={t('core:errorBoundary.description')}
      action={
        <Button variant="action" fullWidth onClick={handleGoHome}>
          {t('core:errorBoundary.goHome', { defaultValue: 'Go home' })}
        </Button>
      }
    />
  );
}
