import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { resolveAuthedUser } from '../lib/authRequest';
import { generateHabitsInterpretation } from '../services/habitsMotivationService';
import { THabitsInput } from '../types';

export const habitsRoute = async (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) => {
  fastify.post<{ Body: THabitsInput }>(
    '/motivation/habits',
    {
      schema: {
        body: {
          type: 'object',
          required: ['card', 'language'],
          properties: {
            language: { type: 'string' },
            params: {
              type: 'object',
              required: ['badHabits', 'goodHabits'],
              properties: {
                badHabits: { type: 'array', items: { type: 'string' } },
                goodHabits: { type: 'array', items: { type: 'string' } },
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
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const { params, card, language } = request.body;

      try {
        const interpretation = await generateHabitsInterpretation({
          params,
          card,
          language,
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
