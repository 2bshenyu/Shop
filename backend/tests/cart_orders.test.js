const request = require('supertest');
const app = require('../src/app');
const { reset } = require('../src/db/db');

let token;
let productId;

beforeAll(async () => {
  await reset();
  // ensure admin reset (redundant) by calling admin route if available
  try { await request(app).get('/_admin/reset'); } catch(e){}

  // fetch products
  const prodRes = await request(app).get('/products');
  const products = prodRes.body;
  expect(Array.isArray(products)).toBe(true);
  if (!products || products.length === 0) throw new Error('No products available after reset');
  productId = products[0].id;

  // register user and get token
  const email = `carttest+${Date.now()}@example.com`;
  const res = await request(app).post('/auth/register').send({ email, password: 'pass123', name: 'CartTester' }).expect(201);
  token = res.body.token;
});

test('add to cart and checkout should create order and reduce stock', async () => {
  // add to cart
  await request(app).post('/cart/items').set('Authorization', `Bearer ${token}`).send({ product_id: productId, quantity: 1 }).expect(200);

  // check cart
  const cartRes = await request(app).get('/cart').set('Authorization', `Bearer ${token}`).expect(200);
  expect(cartRes.body.items.length).toBeGreaterThanOrEqual(1);

  // get product stock before
  const prodBefore = await request(app).get(`/products/${productId}`).expect(200);
  const stockBefore = prodBefore.body.stock;

  // checkout
  const orderRes = await request(app).post('/orders').set('Authorization', `Bearer ${token}`).send({}).expect(200);
  expect(orderRes.body).toHaveProperty('ok', true);
  expect(orderRes.body).toHaveProperty('orderId');

  // check product stock after
  const prodAfter = await request(app).get(`/products/${productId}`).expect(200);
  expect(prodAfter.body.stock).toBe(stockBefore - 1);

  // cart should be empty
  const cartAfter = await request(app).get('/cart').set('Authorization', `Bearer ${token}`).expect(200);
  expect(cartAfter.body.items.length).toBe(0);
});
