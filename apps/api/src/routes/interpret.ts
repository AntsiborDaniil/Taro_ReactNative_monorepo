import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { resolveAuthedUser } from '../lib/authRequest';
import { OpenAiProviderError } from '../lib/openaiErrors';
import {
  generateFollowUp,
  generateInterpretation,
  type TarotFollowUpInput,
} from '../services/spreadInterpretationService';
import {
  getSpreadCredits,
  getTarotDailyUsage,
  refundSpreadSlot,
  tryConsumeSpreadCreditOnly,
  tryConsumeSpreadSlot,
  tryConsumeSpreadSlots,
} from '../services/tarotDailyUsageService';
import { claimFreeFirst, hasUsedFreeFirst, releaseFreeFirst } from '../services/freeFirstService';
import { getPairQuota } from '../services/pairReadingService';
import { listRecentSpreads } from '../services/spreadsService';
import {
  claimFreePeriodCard,
  completeFreePeriodCard,
  freePeriodKindOf,
  nextPeriodAt,
  getFreePeriodStatus,
  releaseFreePeriodCard,
} from '../services/freePeriodCardService';
import {
  buildSpreadMemory,
  buildStructureBlock,
  type InterpretContext,
  type InterpretPosition,
  type SpreadMemory,
} from '../services/spreadContext';
import { TarotSpreadInput } from '../types';
import { cleanName, isCoupleSpread, type CoupleNames } from '../lib/couple';

type InterpretBody = Omit<TarotSpreadInput, 'positions'> & {
  positions: InterpretPosition[];
  /** 'deep' — глубокий разбор: первый на аккаунт бесплатно, дальше 2 единицы. */
  mode?: 'deep';
  /** Необязательный контекст клиента: последнее настроение и активные привычки. */
  context?: InterpretContext;
  /** «Расклад для парочки»: имена пары. */
  couple?: CoupleNames;
};

const COUPLE_CARDS = 5;

/** Память не должна ронять толкование: любая ошибка агрегации → без памяти. */
async function loadMemory(
  userId: string,
  body: InterpretBody
): Promise<SpreadMemory | null> {
  try {
    const recent = await listRecentSpreads(userId, 30);
    return buildSpreadMemory({
      recent,
      positions: body.positions,
      language: body.language,
      context: body.context,
    });
  } catch {
    return null;
  }
}

const positionsSchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['label', 'card', 'direction'],
    properties: {
      label: { type: 'string' },
      card: { type: 'string' },
      direction: { type: 'string' },
      description: { type: 'string' },
      card_id: { type: 'string' },
      arcana: { type: 'string' },
      suit: { type: 'string', nullable: true },
    },
  },
} as const;

const quotaResponseSchema = {
  interpretation: { type: 'string' },
  tarotDaily: {
    type: 'object',
    properties: {
      used: { type: 'number' },
      limit: { type: 'number' },
      day: { type: 'string' },
    },
  },
  spreadCredits: { type: 'number' },
  memoryStats: {
    type: 'object',
    nullable: true,
    additionalProperties: true,
  },
  memoryNote: {
    type: 'object',
    nullable: true,
    properties: {
      kind: { type: 'string' },
      cardId: { type: 'string' },
      date: { type: 'string' },
      spreadName: { type: 'string' },
      suit: { type: 'string' },
      pct: { type: 'number' },
    },
  },
} as const;

export const interpretRoute = async (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) => {
  fastify.post<{ Body: InterpretBody }>(
    '/interpret',
    {
      schema: {
        body: {
          type: 'object',
          required: ['spread_type', 'positions', 'language', 'question'],
          properties: {
            spread_type: { type: 'string' },
            language: { type: 'string' },
            question: { type: 'string' },
            spread_key: { type: 'string' },
            mode: { type: 'string', enum: ['deep'] },
            positions: positionsSchema,
            couple: {
              type: 'object',
              required: ['him', 'her'],
              properties: {
                him: { type: 'string', maxLength: 40 },
                her: { type: 'string', maxLength: 40 },
              },
            },
            context: {
              type: 'object',
              properties: {
                mood: {
                  type: 'object',
                  properties: {
                    mood: { type: 'number', nullable: true },
                    energy: { type: 'number', nullable: true },
                    stress: { type: 'number', nullable: true },
                    date: { type: 'string' },
                  },
                },
                habits: { type: 'array', maxItems: 5, items: { type: 'string', maxLength: 120 } },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: quotaResponseSchema,
          },
        },
      },
    },
    async (request, reply) => {
      const user = await resolveAuthedUser(request);
      if (!user) {
        return reply.status(401).send({
          code: 'unauthorized',
          message: 'Sign in is required to generate a spread interpretation',
        });
      }

      const { spread_type, positions, language, question, spread_key, mode } =
        request.body;

      // Бесплатные карты периода (дня / недели / месяца): одна карта на период.
      const freeKind = freePeriodKindOf(spread_key);
      const isFreeCard = freeKind !== null;
      const deep = mode === 'deep' && !isFreeCard;

      if (isFreeCard && positions.length !== 1) {
        return reply.status(400).send({
          code: 'invalid_day_card',
          message: 'Period card must contain exactly one card',
        });
      }
      // Парочка: имена обязательны, ровно 5 карт, без «глубокого» разбора.
      let couple: CoupleNames | undefined;
      if (isCoupleSpread(spread_key)) {
        const him = cleanName(request.body.couple?.him);
        const her = cleanName(request.body.couple?.her);
        if (!him || !her || positions.length !== COUPLE_CARDS || mode === 'deep') {
          return reply.status(400).send({
            code: 'invalid_couple',
            message: 'Couple names are required',
          });
        }
        couple = { him, her };
      }
      if (mode === 'deep' && (positions.length < 3 || isFreeCard)) {
        return reply.status(400).send({
          code: 'deep_unavailable',
          message: 'Deep reading requires at least 3 cards',
        });
      }

      // Карта периода бесплатна: слот/заряд не списываем. Защита — уникальная запись
      // на период в БД (claim до модели), период считает сервер (Europe/Moscow).
      type Consumed = {
        refund: () => Promise<void>;
        used: number;
        limit: number;
        day: string;
        spreadCredits: number;
      };
      let consumed: Consumed;

      let freeClaim: { kind: NonNullable<typeof freeKind>; periodStart: string } | null = null;
      if (freeKind) {
        const claim = await claimFreePeriodCard(user.id, freeKind);
        if (!claim.ok) {
          // Уже открыта в этом периоде — отдаём сохранённую карту, новую не генерируем.
          return reply.status(409).send({
            code: 'period_card_used',
            message: 'Free card for this period is already drawn',
            kind: freeKind,
            nextAt: nextPeriodAt(freeKind),
            saved: claim.saved,
          });
        }
        freeClaim = { kind: freeKind, periodStart: claim.periodStart };
        const releaseClaim = async () => releaseFreePeriodCard(user.id, freeKind, claim.periodStart);
        try {
          const [usage, spreadCredits] = await Promise.all([
            getTarotDailyUsage(user.id),
            getSpreadCredits(user.id),
          ]);
          consumed = {
            refund: releaseClaim,
            used: usage.used,
            limit: usage.limit,
            day: usage.day,
            spreadCredits,
          };
        } catch (error) {
          await releaseClaim().catch(() => undefined);
          request.log.error(error);
          return reply.status(500).send({
            code: 'interpret_failed',
            message: 'Could not generate interpretation',
          });
        }
      } else if (deep && (await claimFreeFirst(user.id, 'deep').catch(() => false))) {
        // Первый глубокий разбор на аккаунт — бесплатно: слоты не списываем,
        // при ошибке модели запись удаляется (бесплатность возвращается).
        try {
          const [usage, spreadCredits] = await Promise.all([
            getTarotDailyUsage(user.id),
            getSpreadCredits(user.id),
          ]);
          consumed = {
            refund: () => releaseFreeFirst(user.id, 'deep'),
            used: usage.used,
            limit: usage.limit,
            day: usage.day,
            spreadCredits,
          };
        } catch (error) {
          await releaseFreeFirst(user.id, 'deep').catch(() => undefined);
          request.log.error(error);
          return reply.status(500).send({
            code: 'interpret_failed',
            message: 'Could not generate interpretation',
          });
        }
      } else if (deep || couple) {
        // Глубокий разбор и «Для влюблённых» стоят 2 единицы (дневной ⚡ + купленные заряды).
        const slots = await tryConsumeSpreadSlots(user.id, 2);
        if (!slots.ok) {
          return reply.status(429).send({
            code: 'daily_limit_reached',
            message: 'Daily tarot spread limit reached',
            tarotDaily: { used: slots.used, limit: slots.limit, day: slots.day },
            spreadCredits: slots.spreadCredits,
          });
        }
        consumed = {
          refund: async () => {
            for (const source of slots.sources) {
              try {
                await refundSpreadSlot(user.id, source);
              } catch (refundError) {
                request.log.error(refundError);
              }
            }
          },
          used: slots.used,
          limit: slots.limit,
          day: slots.day,
          spreadCredits: slots.spreadCredits,
        };
      } else {
        const slot = await tryConsumeSpreadSlot(user.id);
        if (!slot.ok) {
          return reply.status(429).send({
            code: 'daily_limit_reached',
            message: 'Daily tarot spread limit reached',
            tarotDaily: {
              used: slot.used,
              limit: slot.limit,
              day: slot.day,
            },
            spreadCredits: slot.spreadCredits,
          });
        }
        consumed = {
          refund: () => refundSpreadSlot(user.id, slot.source),
          used: slot.used,
          limit: slot.limit,
          day: slot.day,
          spreadCredits: slot.spreadCredits,
        };
      }

      try {
        // У пары своя тема — личная «память» раскладов сюда не подмешивается.
        const memory = couple ? null : await loadMemory(user.id, request.body);
        const interpretation = await generateInterpretation({
          spread_type,
          positions,
          language,
          question,
          spread_key,
          mode: deep ? 'deep' : undefined,
          couple,
          structureBlock: buildStructureBlock(positions, language) || undefined,
          memoryBlock: memory?.block || undefined,
        });
        if (freeClaim) {
          const first = positions[0];
          await completeFreePeriodCard(user.id, freeClaim.kind, freeClaim.periodStart, {
            interpretation: interpretation.interpretation,
            card: { card_id: first?.card_id, card: first?.card ?? '', direction: first?.direction ?? 'upright' },
          }).catch((saveError) => request.log.error(saveError));
        }
        return reply.send({
          ...interpretation,
          memoryNote: memory?.note ?? undefined,
          memoryStats: memory?.stats ?? undefined,
          tarotDaily: {
            used: consumed.used,
            limit: consumed.limit,
            day: consumed.day,
          },
          spreadCredits: consumed.spreadCredits,
        });
      } catch (error) {
        request.log.error(error);
        try {
          await consumed.refund();
        } catch (refundError) {
          request.log.error(refundError);
        }

        if (error instanceof OpenAiProviderError) {
          return reply.status(error.httpStatus).send({
            message: error.message,
            code: error.code,
          });
        }

        return reply.status(500).send({
          code: 'interpret_failed',
          message: 'Could not generate interpretation',
        });
      }
    }
  );

  /** «Первый раз бесплатно»: true — бесплатное использование ещё доступно. */
  fastify.get('/free-firsts', async (request, reply) => {
    const user = await resolveAuthedUser(request);
    if (!user) return reply.status(401).send({ message: 'Unauthorized' });
    try {
      const [deepUsed, pair] = await Promise.all([hasUsedFreeFirst(user.id, 'deep'), getPairQuota(user.id)]);
      return reply.send({ deep: !deepUsed, pair: pair.freeAvailable });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Failed to load free firsts' });
    }
  });

  /** Статус бесплатных карт периода: доступна ли, когда следующая, сохранённая карта. */
  fastify.get('/free-cards', async (request, reply) => {
    const user = await resolveAuthedUser(request);
    if (!user) return reply.status(401).send({ message: 'Unauthorized' });
    try {
      return reply.send({ cards: await getFreePeriodStatus(user.id) });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Failed to load free cards' });
    }
  });

  /** Follow-up к готовому толкованию — всегда 1 заряд, без дневного слота. */
  fastify.post<{ Body: TarotFollowUpInput }>(
    '/interpret/follow-up',
    {
      schema: {
        body: {
          type: 'object',
          required: [
            'spread_type',
            'positions',
            'language',
            'question',
            'previous_interpretation',
            'follow_up_question',
          ],
          properties: {
            spread_type: { type: 'string' },
            language: { type: 'string' },
            question: { type: 'string' },
            spread_key: { type: 'string' },
            previous_interpretation: { type: 'string' },
            follow_up_question: { type: 'string', minLength: 1, maxLength: 500 },
            positions: positionsSchema,
          },
        },
        response: {
          200: {
            type: 'object',
            properties: quotaResponseSchema,
          },
        },
      },
    },
    async (request, reply) => {
      const user = await resolveAuthedUser(request);
      if (!user) {
        return reply.status(401).send({
          code: 'unauthorized',
          message: 'Sign in is required to ask a follow-up',
        });
      }

      const {
        spread_type,
        positions,
        language,
        question,
        previous_interpretation,
        follow_up_question,
        spread_key,
      } = request.body;

      const trimmedQuestion = follow_up_question.trim();
      if (!trimmedQuestion) {
        return reply.status(400).send({
          code: 'invalid_follow_up',
          message: 'Follow-up question is required',
        });
      }

      const slot = await tryConsumeSpreadCreditOnly(user.id);
      if (!slot.ok) {
        return reply.status(429).send({
          code: 'credits_exhausted',
          message: 'No spread credits left for follow-up',
          tarotDaily: {
            used: slot.used,
            limit: slot.limit,
            day: slot.day,
          },
          spreadCredits: slot.spreadCredits,
        });
      }

      try {
        const result = await generateFollowUp({
          spread_type,
          positions,
          language,
          question,
          previous_interpretation,
          follow_up_question: trimmedQuestion,
          spread_key,
        });
        return reply.send({
          interpretation: result.interpretation,
          tarotDaily: {
            used: slot.used,
            limit: slot.limit,
            day: slot.day,
          },
          spreadCredits: slot.spreadCredits,
        });
      } catch (error) {
        request.log.error(error);
        try {
          await refundSpreadSlot(user.id, 'credit');
        } catch (refundError) {
          request.log.error(refundError);
        }

        if (error instanceof OpenAiProviderError) {
          return reply.status(error.httpStatus).send({
            message: error.message,
            code: error.code,
          });
        }

        return reply.status(500).send({
          code: 'follow_up_failed',
          message: 'Could not generate follow-up',
        });
      }
    }
  );
};
