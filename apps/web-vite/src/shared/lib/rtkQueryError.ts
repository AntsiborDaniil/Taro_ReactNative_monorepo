/** Сетевой/транспортный сбой RTK Query (не HTTP 4xx/5xx от сервера). */
export function isRtkNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const status = (error as { status?: number | string }).status;
  return (
    status === 'FETCH_ERROR' ||
    status === 'TIMEOUT_ERROR' ||
    status === 'PARSING_ERROR'
  );
}

export function rtkErrorStatus(error: unknown): number | string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  return (error as { status?: number | string }).status;
}
