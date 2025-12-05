const express = require('express');
const router = express.Router();
const { init, persist, getDB } = require('../db/db');
const { authRequired } = require('../middleware/auth');

// Helper: get or create cart for user
async function ensureCart(db, userId) {
  const sel = db.prepare('SELECT id FROM carts WHERE user_id = :uid');
  sel.bind({ ':uid': userId });
  if (sel.step()) {
    const r = sel.getAsObject(); sel.free(); return r.id;
  }
  sel.free();
  const ins = db.prepare('INSERT INTO carts (user_id, created_at) VALUES (:uid, :now)');
  ins.bind({ ':uid': userId, ':now': new Date().toISOString() });
  ins.step(); ins.free();
  const rid = db.exec('SELECT last_insert_rowid()');
  const id = rid[0].values[0][0];
  return id;
}

// POST /cart/items { product_id, quantity }
router.post('/items', authRequired, async (req, res) => {
  try {
    const db = await init();
    const userId = req.user.id;
    const { product_id, quantity } = req.body;
    if (!product_id || !quantity) return res.status(400).json({ error: 'invalid' });

    // check product exists and status and stock
    const psel = db.prepare('SELECT id, stock, status, price_cents FROM products WHERE id = :pid');
    psel.bind({ ':pid': product_id });
    if (!psel.step()) { psel.free(); return res.status(404).json({ error: 'product_not_found' }); }
    const p = psel.getAsObject(); psel.free();
    if (p.status !== 'active') return res.status(400).json({ error: 'product_inactive' });
    if (Number(quantity) > p.stock) return res.status(400).json({ error: 'insufficient_stock', available: p.stock });

    const cartId = await ensureCart(db, userId);
    // check if item exists
    const sel = db.prepare('SELECT id, quantity FROM cart_items WHERE cart_id = :cid AND product_id = :pid');
    sel.bind({ ':cid': cartId, ':pid': product_id });
    if (sel.step()) {
      const row = sel.getAsObject(); sel.free();
      const newQty = row.quantity + Number(quantity);
      if (newQty > p.stock) return res.status(400).json({ error: 'insufficient_stock', available: p.stock });
      const upd = db.prepare('UPDATE cart_items SET quantity = :q WHERE id = :id');
      upd.bind({ ':q': newQty, ':id': row.id }); upd.step(); upd.free();
    } else {
      sel.free();
      // get product price snapshot (we already have p)
      const ins = db.prepare('INSERT INTO cart_items (cart_id, product_id, quantity, unit_price_cents) VALUES (:cid, :pid, :q, :u)');
      ins.bind({ ':cid': cartId, ':pid': product_id, ':q': quantity, ':u': p.price_cents }); ins.step(); ins.free();
    }
    await persist();
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'server_error' }); }
});

// PATCH /cart/items/:id - update quantity
router.patch('/items/:id', authRequired, async (req, res) => {
  try {
    const db = await init();
    const userId = req.user.id;
    const id = Number(req.params.id);
    const { quantity } = req.body;
    if (typeof quantity === 'undefined') return res.status(400).json({ error: 'invalid' });
    const sel = db.prepare('SELECT ci.id, ci.cart_id, ci.product_id, ci.quantity, p.stock FROM cart_items ci JOIN carts c ON c.id = ci.cart_id JOIN products p ON p.id = ci.product_id WHERE ci.id = :id AND c.user_id = :uid');
    sel.bind({ ':id': id, ':uid': userId });
    if (!sel.step()) { sel.free(); return res.status(404).json({ error: 'not_found' }); }
    const row = sel.getAsObject(); sel.free();
    const q = Number(quantity);
    if (q <= 0) return res.status(400).json({ error: 'invalid_quantity' });
    if (q > row.stock) return res.status(400).json({ error: 'insufficient_stock', available: row.stock });
    const upd = db.prepare('UPDATE cart_items SET quantity = :q WHERE id = :id');
    upd.bind({ ':q': q, ':id': id }); upd.step(); upd.free();
    await persist();
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'server_error' }); }
});

// DELETE /cart/items/:id - remove item
router.delete('/items/:id', authRequired, async (req, res) => {
  try {
    const db = await init();
    const userId = req.user.id;
    const id = Number(req.params.id);
    const sel = db.prepare('SELECT ci.id FROM cart_items ci JOIN carts c ON c.id = ci.cart_id WHERE ci.id = :id AND c.user_id = :uid');
    sel.bind({ ':id': id, ':uid': userId });
    if (!sel.step()) { sel.free(); return res.status(404).json({ error: 'not_found' }); }
    sel.free();
    const del = db.prepare('DELETE FROM cart_items WHERE id = :id');
    del.bind({ ':id': id }); del.step(); del.free();
    await persist();
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'server_error' }); }
});

// GET /cart
router.get('/', authRequired, async (req, res) => {
  try {
    const db = await init();
    const userId = req.user.id;
    const sel = db.prepare('SELECT c.id FROM carts c WHERE c.user_id = :uid');
    sel.bind({ ':uid': userId });
    if (!sel.step()) { sel.free(); return res.json({ items: [], total_cents: 0 }); }
    const cartId = sel.getAsObject().id; sel.free();
    const itemsStmt = db.prepare('SELECT ci.id, ci.product_id, ci.quantity, ci.unit_price_cents, p.title FROM cart_items ci LEFT JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = :cid');
    itemsStmt.bind({ ':cid': cartId });
    const items = [];
    while (itemsStmt.step()) { items.push(itemsStmt.getAsObject()); }
    itemsStmt.free();
    const total = items.reduce((s,it)=>s + it.quantity * it.unit_price_cents, 0);
    res.json({ items, total_cents: total });
  } catch (err) { console.error(err); res.status(500).json({ error: 'server_error' }); }
});

module.exports = router;
