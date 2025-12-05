import React, { useEffect, useState } from 'react'
import api from '../api'
import { Link } from 'react-router-dom'

export default function MerchantProducts(){
  const [items, setItems] = useState([])

  useEffect(()=>{ fetchList() },[])

  async function fetchList(){
    try{
      const res = await api.request('/merchant/products')
      setItems(res)
    }catch(err){ console.error(err) }
  }

  return (
    <div className="container">
      <div className="card">
        <h2>我的商品</h2>
        <div style={{marginBottom:12}}>
          <Link className="button" to="/merchant/products/new">新增商品</Link>
        </div>
        <div>
          {items.map(it=> (
            <div key={it.id} style={{padding:8, borderBottom:'1px solid #eee'}}>
              <div><strong>{it.title}</strong> {it.status !== 'active' && <span style={{color:'red'}}>（已下架）</span>}</div>
              <div>价格: ¥{(it.price_cents/100).toFixed(2)} 库存: {it.stock}</div>
              <div style={{marginTop:6}}>
                <Link className="button" to={`/merchant/products/${it.id}/edit`}>编辑</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

