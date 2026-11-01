import { Type } from '@sinclair/typebox';

export const RegisterBodySchema = Type.Object({
  email: Type.String({ format: 'email', maxLength: 254 }),
  password: Type.String({ minLength: 8, maxLength: 128 }),
  name: Type.String({ minLength: 1, maxLength: 80 }),
});

export const LoginBodySchema = Type.Object({
  email: Type.String({ format: 'email', maxLength: 254 }),
  password: Type.String({ minLength: 1, maxLength: 128 }),
});

export const PublicUserSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  name: Type.String(),
  role: Type.Union([Type.Literal('customer'), Type.Literal('admin')]),
  createdAt: Type.String(),
});

export const TokenResponseSchema = Type.Object({
  accessToken: Type.String(),
  tokenType: Type.Literal('Bearer'),
  expiresIn: Type.String(),
});
