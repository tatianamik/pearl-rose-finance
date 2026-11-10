import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendTransactionalEmail, sentEmails } from '../server';

describe('NotificationEngine', () => {
  beforeEach(() => {
    // Clear the global sentEmails array before each test
    sentEmails.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully append an email object to sentEmails', () => {
    const template = 'Test Template';
    const to = 'test@example.com';
    const subject = 'Test Subject';
    const content = 'Test Content';

    expect(sentEmails.length).toBe(0);

    sendTransactionalEmail(template, to, subject, content);

    expect(sentEmails.length).toBe(1);
  });

  it('should construct the email object with correct properties', () => {
    const template = 'Welcome';
    const to = 'newuser@example.com';
    const subject = 'Welcome to our platform';
    const content = 'Thanks for joining!';

    // Mock Date.now to ensure deterministic ID testing if needed, though Regex works fine
    const fixedTime = 1600000000000;
    vi.spyOn(Date, 'now').mockReturnValue(fixedTime);

    sendTransactionalEmail(template, to, subject, content);

    const email = sentEmails[0];

    expect(email.template).toBe(template);
    expect(email.to).toBe(to);
    expect(email.subject).toBe(subject);
    expect(email.content).toBe(content);
    expect(email.id).toBe(`email_${fixedTime}`);
    expect(new Date(email.timestamp).getTime()).not.toBeNaN(); // Check if valid date string
  });

  it('should handle sending multiple emails correctly', () => {
    sendTransactionalEmail('T1', 'u1@example.com', 'S1', 'C1');
    sendTransactionalEmail('T2', 'u2@example.com', 'S2', 'C2');
    sendTransactionalEmail('T3', 'u3@example.com', 'S3', 'C3');

    expect(sentEmails.length).toBe(3);
    expect(sentEmails[0].template).toBe('T1');
    expect(sentEmails[1].template).toBe('T2');
    expect(sentEmails[2].template).toBe('T3');
  });
});
