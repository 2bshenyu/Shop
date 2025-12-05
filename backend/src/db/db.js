const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const lockfile = require('proper-lockfile');

const DB_DIR = path.resolve(__dirname, '..', '..', 'data');
const DB_FILE_DEFAULT = path.join(DB_DIR, 'app.sqlite');
const DB_FILE = process.env.TEST_DB_FILE ? path.resolve(process.env.TEST_DB_FILE) : DB_FILE_DEFAULT;

let SQL = null;
let _db = null;

async function init() {
  if (!SQL) {
    // locate the wasm file in node_modules/sql.js/dist/sql-wasm.wasm
    const wasmPath = path.join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    SQL = await initSqlJs({ locateFile: () => wasmPath });
  }
  if (_db) return _db;

  await fs.promises.mkdir(path.dirname(DB_FILE), { recursive: true });

  if (fs.existsSync(DB_FILE)) {
    const buffer = fs.readFileSync(DB_FILE);
    _db = new SQL.Database(new Uint8Array(buffer));
  } else {
    _db = new SQL.Database();
    // create tables
    _db.run(`
      CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, password_hash TEXT, name TEXT, role TEXT DEFAULT 'buyer', created_at TEXT);
      CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, merchant_id INTEGER, title TEXT, description TEXT, price_cents INTEGER, stock INTEGER, image_url TEXT, status TEXT DEFAULT 'active', created_at TEXT);
      CREATE TABLE carts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE, created_at TEXT);
      CREATE TABLE cart_items (id INTEGER PRIMARY KEY AUTOINCREMENT, cart_id INTEGER, product_id INTEGER, quantity INTEGER, unit_price_cents INTEGER);
      CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, total_cents INTEGER, status TEXT DEFAULT 'pending', created_at TEXT);
      CREATE TABLE order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER, product_id INTEGER, title TEXT, unit_price_cents INTEGER, quantity INTEGER, subtotal_cents INTEGER);
    `);
    await persist();
  }
  return _db;
}

async function persist() {
  if (!_db) throw new Error('DB not initialized');

  // ensure directory exists
  await fs.promises.mkdir(path.dirname(DB_FILE), { recursive: true });

  // acquire lock on DB_FILE to prevent concurrent writes
  let release = null;
  try {
    // If file doesn't exist yet, create an empty file to allow locking on Windows
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '');

    release = await lockfile.lock(DB_FILE, { retries: { retries: 5, factor: 2, minTimeout: 50 }, realpath: false });
    const data = _db.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
  } finally {
    if (release) await release();
  }
}

function getDB() {
  if (!_db) throw new Error('DB not initialized');
  return _db;
}

// Add reset function to remove DB file and clear in-memory DB so init() will recreate tables
async function reset() {
  // prevent accidental reset in production
  if (process.env.NODE_ENV === 'production') throw new Error('reset not allowed in production');

  // drop in-memory DB reference
  _db = null;
  // remove file if exists
  try {
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
  } catch (e) {
    // ignore
  }
  // re-run init to recreate DB and tables
  await init();
}

module.exports = { init, persist, getDB, __db_file: DB_FILE, reset };
