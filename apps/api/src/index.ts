import * as dotenv from 'dotenv';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { assertSupabaseEnv } from './lib/env';
import { logAuthRequest } from './lib/authEmailLog';
import {
  devAuthRequireEmailVerify,
  logBackendMode,
  shouldLogAuthHttp,
  useMemoryBackend,
} from './lib/devMode';
import { isCorsOriginAllowed } from './lib/cors';
import { interpretRoute } from './routes/interpret';
import { moodAndEnergyRoute } from './routes/moodAndEnergy';
import { habitsRoute } from './routes/habits';
import { authRoute } from './routes/auth';
import { tarotDailyRoute } from './routes/tarotDaily';
import { spreadsRoute } from './routes/spreads';
import { favoritesRoute } from './routes/favorites';
import { settingsRoute } from './routes/settings';

dotenv.config();

async function bootstrap(): Promise<void> {
  if (useMemoryBackend()) {
    logBackendMode();
  } else {
    assertSupabaseEnv();
  }

  const fastify = Fastify({
    logger: process.env.NODE_ENV === 'production',
    trustProxy: true,
  });

  await fastify.register(cookie);

  await fastify.register(cors, {
    origin(origin, cb) {
      if (isCorsOriginAllowed(origin)) {
        cb(null, true);
        return;
      }
      cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Web-Cookie-Auth',
    ],
  });

  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Tarot AI API (Supabase)',
        version: '2.0.0',
        description:
          'BFF для Mindful Tarot: Supabase Auth + Postgres, OpenAI через Fastify или Edge Functions',
      },
    },
  });

  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  fastify.get('/health', async () => ({
    ok: true,
    supabase: !useMemoryBackend(),
    memoryBackend: useMemoryBackend(),
    devAuthRequireEmailVerify: useMemoryBackend()
      ? devAuthRequireEmailVerify()
      : undefined,
  }));

  if (shouldLogAuthHttp()) {
    fastify.addHook('onRequest', async (request) => {
      if (request.url.startsWith('/api/auth')) {
        (request as { authLogStart?: number }).authLogStart = Date.now();
      }
    });

    fastify.addHook('onResponse', async (request, reply) => {
      const start = (request as { authLogStart?: number }).authLogStart;
      if (start !== undefined && request.url.startsWith('/api/auth')) {
        logAuthRequest(
          request.method,
          request.url,
          reply.statusCode,
          Date.now() - start
        );
      }
    });
  }

  await fastify.register(authRoute, { prefix: '/api' });
  await fastify.register(spreadsRoute, { prefix: '/api' });
  await fastify.register(favoritesRoute, { prefix: '/api' });
  await fastify.register(settingsRoute, { prefix: '/api' });
  await fastify.register(interpretRoute, { prefix: '/api' });
  await fastify.register(tarotDailyRoute, { prefix: '/api' });
  await fastify.register(moodAndEnergyRoute, { prefix: '/api' });
  await fastify.register(habitsRoute, { prefix: '/api' });

  const address = await fastify.listen({
    port: process.env.PORT ? Number(process.env.PORT) : 3002,
    host: '0.0.0.0',
  });

  console.log(`🚀 Server running at ${address}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
