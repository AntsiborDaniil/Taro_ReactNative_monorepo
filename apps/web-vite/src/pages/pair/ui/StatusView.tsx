import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PairView } from '@features/pairReading';
import { getImage } from '@shared/lib/getImage';
import { Button, StatusScreen } from '@shared/ui';

export type PairStatusKind = 'expired' | 'revoked' | 'taken' | 'notFound';

/**
 * Финальные состояния пары, где делать уже нечего: истекла, отменена, слот занят,
 * не найдена. Одно действие: автору — «Создать новое приглашение», остальным — свой расклад.
 */
export function StatusView({ kind, pair }: { kind: PairStatusKind; pair?: PairView }): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthor = pair?.role === 'author';

  let description = t(`together:pair.status.${kind}.text`);
  if (kind === 'expired' && isAuthor) {
    description = t(
      pair?.refunded
        ? (pair.charged ?? 0) > 0
          ? 'together:pair.status.expired.refunded'
          : 'together:pair.status.expired.freeBack'
        : 'together:pair.status.expired.authorText',
    );
  }

  return (
    <StatusScreen
      image={getImage(['core', 'notFound'])}
      title={t(`together:pair.status.${kind}.title`)}
      description={description}
      action={
        <Button variant="action" fullWidth onClick={() => navigate('/spreads/together_pair')}>
          {isAuthor ? t('together:pair.status.createNew') : t('together:pair.status.makeOwn')}
        </Button>
      }
    />
  );
}
