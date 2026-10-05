import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { resolveAuthedUser } from '../lib/authRequest';
import { OpenAiProviderError } from '../lib/openaiErrors';
import { generateMoodAndEnergyInterpretation } from '../services/moodAndEnergyMotivationService';
import { TMoodAndEnergyInput } from '../types';

/**
 * Чек-ин настроения + AI-карта. Не списывает дневной слот расклада и не
 * тратит spread_credits — иначе утренний mood съедал единственную бесплатную
 * интерпретацию (см. reports/Mindful Tarot growth features.md ★2).
 */
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

      try {
        const interpretation = await generateMoodAndEnergyInterpretation({
          params,
          card,
          language,
        });
        return reply.send(interpretation);
      } catch (error) {
        request.log.error(error);

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
