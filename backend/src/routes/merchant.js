const express = require('express');
const router = express.Router();
const { init, persist, getDB } = require('../db/db');
const { authRequired } = require('../middleware/auth');

// middleware: require merchant role
function merchantOnly(req, res, next) {
  if (!req.user || req.user.role !== 'merchant') return res.status(403).json({ error: 'forbidden' });
  next();
}

// GET /merchant/products - list merchant's products
router.get('/products', authRequired, merchantOnly, async (req, res) => {
  try {
    const db = await init();
    const stmt = db.prepare('SELECT * FROM products WHERE merchant_id = :mid');
    stmt.bind({ ':mid': req.user.id });
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'server_error' }); }
});

// POST /merchant/products - create product
router.post('/products', authRequired, merchantOnly, async (req, res) => {
  try {
    const db = await init();
    const { title, description, price_cents, stock, image_url } = req.body;
    if (!title || typeof price_cents === 'undefined') return res.status(400).json({ error: 'invalid' });
    const stmt = db.prepare('INSERT INTO products (merchant_id, title, description, price_cents, stock, image_url, status, created_at) VALUES (:mid, :title, :desc, :price, :stock, :img, :status, :now)');
    stmt.bind({ ':mid': req.user.id, ':title': title, ':desc': description || '', ':price': price_cents, ':stock': stock || 0, ':img': image_url || '', ':status': 'active', ':now': new Date().toISOString() });
    stmt.step(); stmt.free();
    await persist();
    const last = db.exec('SELECT last_insert_rowid()');
    const id = last[0].values[0][0];
    res.status(201).json({ id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'server_error' }); }
});

// PATCH /merchant/products/:id - merchant updates their own product
router.patch('/products/:id', authRequired, merchantOnly, async (req, res) => {
  try {
    const db = await init();
    const id = Number(req.params.id);
    // verify ownership
    const sel = db.prepare('SELECT merchant_id FROM products WHERE id = :id');
    sel.bind({ ':id': id });
    if (!sel.step()) { sel.free(); return res.status(404).json({ error: 'not_found' }); }
    const row = sel.getAsObject(); sel.free();
    if (row.merchant_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });

    const allowed = ['title','description','price_cents','stock','image_url','status'];
    const updates = [];
    const params = { ':id': id };
    for (const k of allowed) {
      if (typeof req.body[k] !== 'undefined') {
        updates.push(`${k} = :${k}`);
        params[`:${k}`] = req.body[k];
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: 'invalid' });
    const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = :id`;
    const upd = db.prepare(sql);
    upd.bind(params);
    upd.step(); upd.free();
    await persist();
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'server_error' }); }
});

module.exports = router;
