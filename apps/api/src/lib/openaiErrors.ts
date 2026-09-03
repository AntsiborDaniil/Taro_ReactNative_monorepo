export class OpenAiProviderError extends Error {
  readonly httpStatus: 503;
  readonly code: 'ai_provider_unavailable';

  constructor(message: string) {
    super(message);
    this.name = 'OpenAiProviderError';
    this.httpStatus = 503;
    this.code = 'ai_provider_unavailable';
  }
}

function readErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }
  const withCode = error as { code?: unknown; error?: { code?: unknown } };
  if (typeof withCode.code === 'string') {
    return withCode.code;
  }
  if (typeof withCode.error?.code === 'string') {
    return withCode.error.code;
  }
  return undefined;
}

function readStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : undefined;
}

export function toOpenAiProviderError(error: unknown): OpenAiProviderError | null {
  const status = readStatus(error);
  const code = readErrorCode(error);
  const billingCodes = new Set([
    'insufficient_quota',
    'credit_balance_exhausted',
    'billing_not_active',
  ]);

  if (status === 429 || (code && billingCodes.has(code))) {
    return new OpenAiProviderError(
      'AI provider is temporarily unavailable'
    );
  }

  return null;
}
