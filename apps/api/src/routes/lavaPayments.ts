import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { timingSafeEqual } from 'node:crypto';
import { resolveAuthedUser } from '../lib/authRequest';
import {
  getLavaWebhookSecret,
  getTelegramBotToken,
  isLavaPaymentsConfigured,
} from '../lib/env';
import {
  createLavaCheckoutForUser,
  fulfillLavaPaymentSuccess,
  getLatestPaidReturnForTelegram,
  isValidCheckoutEmail,
  type LavaWebhookPayload,
} from '../services/lavaPaymentsService';
import { CREDIT_PACKS, listAvailablePacks } from '../lib/creditPacks';

function readWebhookApiKey(request: {
  headers: Record<string, string | string[] | undefined>;
}): string | null {
  const raw = request.headers['x-api-key'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || null;
}

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
  try {
    return secretsMatch(provided, getTelegramBotToken());
  } catch {
    return false;
  }
}

export const lavaPaymentsRoute = async (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) => {
  /** Витрина: пакеты, для которых настроен оффер Lava (заряды, цена, метка). */
  fastify.get('/payments/lava/packs', async (_request, reply) => {
    return reply.send({ packs: isLavaPaymentsConfigured() ? listAvailablePacks() : [] });
  });

  fastify.post<{ Body: { email?: string; returnPath?: string; pack?: string } }>(
    '/payments/lava/checkout',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', minLength: 3 },
            returnPath: { type: 'string', maxLength: 200 },
            pack: { type: 'string', enum: CREDIT_PACKS.map((p) => p.id) },
          },
        },
      },
    },
    async (request, reply) => {
      const user = await resolveAuthedUser(request);
      if (!user) {
        return reply.status(401).send({
          code: 'unauthorized',
          message: 'Sign in is required to buy spread credits',
        });
      }

      if (!isLavaPaymentsConfigured()) {
        return reply.status(503).send({
          code: 'lava_not_configured',
          message: 'Lava payments are not configured on this server',
        });
      }

      const email = String(request.body?.email || '').trim();
      if (!isValidCheckoutEmail(email)) {
        return reply.status(400).send({
          code: 'invalid_email',
          message:
            'Оплата доступна только с почтой Яндекса (@yandex.ru, @ya.ru и др.).',
        });
      }

      try {
        const checkout = await createLavaCheckoutForUser({
          userId: user.id,
          email,
          returnPath: request.body?.returnPath,
          packId: request.body?.pack,
        });
        return reply.send({
          paymentUrl: checkout.paymentUrl,
          invoiceId: checkout.invoiceId,
        });
      } catch (error) {
        request.log.error(error);
        const message =
          error instanceof Error ? error.message : 'Checkout failed';
        if (message === 'INVALID_EMAIL') {
          return reply.status(400).send({
            code: 'invalid_email',
            message:
              'Оплата доступна только с почтой Яндекса (@yandex.ru, @ya.ru и др.).',
          });
        }
        if (message === 'PACK_UNAVAILABLE') {
          return reply.status(400).send({
            code: 'pack_unavailable',
            message: 'This credit pack is not available',
          });
        }
        if (message === 'LAVA_NOT_CONFIGURED') {
          return reply.status(503).send({
            code: 'lava_not_configured',
            message: 'Lava payments are not configured on this server',
          });
        }
        if (message === 'LAVA_INVOICE_INCOMPLETE') {
          return reply.status(502).send({
            code: 'lava_checkout_failed',
            message: 'Lava error: incomplete payment response. Try again.',
          });
        }
        // Surface provider text (email rejected, offer issues, etc.)
        const lavaMessage =
          message && !message.startsWith('Lava invoice failed')
            ? message
            : 'Lava error: could not create payment. Try again.';
        return reply.status(502).send({
          code: 'lava_checkout_failed',
          message: lavaMessage.startsWith('Lava')
            ? lavaMessage
            : `Lava error: ${lavaMessage}`,
        });
      }
    }
  );

  /** Bot: путь возврата после lava_success + текущий баланс кредитов. */
  fastify.get<{ Querystring: { telegramId?: string } }>(
    '/internal/payments/latest-return',
    async (request, reply) => {
      if (!assertBotSecret(request)) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const telegramId = Number(request.query?.telegramId);
      if (!Number.isFinite(telegramId) || telegramId <= 0) {
        return reply.status(400).send({ message: 'Invalid telegramId' });
      }

      try {
        const latest = await getLatestPaidReturnForTelegram(telegramId);
        if (!latest) {
          return reply.send({ returnPath: null, spreadCredits: null });
        }
        return reply.send({
          returnPath: latest.returnPath,
          spreadCredits: latest.spreadCredits,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'latest-return failed' });
      }
    }
  );

  fastify.post<{ Body: LavaWebhookPayload }>(
    '/webhooks/lava',
    async (request, reply) => {
      const expected = getLavaWebhookSecret();
      if (!expected) {
        return reply.status(503).send({
          code: 'lava_not_configured',
          message: 'Webhook secret is not configured',
        });
      }

      const provided = readWebhookApiKey(request);
      if (!provided || provided !== expected) {
        return reply.status(401).send({
          code: 'unauthorized',
          message: 'Invalid webhook credentials',
        });
      }

      const payload = (request.body || {}) as LavaWebhookPayload;

      try {
        const result = await fulfillLavaPaymentSuccess(payload);
        return reply.send({
          ok: true,
          handled: result.handled,
          alreadyApplied: result.alreadyApplied ?? false,
          spreadCredits: result.spreadCredits,
        });
      } catch (error) {
        request.log.error(error);
        const message = error instanceof Error ? error.message : 'webhook_failed';
        if (message === 'MISSING_CONTRACT_ID' || message === 'UNKNOWN_BUYER') {
          // Acknowledge so Lava does not retry forever for malformed/orphan events
          return reply.status(200).send({
            ok: false,
            handled: false,
            code: message,
          });
        }
        return reply.status(500).send({
          code: 'webhook_failed',
          message: 'Could not process Lava webhook',
        });
      }
    }
  );
};
