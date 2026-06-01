import { FastifyRequest } from 'fastify';
import { AUTH_SESSION_COOKIE_NAME } from '../constants/authCookie';
import type { AuthPublicUser } from '../services/authService';
import { getPublicUserByAccessToken } from '../services/authService';

export function readBearerToken(authorization?: string): string | null {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');

  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export function wantsCookieOnlyBody(request: FastifyRequest): boolean {
  const raw = request.headers['x-web-cookie-auth'];
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === '1';
}

export function resolveToken(request: FastifyRequest): string | null {
  const rawAuthorization = Array.isArray(request.headers.authorization)
    ? request.headers.authorization[0]
    : request.headers.authorization;
  const bearer = readBearerToken(rawAuthorization);
  if (bearer) {
    return bearer;
  }

  const cookieVal = request.cookies[AUTH_SESSION_COOKIE_NAME];
  return cookieVal?.trim() ? cookieVal : null;
}

export async function resolveAuthedUser(
  request: FastifyRequest
): Promise<AuthPublicUser | null> {
  const token = resolveToken(request);
  if (!token) {
    return null;
  }
  return getPublicUserByAccessToken(token);
}
