import { getTarotAiApiBaseUrl } from '../tarotAiBaseUrl';

/**
 * Best-effort wake for cold Render free tier before Lava checkout/webhook window.
 * Failures are ignored — checkout itself will still hit the API.
 */
export async function wakeCloudApi(): Promise<void> {
  try {
    await fetch(`${getTarotAiApiBaseUrl()}/health`, {
      method: 'GET',
      credentials: 'omit',
    });
  } catch {
    // ignore
  }
}
