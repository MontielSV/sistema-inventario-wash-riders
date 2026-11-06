import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

const COOKIE_NAME = 'wash_riders_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.DATABASE_URL;
  if (!secret) throw new Error('Configura AUTH_SECRET o DATABASE_URL');
  return secret;
}

function sign(payload: string) {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedPassword: string) {
  const [algorithm, salt, storedHash] = storedPassword.split('$');
  if (algorithm !== 'scrypt' || !salt || !storedHash) {
    const provided = Buffer.from(password);
    const stored = Buffer.from(storedPassword);
    return provided.length === stored.length && timingSafeEqual(provided, stored);
  }

  try {
    const providedHash = scryptSync(password, salt, 64);
    const expectedHash = Buffer.from(storedHash, 'hex');
    return providedHash.length === expectedHash.length && timingSafeEqual(providedHash, expectedHash);
  } catch {
    return false;
  }
}

export function createSession(username: string) {
  const payload = Buffer.from(JSON.stringify({
    username,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  })).toString('base64url');

  return `${payload}.${sign(payload)}`;
}

export function isAuthenticated(request: Request) {
  try {
    const cookie = request.headers.get('cookie')
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${COOKIE_NAME}=`))
      ?.slice(COOKIE_NAME.length + 1);

    if (!cookie) return false;

    const [payload, signature] = cookie.split('.');
    if (!payload || !signature) return false;

    const expected = Buffer.from(sign(payload));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;

    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof session.username === 'string' && session.expiresAt > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function setSessionCookie(response: NextResponse, value: string) {
  response.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}