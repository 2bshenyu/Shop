const request = require('supertest');
const path = require('path');
const fs = require('fs');

process.env.TEST_DB_FILE = path.join(__dirname, '..', 'data', 'test.sqlite');
const db = require('../src/db/db');
const app = require('../src/app');

beforeAll(async () => {
  try { fs.unlinkSync(process.env.TEST_DB_FILE); } catch (e) {}
  await db.init();
  // insert sample product
  const _db = db.getDB();
  const now = new Date().toISOString();
  const stmt = _db.prepare('INSERT INTO products (merchant_id, title, description, price_cents, stock, image_url, status, created_at) VALUES (:mid, :title, :desc, :price_cents, :stock, :image_url, :status, :created_at)');
  stmt.bind({ ':mid': 1, ':title': 'TestProd', ':desc': 'desc', ':price_cents': 1000, ':stock': 5, ':image_url': '', ':status': 'active', ':created_at': now });
  stmt.step(); stmt.free();
  await db.persist();
});

afterAll(() => {
  try { fs.unlinkSync(process.env.TEST_DB_FILE); } catch (e) {}
});

test('GET /products returns list', async () => {
  const res = await request(app).get('/products');
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.find(p => p.title === 'TestProd')).toBeTruthy();
});

