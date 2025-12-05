const { test, expect } = require('@playwright/test');

// This E2E test assumes backend running on localhost:3000 and frontend Vite dev server on localhost:5173

test('full buyer flow: register -> browse -> detail -> add to cart -> checkout', async ({ page }) => {
  // Reset backend DB to known state (only available in non-production)
  await page.request.get('/api/_admin/reset');

  // Register new user
  await page.goto('/');
  await page.click('a[href="/register"]');
  const email = `e2e${Date.now()}@example.com`;
  await page.fill('input[placeholder="email"]', email);
  await page.fill('input[placeholder="password"]', 'pass123');

  // submit and wait for the register request to complete (robust against SPA nav)
  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/auth/register') && r.status() === 201),
    page.click('button[type="submit"]'),
  ]);
  const body = await response.json();
  expect(body).toHaveProperty('token');

  // Wait for Products header to appear (home view)
  await page.waitForSelector('text=Products');

  // Choose a product with available stock by querying the API (avoid persisted sold-out items)
  const prodResp = await page.request.get('/api/products');
  const products = await prodResp.json();
  const product = products.find(p => p.stock > 0) || products[0];
  // Navigate to the product detail page directly
  await page.goto(`/products/${product.id}`);
  await page.waitForSelector('text=Add to cart');

  // Add to cart and wait for backend response
  const [addResp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/cart/items') ),
    page.click('text=Add to cart'),
  ]);
  expect(addResp.status()).toBe(200);

  // Should go to cart - wait for navigation and the cart GET to complete
  await page.waitForURL('**/cart');
  const cartResp = await page.waitForResponse(r => r.url().includes('/api/cart') && r.status() === 200);
  const cartBody = await cartResp.json();
  expect(cartBody).toHaveProperty('items');
  expect(cartBody.items.length).toBeGreaterThanOrEqual(1);

  await page.waitForSelector('text=Checkout');

  // Register dialog handler before triggering Checkout so Playwright can capture the alert
  page.on('dialog', async dialog => {
    await dialog.accept();
  });

  // Perform checkout and wait for backend orders response
  const [orderResp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/orders') ),
    page.click('text=Checkout'),
  ]);

  if (![200,201].includes(orderResp.status())){
    let errBody = null;
    try{ errBody = await orderResp.json(); } catch(e){ errBody = await orderResp.text(); }
    throw new Error('Order failed: ' + JSON.stringify({ status: orderResp.status(), body: errBody }));
  }

  // Wait for cart GET to show empty
  const postCartResp = await page.waitForResponse(r => r.url().includes('/api/cart') && r.status() === 200);
  const postCart = await postCartResp.json();
  expect(postCart.items.length).toBe(0);
  expect(postCart.total_cents).toBe(0);
});
