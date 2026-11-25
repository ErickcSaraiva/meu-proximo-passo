import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const adminUsername = 'administrador';
const cookieName = '__Host-mpp-admin';
const sessionSeconds = 60 * 60;

export function adminCredentials() {
  const { ADMIN_PASSWORD: password, ADMIN_SESSION_SECRET: secret } = process.env;
  if (!password || password.length < 32 || password.length > 256 ||
      !secret || secret.length < 32 || secret === password) return null;
  return { password, secret };
}

export function matches(value, expected) {
  const digest = text => createHash('sha256').update(text).digest();
  return timingSafeEqual(digest(value), digest(expected));
}

function signature(payload, { password, secret }) {
  return createHmac('sha256', secret).update(password).update('\0').update(payload).digest('base64url');
}

export function hasAdminSession(request, credentials = adminCredentials()) {
  if (!credentials) return false;
  const cookie = request.headers.get('cookie')?.split(';').map(value => value.trim())
    .find(value => value.startsWith(`${cookieName}=`));
  const token = cookie?.slice(cookieName.length + 1) ?? '';
  const parts = /^(\d{1,12})\.([\w-]{24})\.([\w-]{43})$/.exec(token);
  if (!parts) return false;

  const [, expires, nonce, signed] = parts;
  return Number(expires) > Date.now() / 1000 &&
    matches(signed, signature(`${expires}.${nonce}`, credentials));
}

export function adminCookie(credentials) {
  let value = '';
  if (credentials) {
    const expires = Math.floor(Date.now() / 1000) + sessionSeconds;
    const payload = `${expires}.${randomBytes(18).toString('base64url')}`;
    value = `${payload}.${signature(payload, credentials)}`;
  }
  return `${cookieName}=${value}; Path=/; Max-Age=${credentials ? sessionSeconds : 0}; HttpOnly; Secure; SameSite=Strict`;
}
