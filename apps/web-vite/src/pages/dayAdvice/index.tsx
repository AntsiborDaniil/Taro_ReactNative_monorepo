import { useLayoutEffect, type ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { DAY_ADVICE_SPREAD, selectSpread } from '@entities/spread';
import { useAppDispatch } from '@shared/lib/store';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';

/**
 * Перенос apps/web/src/pages/dayAdvice: выбирает simple_daySuggest и сразу
 * открывает выбор карты (/reading). Вопрос «Совету дня» не нужен, поэтому
 * промежуточного экрана расклада нет. useLayoutEffect — чтобы расклад был
 * выбран раньше, чем сработает переход в <Navigate>.
 */
export default function DayAdvicePage(): ReactElement {
  const dispatch = useAppDispatch();

  useLayoutEffect(() => {
    dispatch(selectSpread(DAY_ADVICE_SPREAD));
    reachMetrikaGoal(MetrikaGoal.spreadStarted, { spreadId: DAY_ADVICE_SPREAD.id });
  }, [dispatch]);

  return <Navigate to="/reading" replace />;
}
