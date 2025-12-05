const express = require('express');
const router = express.Router();
const { init, persist } = require('../db/db');
const { authRequired } = require('../middleware/auth');

// POST /orders  (checkout)
router.post('/', authRequired, async (req, res) => {
  try {
    const db = await init();
    const userId = req.user.id;

    // Get cart id
    const sel = db.prepare('SELECT id FROM carts WHERE user_id = :uid');
    sel.bind({ ':uid': userId });
    if (!sel.step()) { sel.free(); return res.status(400).json({ error: 'cart_empty' }); }
    const cartId = sel.getAsObject().id; sel.free();

    // Begin transaction
    db.run('BEGIN;');
    try {
      // read cart items
      const itemsStmt = db.prepare('SELECT ci.product_id, ci.quantity, ci.unit_price_cents, p.stock, p.title FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = :cid');
      itemsStmt.bind({ ':cid': cartId });
      const items = [];
      while (itemsStmt.step()) {
        items.push(itemsStmt.getAsObject());
      }
      itemsStmt.free();

      // check stock
      for (const it of items) {
        if (it.quantity > it.stock) {
          db.run('ROLLBACK;');
          return res.status(400).json({ error: 'insufficient_stock', product_id: it.product_id });
        }
      }

      // create order
      const total = items.reduce((s,it)=>s + it.quantity * it.unit_price_cents, 0);
      const ordIns = db.prepare('INSERT INTO orders (user_id, total_cents, status, created_at) VALUES (:uid, :total, :status, :now)');
      ordIns.bind({ ':uid': userId, ':total': total, ':status': 'paid', ':now': new Date().toISOString() }); ordIns.step(); ordIns.free();
      const last = db.exec('SELECT last_insert_rowid()');
      const orderId = last[0].values[0][0];

      // insert order items and reduce stock
      for (const it of items) {
        const oiIns = db.prepare('INSERT INTO order_items (order_id, product_id, title, unit_price_cents, quantity, subtotal_cents) VALUES (:oid, :pid, :title, :u, :q, :sub)');
        oiIns.bind({ ':oid': orderId, ':pid': it.product_id, ':title': it.title, ':u': it.unit_price_cents, ':q': it.quantity, ':sub': it.unit_price_cents * it.quantity }); oiIns.step(); oiIns.free();
        const upd = db.prepare('UPDATE products SET stock = stock - :q WHERE id = :pid');
        upd.bind({ ':q': it.quantity, ':pid': it.product_id }); upd.step(); upd.free();
      }

      // clear cart
      db.run('DELETE FROM cart_items WHERE cart_id = ' + cartId);

      db.run('COMMIT;');
      await persist();
      res.json({ ok: true, orderId });
    } catch (err) {
      console.error('txn err', err);
      try { db.run('ROLLBACK;'); } catch(e){}
      return res.status(500).json({ error: 'transaction_failed' });
    }

  } catch (err) { console.error(err); res.status(500).json({ error: 'server_error' }); }
});

// GET /orders/:id - return order details for authenticated user
router.get('/:id', authRequired, async (req, res) => {
  try {
    const db = await init();
    const id = Number(req.params.id);
    const userId = req.user.id;
    const ord = db.prepare('SELECT id, user_id, total_cents, status, created_at FROM orders WHERE id = :id');
    ord.bind({ ':id': id });
    if (!ord.step()) { ord.free(); return res.status(404).json({ error: 'not_found' }); }
    const order = ord.getAsObject(); ord.free();
    if (order.user_id !== userId) return res.status(403).json({ error: 'forbidden' });
    const itemsStmt = db.prepare('SELECT product_id, title, unit_price_cents, quantity, subtotal_cents FROM order_items WHERE order_id = :oid');
    itemsStmt.bind({ ':oid': id });
    const items = [];
    while (itemsStmt.step()) items.push(itemsStmt.getAsObject());
    itemsStmt.free();
    res.json({ order, items });
  } catch (err) { console.error(err); res.status(500).json({ error: 'server_error' }); }
});

module.exports = router;
