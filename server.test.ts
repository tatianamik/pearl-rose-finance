import { describe, it, expect, beforeEach } from 'vitest';
import { sendTransactionalEmail, sentEmails } from './server.ts';

describe('sendTransactionalEmail', () => {
  beforeEach(() => {
    // Clear the array before each test
    sentEmails.length = 0;
  });

  it('should add an email to the sentEmails array with correct content', () => {
    sendTransactionalEmail(
      'Welcome Template',
      'user@example.com',
      'Welcome to the Platform',
      'Hello User, welcome!'
    );

    expect(sentEmails).toHaveLength(1);
    const email = sentEmails[0];

    expect(email.template).toBe('Welcome Template');
    expect(email.to).toBe('user@example.com');
    expect(email.subject).toBe('Welcome to the Platform');
    expect(email.content).toBe('Hello User, welcome!');
  });

  it('should generate an id with the prefix email_ and a valid timestamp', () => {
    const beforeCall = Date.now();
    sendTransactionalEmail('T', 'to@example.com', 'Sub', 'Content');
    const afterCall = Date.now();

    expect(sentEmails).toHaveLength(1);
    const email = sentEmails[0];

    // Check id
    expect(email.id).toMatch(/^email_\d+$/);
    const idTimestamp = parseInt(email.id.split('_')[1], 10);
    expect(idTimestamp).toBeGreaterThanOrEqual(beforeCall);
    expect(idTimestamp).toBeLessThanOrEqual(afterCall);

    // Check ISO timestamp
    const date = new Date(email.timestamp);
    expect(date.getTime()).not.toBeNaN();
    expect(date.toISOString()).toBe(email.timestamp);
  });
});
