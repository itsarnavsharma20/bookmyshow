import { randomUUID } from 'node:crypto';

import type { Id } from '../shared/types.ts';

export function newId(): Id {
  return randomUUID();
}
