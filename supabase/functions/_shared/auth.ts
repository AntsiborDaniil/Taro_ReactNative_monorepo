import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

export type AuthedUser = {
  id: string;
  email: string;
  name: string;
};

export async function getAuthedUser(
  req: Request
): Promise<{ user: AuthedUser | null; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return { user: null, error: 'Authorization token is required' };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return { user: null, error: 'Supabase is not configured' };
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await admin.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: 'Invalid token' };
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('name, email')
    .eq('id', user.id)
    .maybeSingle();

  return {
    user: {
      id: user.id,
      email: profile?.email ?? user.email ?? '',
      name: profile?.name ?? (user.user_metadata?.name as string) ?? '',
    },
  };
}

export function getAdminClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function consumeTarotDailySlot(userId: string): Promise<{
  ok: boolean;
  used: number;
  limit: number;
  day: string;
}> {
  const admin = getAdminClient();
  const limit = Number(Deno.env.get('TAROT_DAILY_INTERPRET_LIMIT') ?? '10');

  const { data, error } = await admin.rpc('consume_tarot_daily_slot_for_user', {
    p_user_id: userId,
    p_limit: limit,
  });

  if (error) {
    throw error;
  }

  return data as {
    ok: boolean;
    used: number;
    limit: number;
    day: string;
  };
}
