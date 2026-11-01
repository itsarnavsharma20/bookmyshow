// Telemetry must start before the Fastify app is created, so auto-instrumentation can patch modules first.
// This is a placeholder. The OpenTelemetry SDK is added here once the @opentelemetry packages are installed.

export type StopTelemetry = () => Promise<void>;

export async function startTelemetry(): Promise<StopTelemetry> {
  return async () => {};
}
