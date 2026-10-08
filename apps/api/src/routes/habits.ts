import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { resolveAuthedUser } from '../lib/authRequest';
import { generateHabitsInterpretation } from '../services/habitsMotivationService';
import { claimHabitWeekReward, getHabitWeekStatus, setHabitCheckin } from '../services/habitRewardService';
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

  // Отметка цели «за сегодня»: день ставит сервер (Europe/Moscow) — перевод часов
  // на устройстве ничего не даёт. Клиент шлёт только habitId и done.
  fastify.post<{ Body: { habitId: string; done: boolean } }>(
    '/habits/checkin',
    {
      schema: {
        body: {
          type: 'object',
          required: ['habitId', 'done'],
          properties: {
            habitId: { type: 'string', minLength: 1, maxLength: 64 },
            done: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const user = await resolveAuthedUser(request);
      if (!user) return reply.status(401).send({ message: 'Unauthorized' });
      try {
        await setHabitCheckin(user.id, request.body.habitId, request.body.done);
        return reply.send(await getHabitWeekStatus(user.id));
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Failed to save check-in' });
      }
    }
  );

  fastify.get('/habits/week-reward', async (request, reply) => {
    const user = await resolveAuthedUser(request);
    if (!user) return reply.status(401).send({ message: 'Unauthorized' });
    try {
      return reply.send(await getHabitWeekStatus(user.id));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Failed to load week reward' });
    }
  });

  // Награда за закрытую неделю целей: +1 заряд, раз в неделю, только если отметки
  // были в разные дни (≥ max(3, requiredDays) по серверным датам).
  fastify.post<{ Body: { requiredDays: number } }>(
    '/habits/week-reward',
    {
      schema: {
        body: {
          type: 'object',
          required: ['requiredDays'],
          properties: { requiredDays: { type: 'integer', minimum: 0, maximum: 7 } },
        },
      },
    },
    async (request, reply) => {
      const user = await resolveAuthedUser(request);
      if (!user) return reply.status(401).send({ message: 'Unauthorized' });
      try {
        const result = await claimHabitWeekReward(user.id, request.body.requiredDays);
        if (result.status === 'not_enough_days') {
          return reply.status(422).send({ code: 'not_enough_days', message: 'Not enough days with check-ins', ...result });
        }
        if (result.status === 'already') {
          return reply.status(409).send({ code: 'already_claimed', message: 'Reward already claimed this week', ...result });
        }
        return reply.send(result);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Failed to claim week reward' });
      }
    }
  );
};
