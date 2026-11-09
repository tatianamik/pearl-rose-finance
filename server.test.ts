import { describe, it, expect, beforeEach } from 'vitest';
import { sendTransactionalEmail, sentEmails } from './server';

describe('NotificationEngine', () => {
  beforeEach(() => {
    // Clear the array before each test
    sentEmails.length = 0;
  });

  it('should successfully append a new email to the sentEmails array', () => {
    expect(sentEmails.length).toBe(0);

    sendTransactionalEmail(
      'Test Template',
      'test@example.com',
      'Test Subject',
      'Test Content'
    );

    expect(sentEmails.length).toBe(1);

    const email = sentEmails[0];
    expect(email.template).toBe('Test Template');
    expect(email.to).toBe('test@example.com');
    expect(email.subject).toBe('Test Subject');
    expect(email.content).toBe('Test Content');
    expect(email.id).toBeDefined();
    expect(email.id.startsWith('email_')).toBe(true);
    expect(email.timestamp).toBeDefined();
  });
});
