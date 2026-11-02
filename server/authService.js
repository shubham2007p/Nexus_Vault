import crypto from 'node:crypto';
import { dbGet, dbRun } from './db.js';

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

/**
 * Hash password using Node's standard crypto.scrypt with a unique random salt
 */
export async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify password against stored salt:hash using constant-time timingSafeEqual
 */
export async function verifyPassword(password, storedHash) {
  return new Promise((resolve) => {
    if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
      return resolve(false);
    }
    const [salt, keyHex] = storedHash.split(':');
    if (!salt || !keyHex) return resolve(false);

    const expectedBuffer = Buffer.from(keyHex, 'hex');
    crypto.scrypt(password, salt, expectedBuffer.length, (err, derivedKey) => {
      if (err) return resolve(false);
      try {
        const matches = crypto.timingSafeEqual(expectedBuffer, derivedKey);
        resolve(matches);
      } catch (e) {
        resolve(false);
      }
    });
  });
}

/**
 * Create a new session for a user (defaults to 30 days validity)
 */
export async function createSession(userId, durationDays = 30) {
  const token = crypto.randomBytes(32).toString('hex');
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  await dbRun(
    `INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`,
    [sessionId, userId, token, expiresAt, now]
  );

  return { token, expiresAt };
}

/**
 * Retrieve active session user
 */
export async function getSessionUser(token) {
  if (!token || typeof token !== 'string') return null;
  const now = new Date().toISOString();
  const row = await dbGet(
    `SELECT u.id, u.email, u.name, u.created_at, s.token, s.expires_at
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token = ? AND s.expires_at > ?`,
    [token.trim(), now]
  );
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    token: row.token,
    expiresAt: row.expires_at,
  };
}

/**
 * Invalidate a session token
 */
export async function deleteSession(token) {
  if (!token) return;
  await dbRun(`DELETE FROM sessions WHERE token = ?`, [token.trim()]);
}
