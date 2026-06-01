import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { resolveAuthedUser } from '../lib/authRequest';
import { tryConsumeTarotDailySlot } from '../services/tarotDailyUsageService';

export const tarotDailyRoute = async (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) => {
  fastify.post('/tarot/daily/consume', async (request, reply) => {
    const user = await resolveAuthedUser(request);
    if (!user) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    try {
      const result = await tryConsumeTarotDailySlot(user.id);
      if (!result.ok) {
        return reply.status(429).send({
          message: 'Daily tarot spread limit reached',
          tarotDaily: {
            used: result.used,
            limit: result.limit,
            day: result.day,
          },
        });
      }

      return reply.send({
        tarotDaily: {
          used: result.used,
          limit: result.limit,
          day: result.day,
        },
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Could not update daily usage' });
    }
  });
};
