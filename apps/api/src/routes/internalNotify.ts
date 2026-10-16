import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { timingSafeEqual } from 'node:crypto';
import { useMemoryBackend } from '../lib/devMode';
import { getTelegramBotToken } from '../lib/env';
import {
  SUBSCRIBER_EVENTS,
  recordSubscriberEvent,
  type SubscriberEvent,
} from '../services/telegramSubscribersService';
import {
  runBroadcastDailyFreeOnce,
  startDailyFreeNudges,
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
  // Рассылка идёт в фоне, ответ сразу 202: прогон по тысячам подписчиков с паузой 40 мс
  // занимает минуты, а прокси Render/таймаут бота оборвали бы долгий запрос. Это безопасно:
  // идемпотентность даёт атомарный захват дня на каждого подписчика, а недошедшие
  // остаются кандидатами следующего (часового) прогона бота.
  fastify.post('/internal/notify/daily-free', async (request, reply) => {
    if (!assertBotSecret(request)) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    try {
      const { started } = startDailyFreeNudges();
      return reply.status(202).send({ accepted: true, started });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Failed to run daily-free nudges' });
    }
  });

  // Реестр подписчиков: бот сообщает /start, сообщения и my_chat_member (kicked/member).
  fastify.post<{
    Body: { telegramId: number; event: SubscriberEvent; languageCode?: string | null };
  }>(
    '/internal/bot-subscribers',
    {
      schema: {
        body: {
          type: 'object',
          required: ['telegramId', 'event'],
          properties: {
            telegramId: { type: 'integer', minimum: 1 },
            event: { type: 'string', enum: [...SUBSCRIBER_EVENTS] },
            languageCode: { type: ['string', 'null'], maxLength: 16 },
          },
        },
      },
    },
    async (request, reply) => {
      if (!assertBotSecret(request)) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }
      try {
        await recordSubscriberEvent(request.body);
        return reply.status(200).send({ ok: true });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Failed to record subscriber' });
      }
    },
  );

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
