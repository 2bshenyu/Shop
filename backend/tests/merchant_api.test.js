const request = require('supertest');
const path = require('path');
const fs = require('fs');

process.env.TEST_DB_FILE = path.join(__dirname, '..', 'data', 'test.sqlite');
const db = require('../src/db/db');
const app = require('../src/app');

beforeAll(async () => {
  try { fs.unlinkSync(process.env.TEST_DB_FILE); } catch (e) {}
  await db.init();
});

afterAll(() => {
  try { fs.unlinkSync(process.env.TEST_DB_FILE); } catch (e) {}
});

test('merchant can create product and it is visible publicly', async () => {
  // register merchant
  const email = `m${Date.now()}@test`;
  const res = await request(app).post('/auth/register').send({ email, password: 'm', name: 'Me', role: 'merchant' });
  expect(res.statusCode).toBe(201);
  const token = res.body.token;

  // create product
  const prod = { title: 'NewProd', description: 'desc', price_cents: 3000, stock: 3 };
  const create = await request(app).post('/merchant/products').set('Authorization', `Bearer ${token}`).send(prod);
  expect(create.statusCode).toBe(201);

  // list public products
  const list = await request(app).get('/products');
  expect(list.statusCode).toBe(200);
  expect(list.body.find(p=>p.title === 'NewProd')).toBeTruthy();
});

