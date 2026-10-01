import type { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { closeModal } from './model/modalsSlice';
import { getModal } from './registry';
import { ModalSheet } from './ModalSheet';

/**
 * Глобальный модальный слой: рендерит верхнюю модалку стека `modals` по её
 * id из реестра (registerModal). Остальные модалки в стеке остаются
 * смонтированы через state, но видна только верхняя (как обычный стек листов).
 */
export function ModalRoot(): ReactElement | null {
  const stack = useAppSelector((state) => state.modals.stack);
  const dispatch = useAppDispatch();

  const top = stack.length > 0 ? stack[stack.length - 1] : null;
  const entry = top ? getModal(top.id) : undefined;

  const close = () => {
    if (top) {
      dispatch(closeModal(top.id));
    }
  };

  return (
    <ModalSheet open={Boolean(top)} onClose={close} title={entry?.title}>
      {top && entry ? <entry.Component onClose={close} {...top.props} /> : null}
    </ModalSheet>
  );
}
