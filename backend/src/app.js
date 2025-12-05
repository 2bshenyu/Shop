const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

// mount routes
app.use('/products', require('./routes/products'));
app.use('/auth', require('./routes/auth'));
app.use('/cart', require('./routes/cart'));
app.use('/orders', require('./routes/orders'));
app.use('/merchant', require('./routes/merchant'));

// admin routes (only available in non-production)
if (process.env.NODE_ENV !== 'production') {
  app.use('/_admin', require('./routes/admin'));
}

module.exports = app;
