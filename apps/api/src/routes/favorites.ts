import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { resolveAuthedUser } from '../lib/authRequest';
import {
  addFavoriteCard,
  listFavoriteCardIds,
  removeFavoriteCard,
} from '../services/favoritesService';

export const favoritesRoute = async (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) => {
  fastify.get('/favorites', async (request, reply) => {
    const user = await resolveAuthedUser(request);
    if (!user) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    try {
      const cardIds = await listFavoriteCardIds(user.id);
      return reply.send({ cardIds });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Could not load favorites' });
    }
  });

  fastify.post<{ Body: { cardId: string } }>(
    '/favorites',
    {
      schema: {
        body: {
          type: 'object',
          required: ['cardId'],
          properties: {
            cardId: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const user = await resolveAuthedUser(request);
      if (!user) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      try {
        await addFavoriteCard(user.id, request.body.cardId);
        return reply.status(201).send({ ok: true });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Could not add favorite' });
      }
    }
  );

  fastify.delete<{ Params: { cardId: string } }>(
    '/favorites/:cardId',
    async (request, reply) => {
      const user = await resolveAuthedUser(request);
      if (!user) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      try {
        const removed = await removeFavoriteCard(user.id, request.params.cardId);
        if (!removed) {
          return reply.status(404).send({ message: 'Favorite not found' });
        }
        return reply.send({ ok: true });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Could not remove favorite' });
      }
    }
  );
};
