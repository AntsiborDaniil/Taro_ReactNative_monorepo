import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
import { resetMockState } from './state';

export const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
  resetMockState();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
