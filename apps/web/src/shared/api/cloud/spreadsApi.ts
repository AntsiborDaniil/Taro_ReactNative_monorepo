import { TSpread } from 'shared/api';
import { cloudFetch } from './cloudFetch';
import {
  cloudRecordToSpread,
  spreadToCloudBody,
} from './spreadMapping';
import type {
  CloudSpreadResponse,
  CloudSpreadsListResponse,
} from './types';

export async function listCloudSpreads(options: {
  limit?: number;
  offset?: number;
}): Promise<TSpread[] | null> {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  const result = await cloudFetch<CloudSpreadsListResponse>(
    `/api/spreads?limit=${limit}&offset=${offset}`
  );

  if (!result.ok) {
    return null;
  }

  return result.data.spreads.map(cloudRecordToSpread);
}

export async function createCloudSpread(
  spread: TSpread
): Promise<TSpread | null> {
  const result = await cloudFetch<CloudSpreadResponse>('/api/spreads', {
    method: 'POST',
    body: JSON.stringify(spreadToCloudBody(spread)),
  });

  if (!result.ok) {
    return null;
  }

  return cloudRecordToSpread(result.data.spread);
}

export async function updateCloudSpread(
  spreadId: string,
  patch: {
    interpretation?: string | null;
    question?: string | null;
    payload?: Record<string, unknown>;
  }
): Promise<TSpread | null> {
  const result = await cloudFetch<CloudSpreadResponse>(
    `/api/spreads/${spreadId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }
  );

  if (!result.ok) {
    return null;
  }

  return cloudRecordToSpread(result.data.spread);
}
