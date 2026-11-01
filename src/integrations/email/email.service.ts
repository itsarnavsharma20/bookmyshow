import { BadRequestError } from '../../shared/errors.ts';
import type { EmailMessage, EmailProvider, EmailService } from './email.types.ts';

function validate(message: EmailMessage): void {
  if (message.to.length === 0) throw new BadRequestError('An email needs at least one recipient.');
  if (message.to.some((address) => !address.includes('@'))) throw new BadRequestError('An email address is not valid.');
  if (message.subject.trim() === '') throw new BadRequestError('An email needs a subject.');
}

// The rest of the app calls this. Which vendor sends the mail is decided by the provider passed in.
export function createEmailService(provider: EmailProvider): EmailService {
  return {
    async send(message) {
      validate(message);
      await provider.send(message);
    },
  };
}
