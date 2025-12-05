import React, {useEffect, useState, useRef} from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import api from '../api'
import { useToast } from '../components/Toast'
import ImageWithFallback from '../components/ImageWithFallback'

export default function ProductDetail(){
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const loc = useLocation()
  const autoAddedRef = useRef(false)
  const toast = useToast()

  useEffect(()=>{
    fetch('/api/products/' + id).then(r=>r.json()).then(setProduct).catch(console.error)
  },[id])

  useEffect(()=>{
    // check query params for auto add
    if (!product) return
    const qp = new URLSearchParams(loc.search)
    const add = qp.get('add')
    const q = qp.get('qty')
    if (add === '1' && !autoAddedRef.current) {
      autoAddedRef.current = true
      const num = q ? Math.max(1, Number(q)) : 1
      setQty(num)
      // if user not logged in, let login page handle next redirect back here
      const token = api.getToken()
      if (!token) {
        // redirect to login with next preserving add instruction
        nav(`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`)
        return
      }
      // do add
      (async ()=>{
        try{
          setLoading(true)
          await api.request('/cart/items', { method: 'POST', body: JSON.stringify({ product_id: Number(id), quantity: num }) })
          nav('/cart')
        }catch(err){
          console.error('auto add failed', err)
          toast.push('自动加入购物车失败')
        }finally{ setLoading(false) }
      })()
    }
  },[product, loc])

  async function addToCart(){
    try{
      const token = api.getToken()
      if (!token){
        // not logged in: redirect to login and return here after login
        nav(`/login?next=${encodeURIComponent(loc.pathname + `?add=1&qty=${qty}`)}`)
        return
      }
      setLoading(true)
      await api.request('/cart/items', { method: 'POST', body: JSON.stringify({ product_id: Number(id), quantity: Number(qty) }) })
      toast.push('已加入购物车')
      nav('/cart')
    }catch(err){
      console.error(err)
      toast.push('加入购物车失败')
    }finally{ setLoading(false) }
  }

  if (!product) return <div className="container">Loading...</div>

  return (
    <div className="container">
      <div className="card" style={{display:'flex', gap:20}}>
-        <img src={product.image_url} alt="" style={{maxWidth:360, borderRadius:6}} />
+        <ImageWithFallback src={product.image_url} alt={product.title} style={{maxWidth:360, borderRadius:6}} />
         <div style={{flex:1}}>
          <h1>{product.title}</h1>
          <p style={{color:'var(--muted)'}}>Price: ¥{(product.price_cents/100).toFixed(2)}</p>
          <p style={{fontSize:13}}>Stock: {product.stock}</p>
          <p>{product.description}</p>

          <div style={{marginTop:12}}>
            {/* If product is not active, show not available message. If stock is zero, don't show add controls either. */}
            {product.status !== 'active' ? (
              <div>该商品暂时不可购买</div>
            ) : product.stock <= 0 ? (
              <div style={{color:'red'}}>缺货</div>
            ) : (
              <>
                <label>Quantity: </label>
                <input className="input" type="number" min="1" value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value || 1)))} style={{width:80}} />
                <button className="button" onClick={addToCart} style={{marginLeft:12}} disabled={loading}>
                  {loading ? <span className="spinner"/> : null}
                  {loading ? 'Adding...' : 'Add to cart'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
