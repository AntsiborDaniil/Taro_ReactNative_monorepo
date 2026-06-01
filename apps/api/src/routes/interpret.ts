import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { resolveAuthedUser } from '../lib/authRequest';
import { generateInterpretation } from '../services/spreadInterpretationService';
import { TarotSpreadInput } from '../types';

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
            positions: {
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
          message: 'Sign in is required to generate a spread interpretation',
        });
      }

      const { spread_type, positions, language, question } = request.body;

      try {
        const interpretation = await generateInterpretation({
          spread_type,
          positions,
          language,
          question,
        });
        return reply.send(interpretation);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          message: 'Could not generate interpretation',
        });
      }
    }
  );
};
