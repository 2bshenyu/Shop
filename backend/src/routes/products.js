const express = require('express');
const router = express.Router();
const { init, getDB, persist } = require('../db/db');

// GET /products
router.get('/', async (req, res) => {
  try {
    const db = await init();
    const q = req.query.q || '';
    const limit = Number(req.query.limit || 20);
    const offset = Number(req.query.offset || 0);

    const stmt = db.prepare("SELECT id, title, price_cents, stock, image_url, status FROM products WHERE status='active' AND title LIKE :q LIMIT :limit OFFSET :offset");
    stmt.bind({ ':q': `%${q}%`, ':limit': limit, ':offset': offset });
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// GET /products/:id
router.get('/:id', async (req, res) => {
  try {
    const db = await init();
    const id = Number(req.params.id);
    const stmt = db.prepare('SELECT * FROM products WHERE id = :id');
    stmt.bind({ ':id': id });
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      res.json(row);
    } else {
      stmt.free();
      res.status(404).json({ error: 'not_found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;

