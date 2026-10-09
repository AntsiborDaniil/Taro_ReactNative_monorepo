import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { resolveAuthedUser } from '../lib/authRequest';
import { OpenAiProviderError } from '../lib/openaiErrors';
import {
  GIFT_MAX_PER_DAY,
  GIFT_OCCASIONS,
  isGiftOccasion,
  sanitizeGiftNote,
  sanitizeShortName,
} from '../lib/pairGiftRules';
import { createGiftCard, getGiftViewFor, openGiftCard } from '../services/giftCardService';

const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export const giftsRoute = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  /** Создать «Карту для друга»: ⚡1 как обычный расклад; до 10 в сутки — защита от спама. */
  fastify.post<{
    Body: {
      recipientName?: string;
      occasion: string;
      note?: string;
      language?: string;
      card: { card_id?: string; card: string; direction: string };
    };
  }>(
    '/gifts',
    {
      schema: {
        body: {
          type: 'object',
          required: ['occasion', 'card'],
          properties: {
            recipientName: { type: 'string', maxLength: 200 },
            occasion: { type: 'string', enum: [...GIFT_OCCASIONS] },
            note: { type: 'string', maxLength: 1000 },
            language: { type: 'string', maxLength: 10 },
            card: {
              type: 'object',
              required: ['card', 'direction'],
              properties: {
                card_id: { type: 'string', maxLength: 40 },
                card: { type: 'string', minLength: 1, maxLength: 80 },
                direction: { type: 'string', minLength: 1, maxLength: 20 },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const user = await resolveAuthedUser(request);
      if (!user) {
        return reply.status(401).send({ code: 'unauthorized', message: 'Sign in is required to send a card' });
      }

      const name = sanitizeShortName(request.body.recipientName);
      if (!name.ok) {
        return reply.status(400).send({ code: 'invalid_name', message: 'Name is too long or contains a link' });
      }
      const note = sanitizeGiftNote(request.body.note);
      if (!note.ok) {
        return reply.status(400).send({
          code: note.code === 'too_long' ? 'note_too_long' : 'note_has_link',
          message:
            note.code === 'too_long'
              ? 'The note is too long (up to 140 characters)'
              : 'The note cannot contain links or @mentions',
        });
      }
      if (!isGiftOccasion(request.body.occasion)) {
        return reply.status(400).send({ code: 'invalid_occasion', message: 'Unknown occasion' });
      }

      try {
        const language = request.body.language?.trim().slice(0, 10) || 'ru';
        const result = await createGiftCard(user.id, {
          recipientName: name.value,
          occasion: request.body.occasion,
          note: note.value,
          language,
          card: {
            ...(request.body.card.card_id ? { card_id: request.body.card.card_id } : {}),
            card: request.body.card.card.trim(),
            direction: request.body.card.direction === 'reversed' ? 'reversed' : 'upright',
          },
        });
        if (!result.ok) {
          if (result.code === 'daily_limit_reached') {
            return reply.status(429).send({
              code: 'daily_limit_reached',
              message: 'Not enough charges to send a card',
              tarotDaily: result.tarotDaily,
              spreadCredits: result.spreadCredits,
            });
          }
          return reply.status(429).send({
            code: 'gift_daily_limit',
            message: `You can send up to ${GIFT_MAX_PER_DAY} cards per day. Try again tomorrow.`,
          });
        }
        return reply.status(201).send({
          id: result.row.id,
          message: result.row.message,
          expiresAt: result.row.expires_at,
          tarotDaily: result.tarotDaily,
          spreadCredits: result.spreadCredits,
        });
      } catch (error) {
        request.log.error(error);
        if (error instanceof OpenAiProviderError) {
          return reply.status(error.httpStatus).send({ message: error.message, code: error.code });
        }
        return reply.status(500).send({ code: 'gift_create_failed', message: 'Could not create the card' });
      }
    },
  );

  /** Публичный просмотр по ссылке (без входа). Вход нужен только чтобы узнать владельца. */
  fastify.get<{ Params: { id: string } }>('/gifts/:id', async (request, reply) => {
    if (!UUID_RE.test(request.params.id)) return reply.status(404).send({ code: 'not_found', message: 'Card not found' });
    try {
      const user = await resolveAuthedUser(request);
      const result = await getGiftViewFor(request.params.id.toLowerCase(), user?.id ?? null);
      if (!result.ok) {
        return reply
          .status(result.code === 'expired' ? 410 : 404)
          .send({ code: result.code, message: result.code === 'expired' ? 'The link has expired' : 'Card not found' });
      }
      return reply.send({ gift: result.view });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Could not load the card' });
    }
  });

  /** Получатель перевернул карту: фиксируем первое открытие и уведомляем отправителя. */
  fastify.post<{ Params: { id: string } }>('/gifts/:id/open', async (request, reply) => {
    if (!UUID_RE.test(request.params.id)) return reply.status(404).send({ code: 'not_found', message: 'Card not found' });
    try {
      const user = await resolveAuthedUser(request);
      const result = await openGiftCard(request.params.id.toLowerCase(), user?.id ?? null);
      if (!result.ok) {
        return reply
          .status(result.code === 'expired' ? 410 : 404)
          .send({ code: result.code, message: result.code === 'expired' ? 'The link has expired' : 'Card not found' });
      }
      return reply.send({ ok: true, firstOpen: result.firstOpen });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Could not open the card' });
    }
  });
};
