import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { timingSafeEqual } from 'node:crypto';
import { useMemoryBackend } from '../lib/devMode';
import { getTelegramBotToken } from '../lib/env';
import { parseAcquisitionStartPayload } from '../lib/acquisitionSources';
import { createSupportTicket } from '../services/adminService';
import { recordTelegramAcquisition } from '../services/acquisitionService';

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

function assertBotSecret(request: {
  headers: Record<string, string | string[] | undefined>;
}): boolean {
  const header = request.headers['x-support-secret'];
  const provided = Array.isArray(header) ? header[0] : header;
  if (!provided) {
    return false;
  }
  return secretsMatch(provided, getTelegramBotToken());
}

export const internalSupportRoute = async (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) => {
  fastify.post<{
    Body: {
      telegramId: number;
      username?: string | null;
      displayName?: string | null;
      message: string;
    };
  }>('/internal/support-tickets', async (request, reply) => {
    if (useMemoryBackend()) {
      return reply.status(503).send({ message: 'Support ingest requires Supabase' });
    }

    if (!assertBotSecret(request)) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const body = request.body ?? ({} as typeof request.body);
    const telegramId = Number(body.telegramId);
    const message = typeof body.message === 'string' ? body.message : '';
    if (!Number.isFinite(telegramId) || telegramId <= 0 || !message.trim()) {
      return reply.status(400).send({ message: 'Invalid ticket payload' });
    }

    const created = await createSupportTicket({
      telegramId,
      username: body.username,
      displayName: body.displayName,
      message,
    });

    return reply.status(201).send(created);
  });

  fastify.post<{
    Body: {
      telegramId: number;
      source?: string;
      username?: string | null;
      displayName?: string | null;
    };
  }>('/internal/acquisition', async (request, reply) => {
    if (!assertBotSecret(request)) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const body = request.body ?? ({} as typeof request.body);
    const telegramId = Number(body.telegramId);
    const source = parseAcquisitionStartPayload(String(body.source ?? ''));

    if (!Number.isFinite(telegramId) || telegramId <= 0 || !source) {
      return reply.status(400).send({ message: 'Invalid acquisition payload' });
    }

    try {
      const result = await recordTelegramAcquisition({
        telegramId,
        source,
        username: body.username,
        displayName: body.displayName,
      });
      return reply.status(200).send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Failed to record acquisition' });
    }
  });
};
