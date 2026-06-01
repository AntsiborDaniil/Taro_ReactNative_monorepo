import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { resolveAuthedUser } from '../lib/authRequest';
import {
  createSpread,
  getSpreadById,
  listSpreads,
  updateSpread,
} from '../services/spreadsService';

type CreateSpreadBody = {
  spreadKey: string;
  name: string;
  category?: string | null;
  question?: string | null;
  interpretation?: string | null;
  cardsCount?: number;
  packIndex?: number;
  payload: Record<string, unknown>;
};

type UpdateSpreadBody = {
  interpretation?: string | null;
  question?: string | null;
  payload?: Record<string, unknown>;
};

export const spreadsRoute = async (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) => {
  fastify.get<{ Querystring: { limit?: string; offset?: string } }>(
    '/spreads',
    async (request, reply) => {
      const user = await resolveAuthedUser(request);
      if (!user) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const limit = request.query.limit
        ? Number(request.query.limit)
        : undefined;
      const offset = request.query.offset
        ? Number(request.query.offset)
        : undefined;

      try {
        const spreads = await listSpreads(user.id, { limit, offset });
        return reply.send({ spreads });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Could not load spreads' });
      }
    }
  );

  fastify.get<{ Params: { id: string } }>(
    '/spreads/:id',
    async (request, reply) => {
      const user = await resolveAuthedUser(request);
      if (!user) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      try {
        const spread = await getSpreadById(user.id, request.params.id);
        if (!spread) {
          return reply.status(404).send({ message: 'Spread not found' });
        }
        return reply.send({ spread });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Could not load spread' });
      }
    }
  );

  fastify.post<{ Body: CreateSpreadBody }>(
    '/spreads',
    {
      schema: {
        body: {
          type: 'object',
          required: ['spreadKey', 'name', 'payload'],
          properties: {
            spreadKey: { type: 'string' },
            name: { type: 'string' },
            category: { type: 'string', nullable: true },
            question: { type: 'string', nullable: true },
            interpretation: { type: 'string', nullable: true },
            cardsCount: { type: 'number' },
            packIndex: { type: 'number' },
            payload: { type: 'object' },
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
        const spread = await createSpread(user.id, request.body);
        return reply.status(201).send({ spread });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Could not save spread' });
      }
    }
  );

  fastify.patch<{ Params: { id: string }; Body: UpdateSpreadBody }>(
    '/spreads/:id',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            interpretation: { type: 'string', nullable: true },
            question: { type: 'string', nullable: true },
            payload: { type: 'object' },
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
        const spread = await updateSpread(
          user.id,
          request.params.id,
          request.body
        );
        if (!spread) {
          return reply.status(404).send({ message: 'Spread not found' });
        }
        return reply.send({ spread });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Could not update spread' });
      }
    }
  );
};
