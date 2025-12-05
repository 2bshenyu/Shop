const express = require('express');
const router = express.Router();
const { reset, init, persist } = require('../db/db');
const { authRequired, roleRequired } = require('../middleware/auth');

// Only enable in non-production
router.get('/reset', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'forbidden' });
  try {
    await reset();
    // insert sample products
    const db = await init();
    const now = new Date().toISOString();
    const products = [
      ['1', 'Apple iPhone 14', 'Smartphone from Apple', 69900, 10, 'https://via.placeholder.com/150', 'active', now],
      ['1', 'Samsung Galaxy S23', 'Flagship Android phone', 59900, 8, 'https://via.placeholder.com/150', 'active', now],
      ['1', 'Wireless Headphones', 'Noise cancelling', 19900, 15, 'https://via.placeholder.com/150', 'active', now]
    ];

    const insert = db.prepare('INSERT INTO products (merchant_id, title, description, price_cents, stock, image_url, status, created_at) VALUES (:merchant_id, :title, :description, :price_cents, :stock, :image_url, :status, :created_at)');
    for (const p of products) {
      insert.bind({ ':merchant_id': p[0], ':title': p[1], ':description': p[2], ':price_cents': p[3], ':stock': p[4], ':image_url': p[5], ':status': p[6], ':created_at': p[7] });
      insert.step();
      insert.reset();
    }
    insert.free();

    // ensure admin user exists
    const admSel = db.prepare("SELECT id FROM users WHERE email = 'admin@example.com'");
    admSel.step();
    if (!admSel.getAsObject().id) {
      admSel.free();
      const bcrypt = require('bcryptjs');
      const pwHash = bcrypt.hashSync('admin123', 10);
      const uins = db.prepare('INSERT INTO users (email, password_hash, name, role, created_at) VALUES (:email, :hash, :name, :role, :now)');
      uins.bind({ ':email': 'admin@example.com', ':hash': pwHash, ':name': 'Admin', ':role': 'admin', ':now': now });
      uins.step(); uins.free();
    } else {
      admSel.free();
    }

    await persist();

    res.json({ ok: true });
  } catch (err) {
    console.error('admin reset failed', err);
    res.status(500).json({ error: 'reset_failed' });
  }
});

// GET /admin/status - simple statistics (admin only)
router.get('/status', authRequired, roleRequired('admin'), async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'forbidden' });
  try {
    const db = await init();
    const orders = db.prepare('SELECT COUNT(*) as c FROM orders');
    orders.step(); const ordersCount = orders.getAsObject().c; orders.free();
    const users = db.prepare('SELECT COUNT(*) as c FROM users');
    users.step(); const usersCount = users.getAsObject().c; users.free();
    const products = db.prepare('SELECT COUNT(*) as c FROM products');
    products.step(); const productsCount = products.getAsObject().c; products.free();
    const inactive = db.prepare("SELECT COUNT(*) as c FROM products WHERE status <> 'active'");
    inactive.step(); const inactiveCount = inactive.getAsObject().c; inactive.free();
    res.json({ orders_count: ordersCount, users_count: usersCount, products_count: productsCount, inactive_products_count: inactiveCount });
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'server_error' });
  }
});

// PATCH /admin/products/:id/status - change product status (active/inactive)
router.patch('/products/:id/status', authRequired, roleRequired('admin'), async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'forbidden' });
  try {
    const db = await init();
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!['active','inactive'].includes(status)) return res.status(400).json({ error: 'invalid_status' });
    const sel = db.prepare('SELECT id FROM products WHERE id = :id'); sel.bind({ ':id': id });
    if (!sel.step()) { sel.free(); return res.status(404).json({ error: 'not_found' }); }
    sel.free();
    const upd = db.prepare('UPDATE products SET status = :status WHERE id = :id'); upd.bind({ ':status': status, ':id': id }); upd.step(); upd.free();
    await persist();
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'server_error' }); }
});

// GET /products - admin view of all products (including inactive)
router.get('/products', authRequired, roleRequired('admin'), async (req, res) => {
  try {
    const db = await init();
    const stmt = db.prepare('SELECT * FROM products');
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'server_error' }); }
});

module.exports = router;
