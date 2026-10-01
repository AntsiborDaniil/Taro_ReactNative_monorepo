import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

const worker = setupWorker(...handlers);

/** Стартует MSW в dev при VITE_USE_MOCKS=1. В проде main.tsx этот модуль не импортирует. */
export async function startMockWorker(): Promise<void> {
  await worker.start({ onUnhandledRequest: 'bypass' });
}
