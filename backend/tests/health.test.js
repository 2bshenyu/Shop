const request = require('supertest');
const path = require('path');
const fs = require('fs');

// use a temp test db
process.env.TEST_DB_FILE = path.join(__dirname, '..', 'data', 'test.sqlite');

const db = require('../src/db/db');
const app = require('../src/app');

beforeAll(async () => {
  // remove old test db
  try { fs.unlinkSync(process.env.TEST_DB_FILE); } catch (e) {}
  await db.init();
});

afterAll(() => {
  // cleanup
  try { fs.unlinkSync(process.env.TEST_DB_FILE); } catch (e) {}
});

test('GET /health returns ok', async () => {
  const res = await request(app).get('/health');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ ok: true });
});

