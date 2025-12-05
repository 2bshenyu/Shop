import React, {useEffect, useState} from 'react'
import api from '../api'
import { useToast } from '../components/Toast'
import { useNavigate } from 'react-router-dom'

export default function Cart(){
  const [cart, setCart] = useState({ items: [], total_cents: 0 })
  const [loading, setLoading] = useState(false)
  const [itemLoading, setItemLoading] = useState({})
  const toast = useToast()
  const nav = useNavigate()

  useEffect(()=>{ fetchCart() },[])

  async function fetchCart(){
    try{
      const data = await api.request('/cart')
      setCart(data)
    }catch(err){ console.error(err); setCart({items:[], total_cents:0}) }
  }

  async function checkout(){
    try{
      setLoading(true)
      const res = await api.request('/orders', { method: 'POST', body: '{}' })
      toast.push('下单成功')
      fetchCart();
      if (res && res.orderId) {
        nav('/orders/' + res.orderId)
      }
    }catch(err){ toast.push('下单失败') }finally{ setLoading(false) }
  }

  async function updateItem(id, qty){
    try{
      setItemLoading(prev => ({...prev, [id]: true}))
      await api.request('/cart/items/' + id, { method: 'PATCH', body: JSON.stringify({ quantity: qty }) })
      toast.push('已更新数量')
      fetchCart()
    }catch(err){
      if (err && err.status === 401) {
        // redirect to login
        nav('/login?next=/cart')
        return
      }
      if (err && err.status === 403) {
        toast.push('无权操作')
        return
      }
      toast.push('更新失败')
    }finally{ setItemLoading(prev => ({...prev, [id]: false})) }
  }

  async function deleteItem(id){
    try{
      setItemLoading(prev => ({...prev, [id]: true}))
      await api.request('/cart/items/' + id, { method: 'DELETE' })
      toast.push('已删除')
      fetchCart()
    }catch(err){
      if (err && err.status === 401) { nav('/login?next=/cart'); return }
      if (err && err.status === 403) { toast.push('无权操作'); return }
      toast.push('删除失败')
    }finally{ setItemLoading(prev => ({...prev, [id]: false})) }
  }

  return (
    <div className="container">
      <div className="card">
        <h2>购物车</h2>
        <div>
          {cart.items.map(it=> (
            <div key={it.id} className="cart-item" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <strong>{it.title}</strong>
                <div style={{fontSize:12, color:'var(--muted)'}}>单价 ¥{(it.unit_price_cents/100).toFixed(2)}</div>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <input className="input" type="number" min="1" value={it.quantity} onChange={e=>{
                  const v = Math.max(1, Number(e.target.value || 1))
                  setCart(prev => ({...prev, items: prev.items.map(x => x.id === it.id ? {...x, quantity: v} : x)}))
                }} style={{width:80}} />
                <button className="button" onClick={()=>updateItem(it.id, it.quantity)} disabled={itemLoading[it.id]}>
                  {itemLoading[it.id] ? '...' : '保存'}
                </button>
                <button className="button" onClick={()=>deleteItem(it.id)} disabled={itemLoading[it.id]}>删除</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:12}}>Total: ¥{(cart.total_cents/100).toFixed(2)}</div>
        <button className="button" onClick={checkout} style={{marginTop:12}} disabled={loading}>
          {loading ? <span className="spinner"/> : null}
          {loading ? 'Processing...' : 'Checkout (simulate)'}
        </button>
      </div>
    </div>
  )
}
