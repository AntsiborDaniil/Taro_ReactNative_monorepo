import { acquisitionSourceFromStartParam } from '../lib/acquisitionSources';
import { useMemoryBackend } from '../lib/devMode';
import { getSupabaseAdmin } from '../lib/supabase';

/**
 * Первая Telegram-авторизация по ссылке `startapp=pair_… / gift_…`: пишем
 * profiles.acquisition_source, только если он ещё пуст (first-touch не перетираем).
 * Атрибуция не должна ломать вход — ошибки глотаем.
 */
export async function applyStartParamAcquisition(
  userId: string,
  startParam: string | null | undefined
): Promise<void> {
  const source = acquisitionSourceFromStartParam(startParam);
  if (!source || useMemoryBackend()) return;
  try {
    const admin = getSupabaseAdmin();
    await admin
      .from('profiles')
      .update({ acquisition_source: source, acquisition_at: new Date().toISOString() })
      .eq('id', userId)
      .is('acquisition_source', null);
  } catch (error) {
    console.error('[auth telegram] start_param acquisition failed:', error);
  }
}
