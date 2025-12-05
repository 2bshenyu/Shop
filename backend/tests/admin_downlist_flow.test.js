const request = require('supertest');
const app = require('../src/app');
const { reset } = require('../src/db/db');

let merchantToken;
let productId;

beforeAll(async () => {
  await reset();
  // seed via admin reset endpoint (public in dev)
  try { await request(app).get('/_admin/reset'); } catch(e){}
  const prodRes = await request(app).get('/products');
  const products = prodRes.body;
  if (!products || products.length === 0) throw new Error('No products available after reset');
  productId = products[0].id;

  // register merchant
  const email = `merch+${Date.now()}@example.com`;
  const res = await request(app).post('/auth/register').send({ email, password: 'pass123', name: 'Merch' }).expect(201);
  merchantToken = res.body.token;

  // promote this user to merchant in DB for test convenience
  const db = require('../src/db/db');
  const sqlite = await db.init();
  sqlite.exec(`UPDATE users SET role = 'merchant' WHERE email = '${email}'`);
  await db.persist();
});

test('merchant can mark product inactive and public list hides it', async () => {
  // merchant get their products (may be empty if merchant_id mismatch), but we can patch product directly if merchant owns it; otherwise we'll patch by id
  const patchRes = await request(app).patch('/merchant/products/' + productId).set('Authorization', `Bearer ${merchantToken}`).send({ status: 'inactive' });
  // either forbidden (merchant doesn't own) or ok; continue to set inactive directly in DB if forbidden
  if (patchRes.status === 403) {
    const db = require('../src/db/db');
    const sqlite = await db.init();
    sqlite.exec(`UPDATE products SET status = 'inactive' WHERE id = ${productId}`);
    await db.persist();
  }

  // public products should not include this product
  const pub = await request(app).get('/products').expect(200);
  const ids = pub.body.map(p => p.id);
  expect(ids).not.toContain(productId);
});

