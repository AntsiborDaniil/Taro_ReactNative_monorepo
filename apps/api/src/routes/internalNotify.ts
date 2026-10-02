import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { timingSafeEqual } from 'node:crypto';
import { useMemoryBackend } from '../lib/devMode';
import { getTelegramBotToken } from '../lib/env';
import {
  runBroadcastDailyFreeOnce,
  runDailyFreeNudges,
} from '../services/dailyFreeNotifyService';

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

export const internalNotifyRoute = async (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) => {
  fastify.post('/internal/notify/daily-free', async (request, reply) => {
    if (useMemoryBackend()) {
      return reply.status(503).send({ message: 'Notify requires Supabase' });
    }

    if (!assertBotSecret(request)) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    try {
      const result = await runDailyFreeNudges();
      return reply.status(200).send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Failed to run daily-free nudges' });
    }
  });

  fastify.post('/internal/notify/broadcast-daily-free', async (request, reply) => {
    if (useMemoryBackend()) {
      return reply.status(503).send({ message: 'Notify requires Supabase' });
    }

    if (!assertBotSecret(request)) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    try {
      const result = await runBroadcastDailyFreeOnce();
      return reply.status(200).send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Failed to broadcast daily-free' });
    }
  });
};
