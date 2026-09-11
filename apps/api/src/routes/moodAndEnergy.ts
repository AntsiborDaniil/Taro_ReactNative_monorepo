import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { resolveAuthedUser } from '../lib/authRequest';
import { OpenAiProviderError } from '../lib/openaiErrors';
import { generateMoodAndEnergyInterpretation } from '../services/moodAndEnergyMotivationService';
import {
  refundSpreadSlot,
  tryConsumeSpreadSlot,
} from '../services/tarotDailyUsageService';
import { TMoodAndEnergyInput } from '../types';

export const moodAndEnergyRoute = async (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) => {
  fastify.post<{ Body: TMoodAndEnergyInput }>(
    '/motivation/moodAndEnergy',
    {
      schema: {
        body: {
          type: 'object',
          required: ['params', 'card', 'language'],
          properties: {
            language: { type: 'string' },
            params: {
              type: 'object',
              required: ['mood', 'energy', 'stress'],
              properties: {
                mood: { type: 'number', minimum: 0, maximum: 10 },
                energy: { type: 'number', minimum: 0, maximum: 10 },
                stress: { type: 'number', minimum: 0, maximum: 10 },
              },
            },
            card: {
              type: 'object',
              required: ['card', 'direction'],
              properties: {
                card: { type: 'string' },
                direction: { type: 'string', enum: ['upright', 'reversed'] },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
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
            },
          },
        },
      },
    },
    async (request, reply) => {
      const user = await resolveAuthedUser(request);
      if (!user) {
        return reply.status(401).send({
          code: 'unauthorized',
          message: 'Sign in is required to generate a mood reading',
        });
      }

      const { params, card, language } = request.body;

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
        const interpretation = await generateMoodAndEnergyInterpretation({
          params,
          card,
          language,
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
          code: 'motivation_failed',
          message: 'Could not generate interpretation',
        });
      }
    }
  );
};
