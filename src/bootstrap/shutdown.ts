import type { FastifyInstance } from 'fastify';

const SIGNALS = ['SIGINT', 'SIGTERM'] as const;
const FORCE_EXIT_MS = 10_000;

// On a stop signal, closes the app, which runs every onClose hook (data store clients disconnect there).
export function registerShutdown(app: FastifyInstance): void {
  let closing = false;

  const close = async (signal: string): Promise<void> => {
    if (closing) return;
    closing = true;
    app.log.info({ signal }, 'Shutting down.');
    setTimeout(() => process.exit(1), FORCE_EXIT_MS).unref();

    try {
      await app.close();
      process.exit(0);
    } catch (error) {
      app.log.error(error, 'Shutdown failed.');
      process.exit(1);
    }
  };

  for (const signal of SIGNALS) {
    process.once(signal, () => {
      void close(signal);
    });
  }
}
