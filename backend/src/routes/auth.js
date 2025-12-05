const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { init, getDB, persist } = require('../db/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const db = await init();
    const { email, password, name, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email_password_required' });
    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password_hash, name, role, created_at) VALUES (:email, :hash, :name, :role, :created_at)');
    stmt.bind({ ':email': email, ':hash': hash, ':name': name || '', ':role': role || 'buyer', ':created_at': new Date().toISOString() });
    stmt.step();
    stmt.free();
    await persist();
    // get inserted user id
    const resExec = db.exec("SELECT id, email, name, role FROM users WHERE email = '" + email + "'");
    const user = (resExec[0] && resExec[0].values && resExec[0].values[0]) ? resExec[0].values[0] : null;
    if (!user) return res.status(500).json({ error: 'user_lookup_failed' });
    const [id, userEmail, userName, userRole] = user;
    const token = jwt.sign({ id, email: userEmail, role: userRole }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id, email: userEmail, name: userName, role: userRole } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const db = await init();
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email_password_required' });
    const stmt = db.prepare('SELECT id, email, password_hash, name, role FROM users WHERE email = :email');
    stmt.bind({ ':email': email });
    if (!stmt.step()) {
      stmt.free();
      return res.status(401).json({ error: 'invalid_credentials' });
    }
    const row = stmt.getAsObject();
    stmt.free();
    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) return res.status(401).json({ error: 'invalid_credentials' });
    const token = jwt.sign({ id: row.id, email: row.email, role: row.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: row.id, email: row.email, name: row.name, role: row.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
