import { describe, it, expect, beforeEach } from 'vitest';
import { sendTransactionalEmail, sentEmails } from './server';

describe('NotificationEngine - sendTransactionalEmail', () => {
  beforeEach(() => {
    // Clear the global array before each test to ensure test isolation
    sentEmails.length = 0;
  });

  it('should append a new email object to the sentEmails array', () => {
    expect(sentEmails.length).toBe(0);

    const template = 'Welcome Email';
    const to = 'user@example.com';
    const subject = 'Welcome to the platform!';
    const content = 'Hello user, welcome to our app.';

    sendTransactionalEmail(template, to, subject, content);

    expect(sentEmails.length).toBe(1);

    const email = sentEmails[0];
    expect(email.template).toBe(template);
    expect(email.to).toBe(to);
    expect(email.subject).toBe(subject);
    expect(email.content).toBe(content);

    // Check that id and timestamp are generated correctly
    expect(email.id).toMatch(/^email_\d+$/);
    expect(new Date(email.timestamp).getTime()).not.toBeNaN();
  });

  it('should handle multiple emails correctly', () => {
    sendTransactionalEmail('T1', 'user1@example.com', 'Sub 1', 'Content 1');
    sendTransactionalEmail('T2', 'user2@example.com', 'Sub 2', 'Content 2');

    expect(sentEmails.length).toBe(2);

    expect(sentEmails[0].template).toBe('T1');
    expect(sentEmails[1].template).toBe('T2');

    // IDs should be unique (assuming Date.now() doesn't collide,
    // or at least they are properly formatted).
    expect(sentEmails[0].id).toMatch(/^email_\d+$/);
    expect(sentEmails[1].id).toMatch(/^email_\d+$/);
  });
});
