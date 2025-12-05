const { init, persist } = require('../db/db');

async function run() {
  const db = await init();
  // insert sample products
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
  await persist();
  console.log('Inserted sample products');
}

run().catch(err => { console.error(err); process.exit(1); });

