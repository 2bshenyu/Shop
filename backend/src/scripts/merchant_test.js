(async ()=>{
  const base = 'http://localhost:3000';
  try{
    // register merchant
    const email = `merchant${Date.now()}@example.com`;
    const pw = 'mypass';
    let res = await fetch(base + '/auth/register', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ email, password: pw, name: 'Merchant', role: 'merchant' }) });
    const regText = await res.text();
    console.log('register merchant status', res.status);
    try{ console.log('register body', JSON.parse(regText)); } catch(e){ console.log('register body text', regText); }
    const reg = (()=>{ try{return JSON.parse(regText)}catch(e){return null}})();
    const token = reg && reg.token;

    // create product
    const prod = { title: 'Test Product '+Date.now(), description: 'desc', price_cents: 1000, stock: 5, image_url: 'https://via.placeholder.com/150' };
    res = await fetch(base + '/merchant/products', { method: 'POST', headers: {'content-type':'application/json','authorization':'Bearer '+token}, body: JSON.stringify(prod) });
    const createText = await res.text();
    console.log('create product status', res.status);
    try{ console.log('create body', JSON.parse(createText)); } catch(e){ console.log('create body text', createText.slice(0,1000)); }

    // fetch products
    res = await fetch(base + '/products');
    const listText = await res.text();
    console.log('products status', res.status);
    try{ const list = JSON.parse(listText); console.log('products count', list.length); const found = list.find(p=>p.title === prod.title); console.log('found?', !!found, found); } catch(e){ console.log('products body', listText.slice(0,1000)); }
  }catch(e){console.error('ERR', e);}
})();
