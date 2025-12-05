import React, { useEffect, useState } from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'

export default function AdminDashboard(){
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState([])
  const nav = useNavigate()
  const toast = useToast()

  useEffect(()=>{ fetchStatus() },[])

  async function fetchStatus(){
    try{
      const res = await api.request('/_admin/status')
      setStats(res)
      // also fetch products for quick management
      const prods = await api.request('/_admin/products')
      setProducts(prods)
    }catch(err){
      if (err && err.status === 401) { nav(`/login?next=/admin`); return }
      if (err && err.status === 403) { toast.push('需要管理员权限'); return }
      console.error(err); toast.push('获取状态失败')
    }
  }

  async function toggleStatus(prodId, toStatus){
    try{
      await api.request('/_admin/products/' + prodId + '/status', { method: 'PATCH', body: JSON.stringify({ status: toStatus }) })
      fetchStatus()
    }catch(err){
      if (err && err.status === 401) { nav(`/login?next=/admin`); return }
      if (err && err.status === 403) { toast.push('需要管理员权限'); return }
      console.error(err); toast.push('操作失败')
    }
  }

  if (!stats) return <div className="container">Loading...</div>

  return (
    <div className="container">
      <div className="card">
        <h2>系统状态</h2>
        {stats.inactive_products_count > 0 && (
          <div style={{color:'red', marginBottom:8}}>警告：存在已下架商品（{stats.inactive_products_count}）</div>
        )}
        <div>订单数: {stats.orders_count}</div>
        <div>用户数: {stats.users_count}</div>
        <div>商品总数: {stats.products_count} 下架数: {stats.inactive_products_count}</div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <h3>商品管理</h3>
        {products.map(p=> (
          <div key={p.id} style={{padding:8, borderBottom:'1px solid #eee'}}>
            <div><strong>{p.title}</strong> {p.status !== 'active' && <span style={{color:'red'}}>（已下架）</span>}</div>
            <div>价格: ¥{(p.price_cents/100).toFixed(2)} 库存: {p.stock}</div>
            <div style={{marginTop:6}}>
              {p.status === 'active' ? (
                <button className="button" onClick={()=>toggleStatus(p.id, 'inactive')}>下架</button>
              ) : (
                <button className="button" onClick={()=>toggleStatus(p.id, 'active')}>上架</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
