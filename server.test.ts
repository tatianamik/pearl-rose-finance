import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendTransactionalEmail, sentEmails } from './server';

describe('NotificationEngine - sendTransactionalEmail', () => {
  beforeEach(() => {
    // Clear the array before each test
    sentEmails.length = 0;

    // Mock Date.now to have predictable IDs if needed, but we can also just assert formatting
    // vi.useFakeTimers();
    // vi.setSystemTime(new Date('2023-01-01T00:00:00Z'));
  });

  afterEach(() => {
    // vi.useRealTimers();
  });

  it('should push a simulated email to the sentEmails array', () => {
    const template = 'Welcome Email';
    const to = 'test@example.com';
    const subject = 'Welcome to AGD Budgets';
    const content = 'Hello Test, welcome!';

    sendTransactionalEmail(template, to, subject, content);

    expect(sentEmails.length).toBe(1);

    const email = sentEmails[0];
    expect(email.template).toBe(template);
    expect(email.to).toBe(to);
    expect(email.subject).toBe(subject);
    expect(email.content).toBe(content);
  });

  it('should generate an ID starting with "email_"', () => {
    sendTransactionalEmail('T1', 'user1@example.com', 'S1', 'C1');
    expect(sentEmails.length).toBe(1);
    expect(sentEmails[0].id).toMatch(/^email_\d+$/);
  });

  it('should generate a valid ISO timestamp', () => {
    sendTransactionalEmail('T2', 'user2@example.com', 'S2', 'C2');
    expect(sentEmails.length).toBe(1);

    const timestamp = sentEmails[0].timestamp;
    const parsedDate = new Date(timestamp);

    expect(!isNaN(parsedDate.getTime())).toBe(true);
    expect(parsedDate.toISOString()).toBe(timestamp);
  });

  it('should handle multiple emails sequentially', () => {
    sendTransactionalEmail('T1', 'user1@example.com', 'S1', 'C1');
    sendTransactionalEmail('T2', 'user2@example.com', 'S2', 'C2');
    sendTransactionalEmail('T3', 'user3@example.com', 'S3', 'C3');

    expect(sentEmails.length).toBe(3);

    expect(sentEmails[0].to).toBe('user1@example.com');
    expect(sentEmails[1].to).toBe('user2@example.com');
    expect(sentEmails[2].to).toBe('user3@example.com');
  });

  it('should correctly log to console (optional)', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    sendTransactionalEmail('TestTemplate', 'test@test.com', 'TestSubj', 'TestContent');

    expect(consoleSpy).toHaveBeenCalledWith(
      '[NotificationEngine] Email Sent: [TestTemplate] to test@test.com | Subject: TestSubj'
    );

    consoleSpy.mockRestore();
  });
});
