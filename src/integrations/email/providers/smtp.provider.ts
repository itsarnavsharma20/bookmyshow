import type { EmailProvider } from '../email.types.ts';

export type SmtpConfig = {
  from: string;
  host: string;
  port: number;
};

// Plain SMTP. Placeholder until nodemailer is installed.
// The username and password come from env when this is filled in, never from code.
export function createSmtpProvider(_config: SmtpConfig): EmailProvider {
  return {
    name: 'smtp',
    async send() {
      throw new Error('SMTP provider is not implemented yet. Install nodemailer and fill in this file.');
    },
  };
}
