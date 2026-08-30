import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import { AUTH_SESSION_COOKIE_NAME } from '../constants/authCookie';
import {
  resolveAuthedUser,
  resolveToken,
  wantsCookieOnlyBody,
} from '../lib/authRequest';
import { getPublicAppUrl, sanitizeOAuthNext } from '../lib/appUrls';
import { redirectViaHtml } from '../lib/oauthPkceStorage';
import { oauthCookieOptions } from '../lib/oauthPkceStorage';
import { useMemoryBackend } from '../lib/devMode';
import {
  changePassword,
  completeOAuthCallback,
  getGoogleOAuthRedirectUrl,
  resendEmailVerificationCode,
  signIn,
  signUp,
  signInDevQuickLogin,
  signInWithTelegram,
  updateProfile,
  verifyEmailOtp,
} from '../services/authService';
import {
  type PasswordValidationCode,
  weakPasswordResponse,
} from '../lib/passwordPolicy';
import { getTarotDailyUsage } from '../services/tarotDailyUsageService';

function isWeakPasswordError(
  error: unknown
): error is Error & { name: 'WEAK_PASSWORD' } {
  return (
    error instanceof Error &&
    error.name === 'WEAK_PASSWORD' &&
    typeof error.message === 'string'
  );
}

type AuthBody = {
  name?: string;
  email: string;
  password: string;
};

type ProfileBody = {
  name: string;
};

type PasswordBody = {
  currentPassword: string;
  newPassword: string;
};

type VerifyEmailBody = {
  email: string;
  code: string;
  password?: string;
  name?: string;
};

type ResendCodeBody = {
  email: string;
};

type TelegramAuthBody = {
  initData: string;
};

function sendAuthSession(
  reply: FastifyReply,
  request: Parameters<typeof wantsCookieOnlyBody>[0],
  session: { token: string; refreshToken: string; user: unknown }
): ReturnType<FastifyReply['send']> {
  setSessionCookie(request, reply, session.token);

  if (wantsCookieOnlyBody(request)) {
    return reply.send({ user: session.user });
  }

  return reply.send({
    token: session.token,
    refreshToken: session.refreshToken,
    user: session.user,
  });
}

function redirectToAppWithAuth(
  reply: FastifyReply,
  nextPath: string,
  status: 'success' | 'error',
  message?: string
): void {
  const base = `${getPublicAppUrl()}${sanitizeOAuthNext(nextPath)}`;
  const url = new URL(base, getPublicAppUrl());
  url.searchParams.set('auth', status);
  if (message) {
    url.searchParams.set('authMessage', message);
  }
  const target = url.toString();
  if (status === 'success') {
    redirectViaHtml(reply, target);
    return;
  }
  reply.redirect(target);
}

const SESSION_COOKIE_MAX_AGE_SEC = 30 * 24 * 60 * 60;

function setSessionCookie(
  request: FastifyRequest,
  reply: FastifyReply,
  token: string
): void {
  reply.setCookie(AUTH_SESSION_COOKIE_NAME, token, {
    ...oauthCookieOptions(request),
    maxAge: SESSION_COOKIE_MAX_AGE_SEC,
  });
}

function clearSessionCookie(
  request: FastifyRequest,
  reply: FastifyReply
): void {
  reply.clearCookie(AUTH_SESSION_COOKIE_NAME, oauthCookieOptions(request));
}

export const authRoute = async (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) => {
  fastify.post<{ Body: AuthBody }>(
    '/auth/signup',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { name = '', email, password } = request.body;

        const result = await signUp({
          name,
          email,
          password,
        });

        if (result.kind === 'emailVerification') {
          const body: {
            needsEmailVerification: true;
            email: string;
            devVerificationCode?: string;
          } = {
            needsEmailVerification: true,
            email: result.email,
          };
          if (
            useMemoryBackend() &&
            result.devVerificationCode
          ) {
            body.devVerificationCode = result.devVerificationCode;
          }
          return reply.send(body);
        }

        return sendAuthSession(reply, request, result.session);
      } catch (error) {
        if (isWeakPasswordError(error)) {
          return reply
            .status(400)
            .send(
              weakPasswordResponse(error.message as PasswordValidationCode)
            );
        }

        if (
          error instanceof Error &&
          error.message === 'USER_ALREADY_EXISTS'
        ) {
          return reply.status(409).send({
            message: 'User with this email already exists',
          });
        }

        request.log.error(error);
        return reply.status(500).send({
          message: 'Could not create account',
        });
      }
    }
  );

  fastify.post<{ Body: AuthBody }>(
    '/auth/signin',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { email, password } = request.body;

        const session = await signIn({
          email,
          password,
        });

        return sendAuthSession(reply, request, session);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === 'INVALID_CREDENTIALS'
        ) {
          return reply.status(401).send({
            message: 'Invalid email or password',
          });
        }

        if (
          error instanceof Error &&
          error.message === 'EMAIL_NOT_CONFIRMED'
        ) {
          return reply.status(403).send({
            message: 'Email is not confirmed',
            needsEmailVerification: true,
            email: request.body.email.trim().toLowerCase(),
          });
        }

        request.log.error(error);
        return reply.status(500).send({
          message: 'Could not sign in',
        });
      }
    }
  );

  fastify.post<{ Body: VerifyEmailBody }>(
    '/auth/verify-email',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'code'],
          properties: {
            email: { type: 'string', format: 'email' },
            code: { type: 'string', minLength: 6, maxLength: 8 },
            password: { type: 'string', minLength: 1 },
            name: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const session = await verifyEmailOtp({
          email: request.body.email,
          code: request.body.code,
          password: request.body.password,
          name: request.body.name,
        });
        return sendAuthSession(reply, request, session);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === 'INVALID_VERIFICATION_CODE'
        ) {
          return reply.status(400).send({
            message: 'Invalid or expired verification code',
          });
        }

        if (
          error instanceof Error &&
          error.message === 'VERIFICATION_CODE_EXPIRED'
        ) {
          return reply.status(400).send({
            message: 'Verification code expired',
          });
        }

        if (
          error instanceof Error &&
          error.message === 'USER_RESOLVE_FAILED'
        ) {
          request.log.error(error);
          return reply.status(500).send({
            message: 'Account was created but could not be loaded. Try signing in.',
          });
        }

        request.log.error(error);
        return reply.status(500).send({
          message: 'Could not verify email',
        });
      }
    }
  );

  fastify.post<{ Body: ResendCodeBody }>(
    '/auth/resend-verification',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const devCode = await resendEmailVerificationCode(request.body.email);
        const body: { ok: true; devVerificationCode?: string } = { ok: true };
        if (useMemoryBackend() && devCode) {
          body.devVerificationCode = devCode;
        }
        return reply.send(body);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === 'VERIFICATION_NOT_PENDING'
        ) {
          return reply.status(400).send({
            message: 'No pending verification for this email',
          });
        }

        request.log.error(error);
        return reply.status(500).send({
          message: 'Could not resend verification code',
        });
      }
    }
  );

  fastify.get<{ Querystring: { next?: string } }>(
    '/auth/oauth/google',
    async (request, reply) => {
      try {
        const nextPath = sanitizeOAuthNext(request.query.next);
        const target = await getGoogleOAuthRedirectUrl(request, reply, nextPath);
        return redirectViaHtml(reply, target);
      } catch (error) {
        request.log.error(error);
        return redirectToAppWithAuth(
          reply,
          sanitizeOAuthNext(request.query.next),
          'error',
          'Google sign-in failed'
        );
      }
    }
  );

  fastify.get<{
    Querystring: { code?: string; next?: string; memory?: string };
  }>('/auth/oauth/callback', async (request, reply) => {
    const nextPath = sanitizeOAuthNext(request.query.next);

    try {
      const session = await completeOAuthCallback(request, reply, {
        code: request.query.code,
        memory: request.query.memory === '1',
      });

      setSessionCookie(request, reply, session.token);
      return redirectToAppWithAuth(reply, nextPath, 'success');
    } catch (error) {
      request.log.error(
        { err: error },
        'OAuth callback failed'
      );
      return redirectToAppWithAuth(
        reply,
        nextPath,
        'error',
        'Could not complete Google sign-in'
      );
    }
  });

  fastify.post<{ Body: TelegramAuthBody }>(
    '/auth/telegram',
    {
      schema: {
        body: {
          type: 'object',
          required: ['initData'],
          properties: {
            initData: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const session = await signInWithTelegram(request.body.initData);
        return sendAuthSession(reply, request, session);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === 'INVALID_TELEGRAM_INIT_DATA'
        ) {
          return reply.status(401).send({
            message: 'Invalid Telegram session',
          });
        }

        request.log.error(error);
        return reply.status(500).send({
          message: 'Could not sign in with Telegram',
        });
      }
    }
  );

  /** Local UI walkthrough: memory backend only. */
  fastify.post('/auth/dev/quick-login', async (request, reply) => {
    if (!useMemoryBackend()) {
      return reply.status(404).send({ message: 'Not found' });
    }

    try {
      const session = await signInDevQuickLogin();
      setSessionCookie(request, reply, session.token);
      // Always include token for local web (cookie may fail across localhost↔127.0.0.1)
      return reply.send({
        user: session.user,
        token: session.token,
        refreshToken: session.refreshToken,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        message: 'Could not complete dev quick login',
      });
    }
  });

  fastify.post('/auth/signout', async (request, reply) => {
    clearSessionCookie(request, reply);
    return reply.send({ ok: true });
  });

  fastify.get('/auth/me', async (request, reply) => {
    const token = resolveToken(request);

    if (!token) {
      return reply.status(401).send({
        message: 'Authorization token is required',
      });
    }

    const user = await resolveAuthedUser(request);

    if (!user) {
      return reply.status(401).send({
        message: 'Invalid token',
      });
    }

    const tarotDaily = await getTarotDailyUsage(user.id);

    return reply.send({
      user,
      tarotDaily,
    });
  });

  fastify.patch<{ Body: ProfileBody }>(
    '/auth/profile',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 2 },
          },
        },
      },
    },
    async (request, reply) => {
      const authed = await resolveAuthedUser(request);
      if (!authed) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const updated = await updateProfile(authed.id, {
        name: request.body.name,
      });

      if (!updated) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      return reply.send({ user: updated });
    }
  );

  fastify.patch<{ Body: PasswordBody }>(
    '/auth/password',
    {
      schema: {
        body: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string', minLength: 1 },
            newPassword: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const authed = await resolveAuthedUser(request);
      if (!authed) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      try {
        await changePassword({
          userId: authed.id,
          email: authed.email,
          currentPassword: request.body.currentPassword,
          newPassword: request.body.newPassword,
        });
      } catch (error) {
        if (isWeakPasswordError(error)) {
          return reply
            .status(400)
            .send(
              weakPasswordResponse(error.message as PasswordValidationCode)
            );
        }

        if (
          error instanceof Error &&
          error.message === 'INVALID_PASSWORD'
        ) {
          return reply.status(400).send({
            message: 'Current password is incorrect',
          });
        }

        request.log.error(error);
        return reply.status(500).send({
          message: 'Could not update password',
        });
      }

      return reply.send({ ok: true });
    }
  );
};
