import type { Static } from '@sinclair/typebox';

import type { Id } from '../../shared/types.ts';
import type { LoginBodySchema, PublicUserSchema, RegisterBodySchema } from './auth.schema.ts';

export type Role = 'customer' | 'admin';

export type User = {
  id: Id;
  email: string;
  name: string;
  role: Role;
  // Format "salt:hash", both hex. Never sent in a response.
  passwordHash: string;
  createdAt: string;
};

export type PublicUser = Static<typeof PublicUserSchema>;
export type RegisterBody = Static<typeof RegisterBodySchema>;
export type LoginBody = Static<typeof LoginBodySchema>;

// What goes inside the JWT. `sub` is the user id.
export type AuthTokenPayload = {
  sub: Id;
  role: Role;
};

export type UserRepository = {
  findByEmail(email: string): Promise<User | undefined>;
  findById(id: Id): Promise<User | undefined>;
  create(user: User): Promise<User>;
};

export type AuthService = {
  register(body: RegisterBody): Promise<PublicUser>;
  verifyCredentials(body: LoginBody): Promise<User>;
  getProfile(id: Id): Promise<PublicUser>;
};
