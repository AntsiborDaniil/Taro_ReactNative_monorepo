import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { resolveAuthedUser } from '../lib/authRequest';
import { OpenAiProviderError } from '../lib/openaiErrors';
import {
  generateFollowUp,
  generateInterpretation,
  type TarotFollowUpInput,
} from '../services/spreadInterpretationService';
import {
  refundSpreadSlot,
  tryConsumeSpreadCreditOnly,
  tryConsumeSpreadSlot,
} from '../services/tarotDailyUsageService';
import { TarotSpreadInput } from '../types';

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
} as const;

export const interpretRoute = async (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) => {
  fastify.post<{ Body: TarotSpreadInput }>(
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
          message: 'Sign in is required to generate a spread interpretation',
        });
      }

      const { spread_type, positions, language, question, spread_key } = request.body;

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

      try {
        const interpretation = await generateInterpretation({
          spread_type,
          positions,
          language,
          question,
          spread_key,
        });
        return reply.send({
          ...interpretation,
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
          await refundSpreadSlot(user.id, slot.source);
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
