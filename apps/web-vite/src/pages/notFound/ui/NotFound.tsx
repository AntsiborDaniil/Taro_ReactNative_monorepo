import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getImage } from '@shared/lib/getImage';
import { Button, StatusScreen } from '@shared/ui';

const COPY = {
  ru: { title: 'Страница не найдена', description: 'Такой страницы не существует или она была перемещена.', home: 'На главную' },
  en: { title: 'Page not found', description: 'This page does not exist or has been moved.', home: 'Go home' },
};

/**
 * 404 — перенос визуала «пустого состояния» DS (см. pages/errorBoundary),
 * картинка core/notFound. Роутер отдаёт эту страницу для любого неизвестного
 * пути (см. app/router.tsx `{ path: '*' }`).
 */
export default function NotFoundPage(): ReactElement {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const copy = i18n.language?.startsWith('ru') ? COPY.ru : COPY.en;

  return (
    <StatusScreen
      image={getImage(['core', 'notFound'])}
      title={copy.title}
      description={copy.description}
      action={
        <Button variant="action" fullWidth onClick={() => navigate('/')}>
          {copy.home}
        </Button>
      }
    />
  );
}
