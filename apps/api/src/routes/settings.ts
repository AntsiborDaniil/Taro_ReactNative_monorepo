import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { resolveAuthedUser } from '../lib/authRequest';
import {
  getUserSettings,
  patchUserSettings,
  upsertUserSettings,
} from '../services/userSettingsService';

export const settingsRoute = async (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) => {
  fastify.get('/settings', async (request, reply) => {
    const user = await resolveAuthedUser(request);
    if (!user) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    try {
      const record = await getUserSettings(user.id);
      return reply.send({ settings: record.settings, updatedAt: record.updatedAt });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Could not load settings' });
    }
  });

  fastify.put<{ Body: { settings: Record<string, unknown> } }>(
    '/settings',
    {
      schema: {
        body: {
          type: 'object',
          required: ['settings'],
          properties: {
            settings: { type: 'object' },
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
        const record = await upsertUserSettings(user.id, request.body.settings);
        return reply.send({
          settings: record.settings,
          updatedAt: record.updatedAt,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Could not save settings' });
      }
    }
  );

  fastify.patch<{ Body: Record<string, unknown> }>(
    '/settings',
    {
      schema: {
        body: { type: 'object' },
      },
    },
    async (request, reply) => {
      const user = await resolveAuthedUser(request);
      if (!user) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      try {
        const record = await patchUserSettings(user.id, request.body);
        return reply.send({
          settings: record.settings,
          updatedAt: record.updatedAt,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Could not update settings' });
      }
    }
  );
};
