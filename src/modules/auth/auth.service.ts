import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

import { ConflictError, NotFoundError, UnauthorizedError } from '../../shared/errors.ts';
import { newId } from '../../utils/id.ts';
import type { AuthService, PublicUser, User, UserRepository } from './auth.types.ts';

const KEY_LENGTH = 64;

// A well-formed hash that matches no password. Checked when the email is unknown, so both failures take similar time.
const UNKNOWN_USER_HASH = `${'00'.repeat(16)}:${'00'.repeat(KEY_LENGTH)}`;

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex = '', keyHex = ''] = stored.split(':');
  const expected = Buffer.from(keyHex, 'hex');
  const actual = await derive(password, Buffer.from(saltHex, 'hex'));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function toPublic(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt };
}

export function createAuthService(repository: UserRepository): AuthService {
  return {
    async register(body) {
      const email = body.email.trim().toLowerCase();
      if (await repository.findByEmail(email)) throw new ConflictError('An account with this email already exists.');

      const user = await repository.create({
        id: newId(),
        email,
        name: body.name.trim(),
        role: 'customer',
        passwordHash: await hashPassword(body.password),
        createdAt: new Date().toISOString(),
      });
      return toPublic(user);
    },

    async verifyCredentials(body) {
      const user = await repository.findByEmail(body.email.trim().toLowerCase());
      const matches = await verifyPassword(body.password, user?.passwordHash ?? UNKNOWN_USER_HASH);
      if (!user || !matches) throw new UnauthorizedError('Invalid email or password.');
      return user;
    },

    async getProfile(id) {
      const user = await repository.findById(id);
      if (!user) throw new NotFoundError('User', id);
      return toPublic(user);
    },
  };
}
