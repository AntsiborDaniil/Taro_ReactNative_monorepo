import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { closeModal, type ModalStackItem } from './model/modalsSlice';
import { getModal, type ModalRegistryEntry } from './registry';
import { ModalSheet, useModalSheetClose } from './ModalSheet';

/**
 * Глобальный модальный слой: рендерит верхнюю модалку стека `modals` по её
 * id из реестра (registerModal). Остальные модалки в стеке остаются
 * смонтированы через state, но видна только верхняя (как обычный стек листов).
 */
export function ModalRoot(): ReactElement | null {
  const { t } = useTranslation();
  const stack = useAppSelector((state) => state.modals.stack);
  const dispatch = useAppDispatch();

  const top = stack.length > 0 ? stack[stack.length - 1] : null;
  const entry = top ? getModal(top.id) : undefined;
  const title = entry?.titleKey ? t(entry.titleKey) : entry?.title;

  const close = () => {
    if (top) {
      dispatch(closeModal(top.id));
    }
  };

  return (
    <ModalSheet open={Boolean(top)} onClose={close} title={title}>
      {top && entry ? <StackModal entry={entry} item={top} /> : null}
    </ModalSheet>
  );
}

/** onClose дочерней модалки идёт через лист, чтобы кнопка тоже дождалась выхода. */
function StackModal({ entry, item }: { entry: ModalRegistryEntry; item: ModalStackItem }): ReactElement {
  const requestClose = useModalSheetClose();
  const onClose = requestClose ?? (() => undefined);
  return <entry.Component {...item.props} onClose={onClose} />;
}
