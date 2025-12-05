const request = require('supertest');
const app = require('../src/app');
const { reset } = require('../src/db/db');

beforeAll(async () => {
  // reset DB to a known state
  await reset();
});

describe('Auth API', () => {
  const user = { email: `test+${Date.now()}@example.com`, password: 'pass123', name: 'Tester' };

  test('register should return token and user', async () => {
    const res = await request(app).post('/auth/register').send(user).expect(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', user.email);
  });

  test('login should succeed with correct credentials', async () => {
    const res = await request(app).post('/auth/login').send({ email: user.email, password: user.password }).expect(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', user.email);
  });
});
