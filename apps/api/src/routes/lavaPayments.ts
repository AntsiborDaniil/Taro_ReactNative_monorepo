import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { resolveAuthedUser } from '../lib/authRequest';
import {
  getLavaWebhookSecret,
  isLavaPaymentsConfigured,
} from '../lib/env';
import {
  createLavaCheckoutForUser,
  fulfillLavaPaymentSuccess,
  isValidCheckoutEmail,
  type LavaWebhookPayload,
} from '../services/lavaPaymentsService';

function readWebhookApiKey(request: {
  headers: Record<string, string | string[] | undefined>;
}): string | null {
  const raw = request.headers['x-api-key'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || null;
}

export const lavaPaymentsRoute = async (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) => {
  fastify.post<{ Body: { email?: string } }>(
    '/payments/lava/checkout',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', minLength: 3 },
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
          message: 'A valid email is required for checkout',
        });
      }

      try {
        const checkout = await createLavaCheckoutForUser({
          userId: user.id,
          email,
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
            message: 'A valid email is required for checkout',
          });
        }
        if (message === 'LAVA_NOT_CONFIGURED') {
          return reply.status(503).send({
            code: 'lava_not_configured',
            message: 'Lava payments are not configured on this server',
          });
        }
        return reply.status(502).send({
          code: 'lava_checkout_failed',
          message: 'Could not create Lava payment',
        });
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
