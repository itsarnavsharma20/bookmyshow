import type { EmailProvider } from '../email.types.ts';

export type SesConfig = {
  from: string;
  region: string;
};

// Amazon SES. Placeholder until @aws-sdk/client-ses is installed.
// Credentials come from the AWS default provider chain, never from code.
export function createSesProvider(_config: SesConfig): EmailProvider {
  return {
    name: 'ses',
    async send() {
      throw new Error('SES provider is not implemented yet. Install @aws-sdk/client-ses and fill in this file.');
    },
  };
}
