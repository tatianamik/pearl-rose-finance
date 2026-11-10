import { describe, it, expect, beforeEach } from 'vitest';
import { sendTransactionalEmail, sentEmails } from './server';

describe('NotificationEngine: sendTransactionalEmail', () => {
  beforeEach(() => {
    // Clear the array before each test
    sentEmails.length = 0;
  });

  it('should successfully add an email to sentEmails array', () => {
    const template = 'Magic Link Request';
    const to = 'test@example.com';
    const subject = 'Test Subject';
    const content = 'Hello, this is a test!';

    sendTransactionalEmail(template, to, subject, content);

    expect(sentEmails).toHaveLength(1);
    const sentEmail = sentEmails[0];

    expect(sentEmail.template).toBe(template);
    expect(sentEmail.to).toBe(to);
    expect(sentEmail.subject).toBe(subject);
    expect(sentEmail.content).toBe(content);

    // Check ID formatting
    expect(sentEmail.id).toMatch(/^email_\d+$/);

    // Check timestamp formatting (ISO 8601 string)
    expect(() => new Date(sentEmail.timestamp)).not.toThrow();
    expect(sentEmail.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });

  it('should support multiple emails being sent sequentially', () => {
    sendTransactionalEmail('T1', 'user1@example.com', 'S1', 'C1');
    sendTransactionalEmail('T2', 'user2@example.com', 'S2', 'C2');

    expect(sentEmails).toHaveLength(2);
    expect(sentEmails[0].to).toBe('user1@example.com');
    expect(sentEmails[1].to).toBe('user2@example.com');
  });
});
