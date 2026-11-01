// Reads and checks every environment variable in one place.
// The rest of the app imports `env` and never touches process.env.
// Data store URLs and secrets are optional here. Nothing connects until a bootstrap file asks for them.

const NODE_ENVS = ['development', 'test', 'production'] as const;
const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

type NodeEnv = (typeof NODE_ENVS)[number];
type LogLevel = (typeof LOG_LEVELS)[number];
type Source = Record<string, string | undefined>;

export type Env = Readonly<{
  nodeEnv: NodeEnv;
  host: string;
  port: number;
  logLevel: LogLevel;
  logToFile: boolean;
  logDir: string;
  corsOrigins: string[];
  rateLimitMax: number;
  rateLimitWindow: string;
  mongoUri: string | undefined;
  redisUrl: string | undefined;
  elasticsearchNode: string | undefined;
  jwtSecret: string | undefined;
  jwtExpiresIn: string;
}>;

function text(source: Source, key: string, fallback: string): string {
  const value = source[key]?.trim();
  return value ? value : fallback;
}

function optional(source: Source, key: string): string | undefined {
  const value = source[key]?.trim();
  return value ? value : undefined;
}

function integer(source: Source, key: string, fallback: number): number {
  const raw = source[key]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid env ${key}: expected a non-negative integer.`);
  }
  return value;
}

function flag(source: Source, key: string, fallback: boolean): boolean {
  const raw = source[key]?.trim().toLowerCase();
  if (!raw) return fallback;
  if (['1', 'true', 'yes'].includes(raw)) return true;
  if (['0', 'false', 'no'].includes(raw)) return false;
  throw new Error(`Invalid env ${key}: expected true or false.`);
}

function list(source: Source, key: string): string[] {
  const raw = source[key]?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
}

function oneOf<T extends string>(source: Source, key: string, allowed: readonly T[], fallback: T): T {
  const raw = source[key]?.trim();
  if (!raw) return fallback;
  const match = allowed.find((item) => item === raw);
  if (!match) throw new Error(`Invalid env ${key}: expected one of ${allowed.join(', ')}.`);
  return match;
}

export function loadEnv(source: Source = process.env): Env {
  const nodeEnv = oneOf(source, 'NODE_ENV', NODE_ENVS, 'development');
  const jwtSecret = optional(source, 'JWT_SECRET');

  if (nodeEnv === 'production' && !jwtSecret) {
    throw new Error('Missing env JWT_SECRET: it is required in production.');
  }

  return {
    nodeEnv,
    host: text(source, 'HOST', '0.0.0.0'),
    port: integer(source, 'PORT', 3000),
    logLevel: oneOf(source, 'LOG_LEVEL', LOG_LEVELS, nodeEnv === 'test' ? 'silent' : 'info'),
    logToFile: flag(source, 'LOG_TO_FILE', false),
    logDir: text(source, 'LOG_DIR', 'logs'),
    corsOrigins: list(source, 'CORS_ORIGINS'),
    rateLimitMax: integer(source, 'RATE_LIMIT_MAX', 100),
    rateLimitWindow: text(source, 'RATE_LIMIT_WINDOW', '1 minute'),
    mongoUri: optional(source, 'MONGO_URI'),
    redisUrl: optional(source, 'REDIS_URL'),
    elasticsearchNode: optional(source, 'ELASTICSEARCH_NODE'),
    jwtSecret,
    jwtExpiresIn: text(source, 'JWT_EXPIRES_IN', '15m'),
  };
}

export const env: Env = loadEnv();
