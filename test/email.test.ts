import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createEmailService } from '../src/integrations/email/email.service.ts';
import type { EmailMessage, EmailProvider } from '../src/integrations/email/email.types.ts';
import { BadRequestError } from '../src/shared/errors.ts';

function fakeProvider(): EmailProvider & { sent: EmailMessage[] } {
  const sent: EmailMessage[] = [];
  return {
    name: 'fake',
    sent,
    async send(message) {
      sent.push(message);
    },
  };
}

const valid: EmailMessage = { to: ['asha@example.com'], subject: 'Your booking', text: 'Seat A1, 17:00.' };

describe('email service', () => {
  test('passes a valid message to the provider', async () => {
    const provider = fakeProvider();
    await createEmailService(provider).send(valid);

    assert.deepEqual(provider.sent, [valid]);
  });

  test('rejects a message with no recipient and never calls the provider', async () => {
    const provider = fakeProvider();

    await assert.rejects(createEmailService(provider).send({ ...valid, to: [] }), BadRequestError);
    assert.equal(provider.sent.length, 0);
  });

  test('rejects an address without @', async () => {
    const provider = fakeProvider();

    await assert.rejects(createEmailService(provider).send({ ...valid, to: ['not-an-email'] }), BadRequestError);
    assert.equal(provider.sent.length, 0);
  });

  test('rejects a blank subject', async () => {
    const provider = fakeProvider();

    await assert.rejects(createEmailService(provider).send({ ...valid, subject: '   ' }), BadRequestError);
    assert.equal(provider.sent.length, 0);
  });

  test('lets a provider failure reach the caller', async () => {
    const failing: EmailProvider = {
      name: 'failing',
      async send() {
        throw new Error('vendor is down');
      },
    };

    await assert.rejects(createEmailService(failing).send(valid), /vendor is down/);
  });
});
