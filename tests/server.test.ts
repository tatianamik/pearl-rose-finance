import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { app } from '../server';

describe('Health Check API', () => {
  it('should return 200 OK and status: ok', async () => {
    const response = await request(app).get('/agd-budgets/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
