const BASE = 'http://localhost:3000';

async function waitForServer(timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(BASE + '/health');
      if (res.ok) return true;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error('server not reachable');
}

async function main(){
  try {
    console.log('waiting for server...');
    await waitForServer(8000);
    console.log('server reachable');

    // register
    const email = `buyer${Date.now()}@example.com`;
    const pw = 'pass123';
    let res = await fetch(BASE + '/auth/register', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ email, password: pw, name: 'Buyer' }) });
    const reg = await res.json();
    console.log('register:', res.status, JSON.stringify(reg));
    if (!reg.token) throw new Error('no token from register');
    const token = reg.token;

    // get products
    res = await fetch(BASE + '/products');
    const products = await res.json();
    console.log('products count:', products.length);
    if (!products.length) throw new Error('no products');
    const pid = products[0].id;
    console.log('using product id', pid);

    // add to cart
    res = await fetch(BASE + '/cart/items', { method: 'POST', headers: {'content-type':'application/json','authorization': 'Bearer ' + token}, body: JSON.stringify({ product_id: pid, quantity: 2 }) });
    console.log('/cart/items', res.status, await res.text());

    // checkout
    res = await fetch(BASE + '/orders', { method: 'POST', headers: {'content-type':'application/json','authorization': 'Bearer ' + token}, body: JSON.stringify({}) });
    const ord = await res.json();
    console.log('checkout:', res.status, JSON.stringify(ord));

    // check product stock
    res = await fetch(BASE + '/products/' + pid);
    const pAfter = await res.json();
    console.log('product after order:', JSON.stringify(pAfter));

    console.log('TEST FLOW COMPLETE');
  } catch (err) {
    console.error('ERROR', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
