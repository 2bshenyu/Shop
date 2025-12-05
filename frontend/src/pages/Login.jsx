import React, {useState} from 'react'
import api from '../api'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../components/Toast'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const loc = useLocation()
  const toast = useToast()

  async function onSubmit(e){
    e.preventDefault();
    try{
      setLoading(true)
      const res = await api.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      api.setToken(res.token);
      // handle next param
      const qp = new URLSearchParams(loc.search);
      const next = qp.get('next');
      if (next) {
        nav(next);
      } else {
        nav('/');
      }
    }catch(err){
      toast.push('登录失败')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card" style={{maxWidth:480, margin:'0 auto'}}>
        <h2>Login</h2>
        <form onSubmit={onSubmit} style={{display:'flex', flexDirection:'column', gap:8}}>
          <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" />
          <button className="button" type="submit" disabled={loading}>
            {loading ? <span className="spinner"/> : null}
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
