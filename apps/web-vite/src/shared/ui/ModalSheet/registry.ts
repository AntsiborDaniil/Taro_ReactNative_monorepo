import type { ComponentType } from 'react';

export type ModalComponentProps = { onClose: () => void } & Record<string, unknown>;

export type ModalRegistryEntry = {
  title?: string;
  Component: ComponentType<ModalComponentProps>;
};

const registry = new Map<string, ModalRegistryEntry>();

/** Регистрирует модалку по id для глобального стека `modals` (ModalRoot). */
export function registerModal(id: string, entry: ModalRegistryEntry): void {
  registry.set(id, entry);
}

export function getModal(id: string): ModalRegistryEntry | undefined {
  return registry.get(id);
}
