import { buildApp } from './app.ts';
import { bootstrap } from './bootstrap/index.ts';
import { registerShutdown } from './bootstrap/shutdown.ts';
import { startTelemetry } from './bootstrap/telemetry.ts';
import { env } from './config/env.ts';

const stopTelemetry = await startTelemetry();
const app = buildApp();

app.addHook('onClose', async () => {
  await stopTelemetry();
});

await bootstrap(app);
registerShutdown(app);

try {
  await app.listen({ host: env.host, port: env.port });
} catch (error) {
  app.log.error(error, 'Server failed to start.');
  process.exit(1);
}
