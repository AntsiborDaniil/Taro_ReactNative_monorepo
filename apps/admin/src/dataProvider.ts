import simpleRestProvider from 'ra-data-simple-rest';
import { fetchUtils, type DataProvider, type Options } from 'react-admin';
import { adminHeaders, getApiBase } from './auth';

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const err = error as { name?: string; message?: string; status?: number };
  if (err.name === 'AbortError') {
    return true;
  }
  const message = String(err.message || '').toLowerCase();
  return (
    message.includes('abort') ||
    message.includes('cancel') ||
    message === 'the user aborted a request.'
  );
}

const httpClient: typeof fetchUtils.fetchJson = async (url, options: Options = {}) => {
  try {
    return await fetchUtils.fetchJson(url, {
      ...options,
      headers: adminHeaders(options.headers),
      credentials: 'include',
    });
  } catch (error) {
    // React Admin / React Query abort previous in-flight requests; don't toast "cancelled".
    if (isAbortError(error)) {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw { message: false, name: 'AbortError' };
    }
    throw error;
  }
};

export const dataProvider: DataProvider = simpleRestProvider(
  `${getApiBase()}/api/admin`,
  httpClient
);
