import React, { useEffect, useState } from 'react'
import api from '../api'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../components/Toast'

export default function MerchantProductForm(){
  const { id } = useParams()
  const editMode = !!id
  const [form, setForm] = useState({ title: '', description: '', price_cents: 0, stock: 0, image_url: '' })
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const toast = useToast()

  useEffect(()=>{
    if (editMode) fetchProduct()
  },[id])

  async function fetchProduct(){
    try{
      const p = await api.request('/products/' + id)
      setForm({ title: p.title, description: p.description, price_cents: p.price_cents, stock: p.stock, image_url: p.image_url })
    }catch(err){ console.error(err); toast.push('获取商品失败') }
  }

  async function submit(e){
    e.preventDefault()
    try{
      setLoading(true)
      if (editMode) {
        await api.request('/merchant/products/' + id, { method: 'PATCH', body: JSON.stringify(form) })
      } else {
        await api.request('/merchant/products', { method: 'POST', body: JSON.stringify(form) })
      }
      toast.push('保存成功')
      nav('/merchant/products')
    }catch(err){
      if (err && err.status === 401) { nav(`/login?next=${encodeURIComponent(editMode?`/merchant/products/${id}/edit`:'/merchant/products/new')}`); return }
      if (err && err.status === 403) { toast.push('需要商家权限'); return }
      console.error(err); toast.push('保存失败')
    }finally{ setLoading(false) }
  }

  return (
    <div className="container">
      <div className="card">
        <h2>{editMode ? '编辑商品' : '新增商品'}</h2>
        <form onSubmit={submit}>
          <div>
            <label>名称</label>
            <input className="input" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} />
          </div>
          <div>
            <label>价格 (分)</label>
            <input className="input" type="number" value={form.price_cents} onChange={e=>setForm({...form, price_cents: Number(e.target.value)})} />
          </div>
          <div>
            <label>库存</label>
            <input className="input" type="number" value={form.stock} onChange={e=>setForm({...form, stock: Number(e.target.value)})} />
          </div>
          <div>
            <label>图片 URL</label>
            <input className="input" value={form.image_url} onChange={e=>setForm({...form, image_url: e.target.value})} />
          </div>
          <div>
            <label>描述</label>
            <textarea className="input" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
          </div>
          <div style={{marginTop:12}}>
            <button className="button" type="submit" disabled={loading}>
              {loading ? <span className="spinner"/> : null}
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
