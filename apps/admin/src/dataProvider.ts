import simpleRestProvider from 'ra-data-simple-rest';
import { fetchUtils, type DataProvider, type Options } from 'react-admin';
import { adminHeaders, getApiBase } from './auth';

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const err = error as { name?: string; message?: string };
  if (err.name === 'AbortError' || err.name === 'CanceledError') {
    return true;
  }
  const message = String(err.message || '').toLowerCase();
  return (
    message.includes('abort') ||
    message.includes('cancel') ||
    message === 'the user aborted a request.'
  );
}

const httpClient: typeof fetchUtils.fetchJson = async (
  url,
  options: Options = {}
) => {
  // React Query aborts the previous in-flight request on remount / mailto click.
  // That surfaces as "cancelled" and blocks opening a user. Do not honor abort.
  const { signal: _signal, ...rest } = options;
  try {
    return await fetchUtils.fetchJson(url, {
      ...rest,
      headers: adminHeaders(rest.headers),
      credentials: 'include',
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw { message: false, name: 'AbortError' };
    }
    throw error;
  }
};

const restProvider = simpleRestProvider(`${getApiBase()}/api/admin`, httpClient);

export const dataProvider: DataProvider = {
  ...restProvider,
  getOne: async (resource, params) => {
    try {
      return await restProvider.getOne(resource, params);
    } catch (error) {
      if (isAbortError(error)) {
        return restProvider.getOne(resource, params);
      }
      throw error;
    }
  },
};
