import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { getSupabaseAnonKey, getSupabaseUrl } from './env';

const OAUTH_COOKIE_PREFIX = 'sb_oauth_';
const OAUTH_COOKIE_MAX_AGE_SEC = 10 * 60;

function cookieKey(storageKey: string): string {
  return `${OAUTH_COOKIE_PREFIX}${storageKey}`;
}

/** Supabase client with PKCE verifier stored in HttpOnly cookies (per OAuth request). */
export function createOAuthSupabaseClient(
  request: FastifyRequest,
  reply: FastifyReply
): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storage: {
        getItem(key: string) {
          const value = request.cookies[cookieKey(key)];
          return value ?? null;
        },
        setItem(key: string, value: string) {
          reply.setCookie(cookieKey(key), value, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: OAUTH_COOKIE_MAX_AGE_SEC,
          });
        },
        removeItem(key: string) {
          reply.clearCookie(cookieKey(key), {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });
        },
      },
    },
  });
}

export function clearOAuthCookies(
  request: FastifyRequest,
  reply: FastifyReply
): void {
  for (const name of Object.keys(request.cookies)) {
    if (name.startsWith(OAUTH_COOKIE_PREFIX)) {
      reply.clearCookie(name, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }
  }
}
