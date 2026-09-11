import type { FastifyReply, FastifyRequest } from 'fastify';
import { resolveAuthedUser } from './authRequest';
import { useMemoryBackend } from './devMode';
import { isAdminRole, isSupervisorRole, type AdminRole } from './adminAuth';
import { getSupabaseAdmin } from './supabase';

export type AdminActor = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<AdminActor | null> {
  if (isTelegramClientRequest(request)) {
    reply.status(403).send({
      message: 'Admin is not available from Telegram Mini App',
      code: 'ADMIN_MINIAPP_FORBIDDEN',
    });
    return null;
  }

  if (useMemoryBackend()) {
    reply.status(503).send({
      message: 'Admin requires Supabase (disable memory backend)',
      code: 'ADMIN_UNAVAILABLE',
    });
    return null;
  }

  const user = await resolveAuthedUser(request);
  if (!user) {
    reply.status(401).send({ message: 'Unauthorized' });
    return null;
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('profiles')
    .select('id, email, name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data || !isAdminRole(data.role)) {
    reply.status(403).send({
      message: 'Admin access required',
      code: 'ADMIN_FORBIDDEN',
    });
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
  };
}

export function assertSupervisor(
  actor: AdminActor,
  reply: FastifyReply
): boolean {
  if (isSupervisorRole(actor.role)) {
    return true;
  }
  reply.status(403).send({
    message: 'Supervisor access required',
    code: 'SUPERVISOR_FORBIDDEN',
  });
  return false;
}

function isTelegramClientRequest(request: FastifyRequest): boolean {
  const initHeader = headerValue(request.headers['x-telegram-init-data']);
  if (initHeader) {
    return true;
  }
  const client = headerValue(request.headers['x-tarot-client']);
  if (client?.toLowerCase() === 'miniapp') {
    return true;
  }
  return false;
}

function headerValue(raw: string | string[] | undefined): string | undefined {
  if (Array.isArray(raw)) {
    return raw[0]?.trim() || undefined;
  }
  return raw?.trim() || undefined;
}
