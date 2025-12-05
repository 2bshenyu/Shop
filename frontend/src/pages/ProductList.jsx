import React, {useEffect, useState} from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import ImageWithFallback from '../components/ImageWithFallback'

export default function ProductList(){
  const [products, setProducts] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 9 // page size (3 columns x 3 rows)
  const [hasMore, setHasMore] = useState(false)

  useEffect(()=>{
    // initial load
    fetchProducts({ reset: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  async function fetchProducts({ reset=false } = {}){
    try{
      setLoading(true)
      const useOffset = reset ? 0 : offset
      const data = await api.request('/products' + (q ? `?q=${encodeURIComponent(q)}&limit=${limit}&offset=${useOffset}` : `?limit=${limit}&offset=${useOffset}`))
      if (reset) {
        setProducts(data)
        setOffset(data.length)
      } else {
        setProducts(prev => [...prev, ...data])
        setOffset(prev => prev + data.length)
      }
      setHasMore(Array.isArray(data) && data.length === limit)
    }catch(err){
      console.error(err)
      if (reset) setProducts([])
    }finally{ setLoading(false) }
  }

  function onSearch(e){
    e.preventDefault();
    // reset paging when searching
    setOffset(0)
    fetchProducts({ reset: true })
  }

  return (
    <div>
      <div className="header">
        <div className="container" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h1 style={{margin:0}}>Products</h1>
          <div className="nav">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/cart">Cart</Link>
            <Link to="/merchant/products">商家管理</Link>
            <Link to="/admin">管理员后台</Link>
          </div>
        </div>
      </div>

      <div className="container">
        <div style={{marginTop:16, marginBottom:12}}>
          <form onSubmit={onSearch} style={{display:'flex', gap:8}}>
            <input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search" />
            <button className="button" type="submit" disabled={loading}>
              {loading ? <span className="spinner"/> : null}
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {(!loading && products.length === 0) ? (
          <div className="card" style={{padding:20, textAlign:'center'}}>未找到相关商品</div>
        ) : (
          <>
            <div className="grid">
              {products.map(p=> (
                <div key={p.id} className="card product-card">
                  <ImageWithFallback src={p.image_url} alt={p.title} style={{width:'100%', height:150, objectFit:'cover'}} />
                  <h3>{p.title}</h3>
                  <p style={{color:'var(--muted)'}}>¥{(p.price_cents/100).toFixed(2)}</p>
                  {p.stock <= 0 ? (
                    <p style={{fontSize:12, color:'red'}}>缺货</p>
                  ) : (
                    <p style={{fontSize:12}}>库存: {p.stock}</p>
                  )}
                  <div style={{marginTop:8}}>
                    <Link className="button" to={`/products/${p.id}`} style={{padding:'6px 10px', display:'inline-block'}}>Details</Link>
                  </div>
                </div>
              ))}
            </div>

            <div style={{textAlign:'center', marginTop:16}}>
              {hasMore ? (
                <button className="button" onClick={() => fetchProducts({ reset: false })} disabled={loading}>
                  {loading ? <span className="spinner"/> : null}
                  {loading ? 'Loading...' : '加载更多'}
                </button>
              ) : (
                products.length > 0 && <div style={{color:'var(--muted)'}}>已显示全部商品</div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
