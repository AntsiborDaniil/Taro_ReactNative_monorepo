import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { getSupabaseAnonKey, getSupabaseUrl } from './env';
import {
  clearOAuthPkceCookies,
  createOAuthPkceStorage,
} from './oauthPkceStorage';

/** Supabase client with PKCE verifier in one HttpOnly cookie (works behind Vercel proxy). */
export function createOAuthSupabaseClient(
  request: FastifyRequest,
  reply: FastifyReply
): SupabaseClient {
  const storage = createOAuthPkceStorage(request, reply);

  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storage,
    },
  });
}

export function clearOAuthCookies(
  request: FastifyRequest,
  reply: FastifyReply
): void {
  clearOAuthPkceCookies(request, reply);
}
