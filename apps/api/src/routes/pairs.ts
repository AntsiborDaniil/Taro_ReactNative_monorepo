import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { resolveAuthedUser } from '../lib/authRequest';
import { OpenAiProviderError } from '../lib/openaiErrors';
import { normalizePairRelation, PAIR_CARDS, PAIR_QUESTION_MAX, sanitizeShortName } from '../lib/pairGiftRules';
import {
  consentPair,
  createPairReading,
  getPairQuota,
  getPairViewFor,
  joinPair,
  revokePair,
  submitPartnerCards,
  type PairCard,
} from '../services/pairReadingService';

const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

const cardsSchema = {
  type: 'array',
  minItems: PAIR_CARDS,
  maxItems: PAIR_CARDS,
  items: {
    type: 'object',
    required: ['card', 'direction'],
    properties: {
      card_id: { type: 'string', maxLength: 40 },
      card: { type: 'string', minLength: 1, maxLength: 80 },
      direction: { type: 'string', minLength: 1, maxLength: 20 },
      label: { type: 'string', maxLength: 120 },
    },
  },
} as const;

type RawCard = { card_id?: string; card: string; direction: string; label?: string };

function normalizeCards(cards: RawCard[]): PairCard[] {
  return cards.map((item) => ({
    ...(item.card_id ? { card_id: item.card_id } : {}),
    card: item.card.trim(),
    direction: item.direction === 'reversed' ? 'reversed' : 'upright',
    label: (item.label ?? '').trim(),
  }));
}

function languageOf(raw: string | undefined): string {
  return raw && raw.trim() ? raw.trim().slice(0, 10) : 'ru';
}

const ERROR_STATUS: Record<string, number> = {
  not_found: 404,
  forbidden: 403,
  invalid_state: 409,
  expired: 410,
  revoked: 409,
  taken: 409,
  not_waiting: 409,
  own_invite: 403,
  partner_limit: 429,
};

const ERROR_MESSAGE: Record<string, string> = {
  not_found: 'Pair reading not found',
  forbidden: 'Not your pair reading',
  invalid_state: 'Pair reading is not in a state that allows this action',
  expired: 'Invitation has expired',
  revoked: 'Invitation was revoked',
  taken: 'Someone has already accepted this invitation',
  not_waiting: 'Invitation is no longer open',
  own_invite: 'You cannot accept your own invitation',
  partner_limit: 'Too many invitations accepted today',
};

function sendDomainError(reply: FastifyReply, code: string) {
  return reply.status(ERROR_STATUS[code] ?? 400).send({ code, message: ERROR_MESSAGE[code] ?? code });
}

function sendProviderOr500(request: FastifyRequest, reply: FastifyReply, error: unknown, code: string, message: string) {
  request.log.error(error);
  if (error instanceof OpenAiProviderError) {
    return reply.status(error.httpStatus).send({ message: error.message, code: error.code });
  }
  return reply.status(500).send({ code, message });
}

export const pairsRoute = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  /** Квота автора: доступна ли бесплатная пара. Заодно лениво возвращает ⚡ за истёкшие приглашения. */
  fastify.get('/pairs/quota', async (request, reply) => {
    const user = await resolveAuthedUser(request);
    if (!user) return reply.status(401).send({ message: 'Unauthorized' });
    try {
      return reply.send(await getPairQuota(user.id));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Could not load pair quota' });
    }
  });

  fastify.post<{
    Body: {
      question: string;
      showQuestion?: boolean;
      inviterName?: string;
      relation?: string;
      language?: string;
      cards: RawCard[];
    };
  }>(
    '/pairs',
    {
      schema: {
        body: {
          type: 'object',
          required: ['question', 'cards'],
          properties: {
            question: { type: 'string', maxLength: PAIR_QUESTION_MAX * 2 },
            showQuestion: { type: 'boolean' },
            inviterName: { type: 'string', maxLength: 200 },
            relation: { type: 'string', enum: ['partner', 'friend', 'family'] },
            language: { type: 'string', maxLength: 10 },
            cards: cardsSchema,
          },
        },
      },
    },
    async (request, reply) => {
      const user = await resolveAuthedUser(request);
      if (!user) {
        return reply.status(401).send({ code: 'unauthorized', message: 'Sign in is required to create a pair reading' });
      }

      const question = request.body.question.trim();
      if (!question || [...question].length > PAIR_QUESTION_MAX) {
        return reply.status(400).send({ code: 'invalid_question', message: 'Question is required (up to 280 characters)' });
      }
      const name = sanitizeShortName(request.body.inviterName);
      if (!name.ok) {
        return reply.status(400).send({ code: 'invalid_name', message: 'Name is too long or contains a link' });
      }

      try {
        const result = await createPairReading(user.id, {
          question,
          showQuestion: request.body.showQuestion === true,
          inviterName: name.value,
          relation: normalizePairRelation(request.body.relation),
          language: languageOf(request.body.language),
          cards: normalizeCards(request.body.cards),
        });
        if (!result.ok) {
          if (result.code === 'daily_limit_reached') {
            return reply.status(429).send({
              code: 'daily_limit_reached',
              message: 'Not enough charges for a pair reading',
              tarotDaily: result.tarotDaily,
              spreadCredits: result.spreadCredits,
            });
          }
          return reply.status(429).send({
            code: result.code,
            message:
              result.code === 'too_many_active'
                ? 'Too many active invitations'
                : 'Too many pair readings created today',
          });
        }
        return reply.status(201).send({
          id: result.row.id,
          personal: result.row.author_personal,
          expiresAt: result.row.expires_at,
          isFree: result.row.is_free,
          ...(result.tarotDaily ? { tarotDaily: result.tarotDaily } : {}),
          ...(result.spreadCredits !== undefined ? { spreadCredits: result.spreadCredits } : {}),
        });
      } catch (error) {
        return sendProviderOr500(request, reply, error, 'pair_create_failed', 'Could not create pair reading');
      }
    },
  );

  /** Состояние пары глазами зрителя. Вход необязателен: ссылка-приглашение открывается и гостем. */
  fastify.get<{ Params: { id: string } }>('/pairs/:id', async (request, reply) => {
    const { id } = request.params;
    if (!UUID_RE.test(id)) return sendDomainError(reply, 'not_found');
    try {
      const user = await resolveAuthedUser(request);
      const view = await getPairViewFor(id.toLowerCase(), user?.id ?? null);
      if (!view) return sendDomainError(reply, 'not_found');
      return reply.send({ pair: view });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Could not load pair reading' });
    }
  });

  /** Партнёр занимает слот приглашения. */
  fastify.post<{ Params: { id: string } }>('/pairs/:id/join', async (request, reply) => {
    const user = await resolveAuthedUser(request);
    if (!user) return reply.status(401).send({ code: 'unauthorized', message: 'Unauthorized' });
    if (!UUID_RE.test(request.params.id)) return sendDomainError(reply, 'not_found');
    try {
      const result = await joinPair(request.params.id.toLowerCase(), user.id);
      if (!result.ok) return sendDomainError(reply, result.code);
      return reply.send({ pair: result.view });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Could not join pair reading' });
    }
  });

  fastify.post<{ Params: { id: string }; Body: { cards: RawCard[] } }>(
    '/pairs/:id/cards',
    { schema: { body: { type: 'object', required: ['cards'], properties: { cards: cardsSchema } } } },
    async (request, reply) => {
      const user = await resolveAuthedUser(request);
      if (!user) return reply.status(401).send({ code: 'unauthorized', message: 'Unauthorized' });
      if (!UUID_RE.test(request.params.id)) return sendDomainError(reply, 'not_found');
      try {
        const result = await submitPartnerCards(
          request.params.id.toLowerCase(),
          user.id,
          normalizeCards(request.body.cards),
        );
        if (!result.ok) return sendDomainError(reply, result.code);
        return reply.send({ pair: result.view });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Could not save cards' });
      }
    },
  );

  fastify.post<{ Params: { id: string }; Body: { share: boolean; language?: string } }>(
    '/pairs/:id/consent',
    {
      schema: {
        body: {
          type: 'object',
          required: ['share'],
          properties: { share: { type: 'boolean' }, language: { type: 'string', maxLength: 10 } },
        },
      },
    },
    async (request, reply) => {
      const user = await resolveAuthedUser(request);
      if (!user) return reply.status(401).send({ code: 'unauthorized', message: 'Unauthorized' });
      if (!UUID_RE.test(request.params.id)) return sendDomainError(reply, 'not_found');
      try {
        const result = await consentPair(
          request.params.id.toLowerCase(),
          { id: user.id, name: user.name },
          request.body.share,
          languageOf(request.body.language),
        );
        if (!result.ok) return sendDomainError(reply, result.code);
        return reply.send({ pair: result.view });
      } catch (error) {
        return sendProviderOr500(request, reply, error, 'pair_consent_failed', 'Could not complete pair reading');
      }
    },
  );

  fastify.post<{ Params: { id: string } }>('/pairs/:id/revoke', async (request, reply) => {
    const user = await resolveAuthedUser(request);
    if (!user) return reply.status(401).send({ code: 'unauthorized', message: 'Unauthorized' });
    if (!UUID_RE.test(request.params.id)) return sendDomainError(reply, 'not_found');
    try {
      const result = await revokePair(request.params.id.toLowerCase(), user.id);
      if (!result.ok) return sendDomainError(reply, result.code);
      return reply.send({ pair: result.view });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Could not revoke pair reading' });
    }
  });
};
