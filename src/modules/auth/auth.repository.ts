import type { User, UserRepository } from './auth.types.ts';

// In-memory store. Users are lost on restart. A MongoDB repository with the same shape replaces it later.
export function createInMemoryUserRepository(): UserRepository {
  const byId = new Map<string, User>();
  const idByEmail = new Map<string, string>();

  return {
    async findByEmail(email) {
      const id = idByEmail.get(email);
      return id ? byId.get(id) : undefined;
    },

    async findById(id) {
      return byId.get(id);
    },

    async create(user) {
      byId.set(user.id, user);
      idByEmail.set(user.email, user.id);
      return user;
    },
  };
}
