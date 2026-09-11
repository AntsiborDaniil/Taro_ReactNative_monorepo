import simpleRestProvider from 'ra-data-simple-rest';
import { fetchUtils, type DataProvider } from 'react-admin';
import { adminHeaders, getApiBase } from './auth';

const httpClient: typeof fetchUtils.fetchJson = (url, options = {}) => {
  return fetchUtils.fetchJson(url, {
    ...options,
    headers: adminHeaders(options.headers),
    credentials: 'include',
  });
};

export const dataProvider: DataProvider = simpleRestProvider(
  `${getApiBase()}/api/admin`,
  httpClient
);
