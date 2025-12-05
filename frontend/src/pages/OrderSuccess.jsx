import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'

export default function OrderSuccess(){
  const { id } = useParams()
  const [data, setData] = useState(null)

  useEffect(()=>{
    (async ()=>{
      try{
        const res = await api.request('/orders/' + id)
        setData(res)
      }catch(err){
        console.error(err)
      }
    })()
  },[id])

  if (!data) return <div className="container">Loading...</div>

  const { order, items } = data
  return (
    <div className="container">
      <div className="card">
        <h2>下单成功</h2>
        <div>订单编号: {order.id}</div>
        <div>总金额: ¥{(order.total_cents/100).toFixed(2)}</div>
        <div style={{marginTop:12}}>
          <h3>商品清单</h3>
          {items.map(it=> (
            <div key={it.product_id} style={{padding:8, borderBottom:'1px solid #eee'}}>
              <div><strong>{it.title}</strong></div>
              <div>单价: ¥{(it.unit_price_cents/100).toFixed(2)} x {it.quantity} = ¥{(it.subtotal_cents/100).toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:12}}>
          <Link className="button" to="/">回到商品列表</Link>
        </div>
      </div>
    </div>
  )
}

