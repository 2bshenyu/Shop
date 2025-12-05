const request = require('supertest');
const app = require('../src/app');
const { reset } = require('../src/db/db');

let token;
let productId;
let cartItemId;

beforeAll(async () => {
  await reset();
  // seed via admin reset endpoint
  try { await request(app).get('/_admin/reset'); } catch(e){}
  const prodRes = await request(app).get('/products');
  const products = prodRes.body;
  if (!products || products.length === 0) throw new Error('No products available after reset');
  productId = products[0].id;

  // register user and get token
  const email = `cartedit+${Date.now()}@example.com`;
  const res = await request(app).post('/auth/register').send({ email, password: 'pass123', name: 'CartEdit' }).expect(201);
  token = res.body.token;
});

test('add item then update quantity then delete item', async () => {
  // add to cart
  await request(app).post('/cart/items').set('Authorization', `Bearer ${token}`).send({ product_id: productId, quantity: 1 }).expect(200);

  // get cart
  const cartRes = await request(app).get('/cart').set('Authorization', `Bearer ${token}`).expect(200);
  expect(cartRes.body.items.length).toBeGreaterThanOrEqual(1);
  cartItemId = cartRes.body.items[0].id;

  // update quantity to 2
  await request(app).patch('/cart/items/' + cartItemId).set('Authorization', `Bearer ${token}`).send({ quantity: 2 }).expect(200);
  const cartRes2 = await request(app).get('/cart').set('Authorization', `Bearer ${token}`).expect(200);
  expect(cartRes2.body.items[0].quantity).toBe(2);

  // delete item
  await request(app).delete('/cart/items/' + cartItemId).set('Authorization', `Bearer ${token}`).expect(200);
  const cartRes3 = await request(app).get('/cart').set('Authorization', `Bearer ${token}`).expect(200);
  expect(cartRes3.body.items.find(i => i.id === cartItemId)).toBeUndefined();
});

test('update to too large quantity returns insufficient_stock', async () => {
  // add again
  await request(app).post('/cart/items').set('Authorization', `Bearer ${token}`).send({ product_id: productId, quantity: 1 }).expect(200);
  const cartRes = await request(app).get('/cart').set('Authorization', `Bearer ${token}`).expect(200);
  const id = cartRes.body.items[0].id;

  // get product to know stock
  const prod = await request(app).get('/products/' + productId).expect(200);
  const big = prod.body.stock + 1000;
  await request(app).patch('/cart/items/' + id).set('Authorization', `Bearer ${token}`).send({ quantity: big }).expect(400);
});

