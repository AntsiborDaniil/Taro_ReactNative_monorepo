import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { toOpenAiProviderError } from '../lib/openaiErrors';
import {
  HOROSCOPE_SIGNS,
  getDailyHoroscope,
  type HoroscopeLang,
  type HoroscopeSign,
} from '../services/astroHoroscopeService';

export const astroRoute = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  // Без авторизации: данных пользователя нет, гороскоп общий для знака и дня.
  fastify.get<{ Querystring: { sign: HoroscopeSign; lang?: HoroscopeLang } }>(
    '/astro/horoscope',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['sign'],
          properties: {
            sign: { type: 'string', enum: [...HOROSCOPE_SIGNS] },
            lang: { type: 'string', enum: ['ru', 'en'], default: 'ru' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await getDailyHoroscope(request.query.sign, request.query.lang ?? 'ru');
        reply.header('Cache-Control', 'public, max-age=300');
        return reply.send(result);
      } catch (error) {
        const providerError = toOpenAiProviderError(error);
        if (providerError) {
          return reply.status(providerError.httpStatus).send({ message: providerError.message, code: providerError.code });
        }
        request.log.error(error);
        return reply.status(502).send({ message: 'Could not generate horoscope', code: 'horoscope_failed' });
      }
    }
  );
};
